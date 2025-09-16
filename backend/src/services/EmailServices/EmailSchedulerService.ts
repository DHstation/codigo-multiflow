import cron from 'node-cron';
import { Op } from 'sequelize';
import EmailJob from '../../models/EmailJob';
import { addEmailToQueue } from '../../queues/EmailQueue';
import logger from '../../utils/logger';

class EmailSchedulerService {
  private static instance: EmailSchedulerService;
  private isRunning = false;

  public static getInstance(): EmailSchedulerService {
    if (!EmailSchedulerService.instance) {
      EmailSchedulerService.instance = new EmailSchedulerService();
    }
    return EmailSchedulerService.instance;
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('[EMAIL SCHEDULER] Scheduler já está rodando');
      return;
    }

    // Verificar emails agendados a cada minuto
    cron.schedule('* * * * *', async () => {
      await this.processScheduledEmails();
    });

    // Limpeza de jobs antigos a cada hora
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldJobs();
    });

    this.isRunning = true;
    logger.info('[EMAIL SCHEDULER] Scheduler iniciado - Verificando emails a cada minuto');
  }

  public stop(): void {
    this.isRunning = false;
    logger.info('[EMAIL SCHEDULER] Scheduler parado');
  }

  private async processScheduledEmails(): Promise<void> {
    try {
      const now = new Date();

      // Buscar emails agendados para agora ou antes
      const scheduledEmails = await EmailJob.findAll({
        where: {
          status: 'pending',
          scheduledAt: {
            [Op.lte]: now
          }
        },
        limit: 100, // Processar 100 por vez para não sobrecarregar
        order: [['scheduledAt', 'ASC']]
      });

      if (scheduledEmails.length === 0) {
        return;
      }

      logger.info(`[EMAIL SCHEDULER] Processando ${scheduledEmails.length} emails agendados`);

      for (const emailJob of scheduledEmails) {
        try {
          // Adicionar à fila de processamento
          await addEmailToQueue(emailJob.id);

          // Atualizar status para evitar reprocessamento
          await emailJob.update({
            status: 'processing'
          });

        } catch (error) {
          logger.error(`[EMAIL SCHEDULER] Erro ao processar EmailJob ${emailJob.id}: ${error.message}`);

          // Marcar como falhado se houver erro
          await emailJob.update({
            status: 'failed',
            errorMessage: error.message,
            attempts: emailJob.attempts + 1
          });
        }
      }

    } catch (error) {
      logger.error(`[EMAIL SCHEDULER] Erro no scheduler: ${error.message}`);
    }
  }

  private async cleanupOldJobs(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Deletar jobs antigos que foram enviados ou falharam
      const deletedCount = await EmailJob.destroy({
        where: {
          status: {
            [Op.in]: ['sent', 'failed', 'cancelled']
          },
          createdAt: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      if (deletedCount > 0) {
        logger.info(`[EMAIL SCHEDULER] Limpeza: ${deletedCount} jobs antigos removidos`);
      }

    } catch (error) {
      logger.error(`[EMAIL SCHEDULER] Erro na limpeza: ${error.message}`);
    }
  }

  // Método para agendar um email específico
  public async scheduleEmail(emailJobId: number, scheduledAt: Date): Promise<void> {
    try {
      const emailJob = await EmailJob.findByPk(emailJobId);

      if (!emailJob) {
        throw new Error(`EmailJob ${emailJobId} não encontrado`);
      }

      await emailJob.update({
        scheduledAt,
        status: 'pending'
      });

      logger.info(`[EMAIL SCHEDULER] Email agendado - Job: ${emailJobId}, Data: ${scheduledAt.toISOString()}`);

    } catch (error) {
      logger.error(`[EMAIL SCHEDULER] Erro ao agendar email ${emailJobId}: ${error.message}`);
      throw error;
    }
  }

  // Método para cancelar email agendado
  public async cancelEmail(emailJobId: number): Promise<void> {
    try {
      const emailJob = await EmailJob.findByPk(emailJobId);

      if (!emailJob) {
        throw new Error(`EmailJob ${emailJobId} não encontrado`);
      }

      if (emailJob.status === 'sent') {
        throw new Error('Não é possível cancelar email já enviado');
      }

      await emailJob.update({
        status: 'cancelled'
      });

      logger.info(`[EMAIL SCHEDULER] Email cancelado - Job: ${emailJobId}`);

    } catch (error) {
      logger.error(`[EMAIL SCHEDULER] Erro ao cancelar email ${emailJobId}: ${error.message}`);
      throw error;
    }
  }

  // Método para obter estatísticas da fila
  public async getQueueStats(): Promise<any> {
    try {
      const stats = await EmailJob.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status']
      });

      const result = {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0
      };

      stats.forEach((stat: any) => {
        result[stat.status] = parseInt(stat.get('count'));
      });

      return result;

    } catch (error) {
      logger.error(`[EMAIL SCHEDULER] Erro ao obter estatísticas: ${error.message}`);
      throw error;
    }
  }
}

export default EmailSchedulerService;