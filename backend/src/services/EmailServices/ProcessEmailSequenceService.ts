import EmailSequence from "../../models/EmailSequence";
import EmailSequenceStep from "../../models/EmailSequenceStep";
import EmailTemplate from "../../models/EmailTemplate";
import EmailJob from "../../models/EmailJob";
import { StandardizedPaymentData } from "../../utils/PaymentDataExtractor";
import logger from "../../utils/logger";
import { addEmailToQueue } from "../../queues/EmailQueue";

interface ProcessSequenceRequest {
  sequence: EmailSequence;
  variables: StandardizedPaymentData;
  triggerEvent: string;
}

const ProcessEmailSequenceService = async ({
  sequence,
  variables,
  triggerEvent
}: ProcessSequenceRequest): Promise<void> => {

  try {
    logger.info(`[EMAIL SEQUENCE] Processando sequência ${sequence.name} para evento ${triggerEvent}`);

    // Verificar se a sequência está ativa
    if (!sequence.active) {
      logger.warn(`[EMAIL SEQUENCE] Sequência ${sequence.name} está inativa`);
      return;
    }

    // Verificar se tem email válido
    if (!variables.customer_email) {
      logger.warn(`[EMAIL SEQUENCE] Email não encontrado para sequência ${sequence.name}`);
      return;
    }

    // Verificar condições de trigger se existirem
    if (sequence.triggerConditions && !evaluateTriggerConditions(sequence.triggerConditions, variables, triggerEvent)) {
      logger.info(`[EMAIL SEQUENCE] Condições de trigger não atendidas para sequência ${sequence.name}`);
      return;
    }

    // Buscar steps da sequência
    const steps = await EmailSequenceStep.findAll({
      where: {
        sequenceId: sequence.id,
        active: true
      },
      include: [
        {
          model: EmailTemplate,
          as: "template",
          where: { active: true }
        }
      ],
      order: [["stepOrder", "ASC"]]
    });

    if (steps.length === 0) {
      logger.warn(`[EMAIL SEQUENCE] Nenhum step ativo encontrado para sequência ${sequence.name}`);
      return;
    }

    // Processar cada step da sequência
    const baseScheduledTime = new Date();

    for (const step of steps) {
      // Verificar condições do step se existirem
      if (step.conditions && !evaluateStepConditions(step.conditions, variables)) {
        logger.info(`[EMAIL SEQUENCE] Condições do step ${step.stepOrder} não atendidas`);
        continue;
      }

      // Calcular horário de envio
      const scheduledAt = calculateScheduledTime(baseScheduledTime, step);

      // Criar job na fila
      const emailJob = await EmailJob.create({
        companyId: sequence.companyId,
        sequenceId: sequence.id,
        stepId: step.id,
        templateId: step.templateId,
        recipientEmail: variables.customer_email,
        recipientName: variables.customer_name || 'Cliente',
        variables: variables,
        scheduledAt,
        status: 'pending',
        priority: determineEmailPriority(step.stepOrder, triggerEvent)
      });

      logger.info(`[EMAIL SEQUENCE] Job criado para step ${step.stepOrder} - Email: ${variables.customer_email}, Agendado para: ${scheduledAt}`);

      // Adicionar à fila de processamento
      try {
        await addEmailToQueue(emailJob.id);
        logger.info(`[EMAIL SEQUENCE] Job ${emailJob.id} adicionado à fila com sucesso`);
      } catch (queueError) {
        logger.error(`[EMAIL SEQUENCE] Erro ao adicionar job ${emailJob.id} à fila: ${queueError.message}`);

        // Marcar job como falhado se não conseguir adicionar à fila
        await emailJob.update({
          status: 'failed',
          errorMessage: `Erro na fila: ${queueError.message}`
        });
      }

      // Atualizar contador do step
      await step.increment('executionCount');
    }

    // Atualizar estatísticas da sequência
    await sequence.update({
      totalExecutions: sequence.totalExecutions + 1,
      lastExecutionAt: new Date()
    });

    logger.info(`[EMAIL SEQUENCE] Sequência ${sequence.name} processada com sucesso`);

  } catch (error) {
    logger.error(`[EMAIL SEQUENCE] Erro ao processar sequência ${sequence.name}: ${error.message}`);
    throw error;
  }
};

// Avaliar condições de trigger
function evaluateTriggerConditions(conditions: any, variables: StandardizedPaymentData, triggerEvent: string): boolean {
  try {
    // Implementar lógica de avaliação de condições
    // Por exemplo: verificar status, valor, plataforma, etc.

    if (conditions.requiredStatus && variables.transaction_status !== conditions.requiredStatus) {
      return false;
    }

    if (conditions.minimumAmount && parseFloat(variables.transaction_amount) < conditions.minimumAmount) {
      return false;
    }

    if (conditions.platforms && !conditions.platforms.includes(variables.webhook_platform)) {
      return false;
    }

    if (conditions.events && !conditions.events.includes(triggerEvent)) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`[EMAIL SEQUENCE] Erro ao avaliar condições de trigger: ${error.message}`);
    return false;
  }
}

// Avaliar condições do step
function evaluateStepConditions(conditions: any, variables: StandardizedPaymentData): boolean {
  try {
    // Implementar lógica específica de condições por step
    return true; // Por enquanto sempre verdadeiro
  } catch (error) {
    logger.error(`[EMAIL SEQUENCE] Erro ao avaliar condições do step: ${error.message}`);
    return false;
  }
}

// Calcular horário de envio baseado no delay
function calculateScheduledTime(baseTime: Date, step: EmailSequenceStep): Date {
  const scheduledAt = new Date(baseTime);

  switch (step.delayType) {
    case 'immediate':
      // Sem delay
      break;

    case 'fixed_delay':
      scheduledAt.setMinutes(scheduledAt.getMinutes() + step.delayMinutes);
      break;

    case 'business_hours':
      // Implementar lógica de horário comercial
      scheduledAt.setMinutes(scheduledAt.getMinutes() + step.delayMinutes);
      scheduledAt = adjustToBusinessHours(scheduledAt, step.delayConfig);
      break;

    case 'specific_time':
      // Implementar lógica de horário específico
      if (step.delayConfig && step.delayConfig.hour !== undefined) {
        scheduledAt.setHours(step.delayConfig.hour, step.delayConfig.minute || 0, 0, 0);
        if (scheduledAt <= baseTime) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
      }
      break;

    default:
      scheduledAt.setMinutes(scheduledAt.getMinutes() + step.delayMinutes);
  }

  return scheduledAt;
}

// Ajustar para horário comercial
function adjustToBusinessHours(date: Date, config: any): Date {
  const adjusted = new Date(date);
  const hour = adjusted.getHours();
  const dayOfWeek = adjusted.getDay();

  const startHour = config?.startHour || 9;
  const endHour = config?.endHour || 18;

  // Se é final de semana, mover para segunda-feira
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const daysToAdd = dayOfWeek === 0 ? 1 : 2;
    adjusted.setDate(adjusted.getDate() + daysToAdd);
    adjusted.setHours(startHour, 0, 0, 0);
  }
  // Se é fora do horário comercial
  else if (hour < startHour) {
    adjusted.setHours(startHour, 0, 0, 0);
  } else if (hour >= endHour) {
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(startHour, 0, 0, 0);
  }

  return adjusted;
}

// Determinar prioridade do email
function determineEmailPriority(stepOrder: number, triggerEvent: string): string {
  if (stepOrder === 1 || triggerEvent === 'immediate') {
    return 'high';
  } else if (stepOrder <= 3) {
    return 'normal';
  } else {
    return 'low';
  }
}

export default ProcessEmailSequenceService;