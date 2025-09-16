import { Request, Response } from "express";
import EmailWebhookLink from "../models/EmailWebhookLink";
import EmailWebhookLog from "../models/EmailWebhookLog";
import EmailTemplate from "../models/EmailTemplate";
import { extractVariables, determineEventType } from "../utils/PaymentDataExtractor";
import { SendMail } from "../helpers/SendMail";
import logger from "../utils/logger";

export const receiveEmailWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { webhookHash } = req.params;
  const payload = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const startTime = Date.now();

  try {
    // 1. Buscar webhook pelo hash
    const webhook = await EmailWebhookLink.findOne({
      where: {
        webhookHash,
        active: true
      },
      include: [
        {
          model: EmailTemplate,
          as: "emailTemplate"
        }
      ]
    });

    if (!webhook) {
      logger.warn(`[EMAIL WEBHOOK] Webhook não encontrado: ${webhookHash}`);
      return res.status(404).json({ error: "Webhook not found" });
    }

    // 2. Extrair variáveis do payload
    const extractedVariables = extractVariables(webhook.platform, payload);
    const eventType = determineEventType(webhook.platform, payload);

    logger.info(`[EMAIL WEBHOOK] Processando webhook ${webhook.name} - Evento: ${eventType} - Email: ${extractedVariables.customer_email}`);

    // 3. Verificar se o evento deve disparar este webhook
    if (!webhook.triggerEvents.includes(eventType)) {
      logger.info(`[EMAIL WEBHOOK] Evento ${eventType} não está configurado para disparar este webhook`);

      await EmailWebhookLog.create({
        emailWebhookLinkId: webhook.id,
        companyId: webhook.companyId,
        platform: webhook.platform,
        eventType,
        payloadRaw: payload,
        payloadProcessed: extractedVariables,
        variablesExtracted: extractedVariables,
        emailStatus: 'skipped',
        httpStatus: 200,
        responseTimeMs: Date.now() - startTime,
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        message: "Event not configured to trigger email"
      });
    }

    // 4. Calcular quando enviar o email
    let scheduledFor = new Date();

    switch (webhook.delayType) {
      case 'minutes':
        scheduledFor.setMinutes(scheduledFor.getMinutes() + webhook.delayValue);
        break;
      case 'hours':
        scheduledFor.setHours(scheduledFor.getHours() + webhook.delayValue);
        break;
      case 'days':
        scheduledFor.setDate(scheduledFor.getDate() + webhook.delayValue);
        break;
      // 'immediate' mantém a data atual
    }

    // 5. Processar template de email
    let emailSubject = webhook.emailTemplate.subject;
    let emailContent = webhook.emailTemplate.htmlContent;

    // Substituir variáveis no template
    Object.keys(extractedVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = String(extractedVariables[key] || '');

      emailSubject = emailSubject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      emailContent = emailContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // 6. Salvar log do processamento
    const webhookLog = await EmailWebhookLog.create({
      emailWebhookLinkId: webhook.id,
      companyId: webhook.companyId,
      platform: webhook.platform,
      eventType,
      payloadRaw: payload,
      payloadProcessed: extractedVariables,
      variablesExtracted: extractedVariables,
      recipientEmail: extractedVariables.customer_email,
      recipientName: extractedVariables.customer_name,
      emailSubject,
      emailScheduled: webhook.delayType !== 'immediate',
      scheduledFor: webhook.delayType !== 'immediate' ? scheduledFor : null,
      emailStatus: 'pending',
      httpStatus: 200,
      responseTimeMs: Date.now() - startTime,
      ipAddress,
      userAgent
    });

    // 7. Agendar ou enviar email imediatamente
    if (webhook.delayType === 'immediate') {
      // Enviar email imediatamente
      try {
        await SendMail({
          to: extractedVariables.customer_email,
          subject: emailSubject,
          html: emailContent
        });

        // Atualizar log como enviado
        await webhookLog.update({
          emailStatus: 'sent',
          sentAt: new Date()
        });

        // Incrementar contador de emails enviados
        await webhook.update({
          emailsSent: webhook.emailsSent + 1
        });

        logger.info(`[EMAIL WEBHOOK] Email enviado imediatamente para ${extractedVariables.customer_email} - Log ID: ${webhookLog.id}`);
      } catch (emailError) {
        logger.error(`[EMAIL WEBHOOK] Erro ao enviar email - Log ID: ${webhookLog.id} - Erro: ${emailError.message}`);

        await webhookLog.update({
          emailStatus: 'failed',
          errorMessage: emailError.message
        });
      }
    } else {
      // TODO: Implementar sistema de agendamento com Bull Queue ou similar
      logger.info(`[EMAIL WEBHOOK] Email agendado para ${scheduledFor.toISOString()} - Log ID: ${webhookLog.id}`);

      // Por enquanto, enviar imediatamente mesmo com delay (pode implementar fila depois)
      try {
        await SendMail({
          to: extractedVariables.customer_email,
          subject: emailSubject,
          html: emailContent
        });

        await webhookLog.update({
          emailStatus: 'sent',
          sentAt: new Date()
        });

        await webhook.update({
          emailsSent: webhook.emailsSent + 1
        });

        logger.info(`[EMAIL WEBHOOK] Email com delay enviado para ${extractedVariables.customer_email} - Log ID: ${webhookLog.id}`);
      } catch (emailError) {
        logger.error(`[EMAIL WEBHOOK] Erro ao enviar email agendado - Log ID: ${webhookLog.id} - Erro: ${emailError.message}`);

        await webhookLog.update({
          emailStatus: 'failed',
          errorMessage: emailError.message
        });
      }
    }

    // 8. Atualizar estatísticas do webhook
    await webhook.update({
      totalRequests: webhook.totalRequests + 1,
      successfulRequests: webhook.successfulRequests + 1,
      lastRequestAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Email webhook processed successfully",
      emailScheduled: webhook.delayType !== 'immediate',
      scheduledFor: webhook.delayType !== 'immediate' ? scheduledFor : null
    });

  } catch (error) {
    logger.error(`[EMAIL WEBHOOK] Erro ao processar webhook ${webhookHash}: ${error.message}`);

    // Salvar log de erro se conseguir identificar o webhook
    try {
      const webhook = await EmailWebhookLink.findOne({
        where: { webhookHash }
      });

      if (webhook) {
        await EmailWebhookLog.create({
          emailWebhookLinkId: webhook.id,
          companyId: webhook.companyId,
          platform: webhook.platform,
          eventType: 'error',
          payloadRaw: payload,
          emailStatus: 'failed',
          httpStatus: 500,
          responseTimeMs: Date.now() - startTime,
          errorMessage: error.message,
          ipAddress,
          userAgent
        });

        await webhook.update({
          totalRequests: webhook.totalRequests + 1,
          lastRequestAt: new Date()
        });
      }
    } catch (logError) {
      logger.error(`[EMAIL WEBHOOK] Erro ao salvar log de erro: ${logError.message}`);
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const testEmailWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { webhookHash } = req.params;

  try {
    const webhook = await EmailWebhookLink.findOne({
      where: {
        webhookHash,
        active: true
      },
      include: [
        {
          model: EmailTemplate,
          as: "emailTemplate",
          attributes: ["name", "subject"]
        }
      ]
    });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    return res.status(200).json({
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        platform: webhook.platform,
        delayType: webhook.delayType,
        delayValue: webhook.delayValue,
        triggerEvents: webhook.triggerEvents,
        emailTemplate: webhook.emailTemplate
      }
    });

  } catch (error) {
    logger.error(`[EMAIL WEBHOOK TEST] Erro: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const trackEmailOpen = async (req: Request, res: Response): Promise<Response> => {
  const { dispatchId } = req.params;

  try {
    // TODO: Implementar tracking de abertura
    logger.info(`[EMAIL TRACKING] Email aberto - Dispatch ID: ${dispatchId}`);

    // Retorna um pixel transparente 1x1
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.end(pixel);

  } catch (error) {
    logger.error(`[EMAIL TRACKING] Erro ao rastrear abertura: ${error.message}`);
    return res.status(500).end();
  }
};

export const trackEmailClick = async (req: Request, res: Response): Promise<Response> => {
  const { dispatchId } = req.params;
  const { url } = req.query;

  try {
    // TODO: Implementar tracking de clique
    logger.info(`[EMAIL TRACKING] Link clicado - Dispatch ID: ${dispatchId} - URL: ${url}`);

    // Redirecionar para a URL original
    if (url && typeof url === 'string') {
      res.redirect(url);
      return res;
    } else {
      return res.status(400).json({ error: "URL parameter required" });
    }

  } catch (error) {
    logger.error(`[EMAIL TRACKING] Erro ao rastrear clique: ${error.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
};