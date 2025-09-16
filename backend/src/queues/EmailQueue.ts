import Bull from 'bull';
import { SendMail } from '../helpers/SendMail';
import EmailJob from '../models/EmailJob';
import EmailTemplate from '../models/EmailTemplate';
import EmailSequence from '../models/EmailSequence';
import EmailSequenceStep from '../models/EmailSequenceStep';
import logger from '../utils/logger';

const emailQueue = new Bull('EmailQueue', process.env.REDIS_URI || 'redis://localhost:6379');

// Configurar concorrência
emailQueue.process('send-email', 5, async (job) => {
  const { emailJobId } = job.data;

  try {
    const emailJob = await EmailJob.findByPk(emailJobId, {
      include: [
        {
          model: EmailTemplate,
          as: "template"
        },
        {
          model: EmailSequenceStep,
          as: "step",
          include: [
            {
              model: EmailSequence,
              as: "sequence"
            }
          ]
        }
      ]
    });

    if (!emailJob) {
      throw new Error(`EmailJob ${emailJobId} não encontrado`);
    }

    if (emailJob.status !== 'pending') {
      logger.warn(`[EMAIL QUEUE] Job ${emailJobId} não está pendente: ${emailJob.status}`);
      return;
    }

    // Atualizar status para processando
    await emailJob.update({
      status: 'processing',
      processedAt: new Date()
    });

    logger.info(`[EMAIL QUEUE] Processando email job ${emailJobId} - Para: ${emailJob.recipientEmail}`);

    // Processar template com variáveis
    const processedHtml = processTemplate(
      emailJob.template.htmlContent,
      emailJob.variables
    );

    const processedSubject = processTemplate(
      emailJob.template.subject,
      emailJob.variables
    );

    // Enviar email
    const mailResult = await SendMail({
      to: emailJob.recipientEmail,
      subject: processedSubject,
      html: processedHtml,
      text: emailJob.template.textContent ? processTemplate(emailJob.template.textContent, emailJob.variables) : undefined
    });

    // Atualizar status de sucesso
    await emailJob.update({
      status: 'sent',
      sentAt: new Date(),
      messageId: mailResult.messageId || null,
      deliveryInfo: {
        provider: 'nodemailer',
        messageId: mailResult.messageId,
        response: mailResult.response
      }
    });

    // Atualizar contadores da sequência e step
    if (emailJob.step) {
      await emailJob.step.increment('successCount');
    }

    if (emailJob.step?.sequence) {
      await emailJob.step.sequence.increment('successfulExecutions');
    }

    logger.info(`[EMAIL QUEUE] Email enviado com sucesso - Job: ${emailJobId}, MessageID: ${mailResult.messageId}`);

    return {
      success: true,
      messageId: mailResult.messageId,
      emailJobId
    };

  } catch (error) {
    logger.error(`[EMAIL QUEUE] Erro ao enviar email - Job: ${emailJobId}: ${error.message}`);

    try {
      const emailJob = await EmailJob.findByPk(emailJobId);
      if (emailJob) {
        const newAttempts = emailJob.attempts + 1;

        await emailJob.update({
          status: newAttempts >= 3 ? 'failed' : 'pending',
          errorMessage: error.message,
          attempts: newAttempts
        });

        // Atualizar contador de falha no step
        if (newAttempts >= 3) {
          const step = await EmailSequenceStep.findByPk(emailJob.stepId);
          if (step) {
            await step.increment('failureCount');
          }
        }

        // Reagendar se não excedeu tentativas
        if (newAttempts < 3) {
          const delay = Math.pow(2, newAttempts) * 60000; // Backoff exponencial

          await emailQueue.add('send-email', { emailJobId }, {
            delay,
            attempts: 1,
            backoff: 'fixed'
          });

          logger.info(`[EMAIL QUEUE] Email reagendado - Job: ${emailJobId}, Tentativa: ${newAttempts}, Delay: ${delay}ms`);
        } else {
          logger.error(`[EMAIL QUEUE] Email falhado definitivamente - Job: ${emailJobId}`);
        }
      }
    } catch (updateError) {
      logger.error(`[EMAIL QUEUE] Erro ao atualizar status do job ${emailJobId}: ${updateError.message}`);
    }

    throw error;
  }
});

// Função para processar templates com variáveis
function processTemplate(template: string, variables: any): string {
  if (!template || !variables) return template;

  let processed = template;

  // Processar variáveis no formato {{variable}}
  const regex = /\{\{([^}]+)\}\}/g;
  processed = processed.replace(regex, (match, varName) => {
    const trimmedVarName = varName.trim();
    const value = variables[trimmedVarName];

    if (value !== undefined && value !== null) {
      return String(value);
    }

    // Se não encontrar a variável, manter o placeholder
    logger.warn(`[EMAIL QUEUE] Variável não encontrada: ${trimmedVarName}`);
    return match;
  });

  return processed;
}

// Função para adicionar job de email na fila
export const addEmailToQueue = async (emailJobId: number, options: any = {}) => {
  try {
    const emailJob = await EmailJob.findByPk(emailJobId);

    if (!emailJob) {
      throw new Error(`EmailJob ${emailJobId} não encontrado`);
    }

    const delay = emailJob.scheduledAt ?
      Math.max(0, new Date(emailJob.scheduledAt).getTime() - Date.now()) : 0;

    const jobOptions = {
      delay,
      attempts: 1,
      removeOnComplete: 100, // Manter últimos 100 jobs completos
      removeOnFail: 50,      // Manter últimos 50 jobs falhos
      ...options
    };

    const queueJob = await emailQueue.add('send-email', { emailJobId }, jobOptions);

    logger.info(`[EMAIL QUEUE] Job adicionado à fila - EmailJob: ${emailJobId}, QueueJob: ${queueJob.id}, Delay: ${delay}ms`);

    return queueJob;
  } catch (error) {
    logger.error(`[EMAIL QUEUE] Erro ao adicionar job à fila: ${error.message}`);
    throw error;
  }
};

// Event listeners para monitoramento
emailQueue.on('completed', (job, result) => {
  logger.info(`[EMAIL QUEUE] Job concluído: ${job.id}`, result);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`[EMAIL QUEUE] Job falhou: ${job.id}`, err.message);
});

emailQueue.on('stalled', (job) => {
  logger.warn(`[EMAIL QUEUE] Job travado: ${job.id}`);
});

export default emailQueue;