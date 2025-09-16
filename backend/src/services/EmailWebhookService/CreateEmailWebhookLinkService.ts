import EmailWebhookLink from "../../models/EmailWebhookLink";
import EmailTemplate from "../../models/EmailTemplate";
import AppError from "../../errors/AppError";

interface Request {
  name: string;
  description?: string;
  platform: string;
  emailTemplateId: number;
  delayType: 'immediate' | 'minutes' | 'hours' | 'days';
  delayValue: number;
  triggerEvents?: string[];
  companyId: number;
  userId: number;
}

const CreateEmailWebhookLinkService = async ({
  name,
  description = "",
  platform,
  emailTemplateId,
  delayType = 'immediate',
  delayValue = 0,
  triggerEvents = [],
  companyId,
  userId
}: Request): Promise<EmailWebhookLink> => {

  // Verificar se o template de email existe e pertence à empresa
  const emailTemplate = await EmailTemplate.findOne({
    where: {
      id: emailTemplateId,
      companyId
    }
  });

  if (!emailTemplate) {
    throw new AppError("ERR_EMAIL_TEMPLATE_NOT_FOUND", 404);
  }

  // Verificar se já existe webhook com mesmo nome na empresa
  const existingWebhook = await EmailWebhookLink.findOne({
    where: {
      name,
      companyId
    }
  });

  if (existingWebhook) {
    throw new AppError("ERR_EMAIL_WEBHOOK_NAME_EXISTS", 400);
  }

  // Validar delayType e delayValue
  if (delayType !== 'immediate' && delayValue <= 0) {
    throw new AppError("ERR_INVALID_DELAY_VALUE", 400);
  }

  // Definir eventos padrão por plataforma se não fornecidos
  if (triggerEvents.length === 0) {
    const defaultEvents: Record<string, string[]> = {
      'kiwify': ['order.approved', 'order.refused', 'order.canceled'],
      'hotmart': ['PURCHASE_COMPLETE', 'PURCHASE_CANCELED', 'PURCHASE_REFUNDED'],
      'braip': ['purchase.approved', 'purchase.canceled', 'purchase.refunded'],
      'monetizze': ['venda.aprovada', 'venda.cancelada', 'venda.reembolsada'],
      'cacto': ['purchase.approved', 'purchase.canceled', 'purchase.refunded'],
      'perfectpay': ['sale.approved', 'sale.canceled', 'sale.refunded'],
      'eduzz': ['order.approved', 'order.canceled', 'order.refunded'],
      'generic': ['payment.approved', 'payment.failed', 'payment.canceled']
    };

    triggerEvents = defaultEvents[platform.toLowerCase()] || defaultEvents['generic'];
  }

  const emailWebhook = await EmailWebhookLink.create({
    name,
    description,
    platform,
    emailTemplateId,
    delayType,
    delayValue,
    triggerEvents,
    companyId,
    userId,
    active: true,
    totalRequests: 0,
    successfulRequests: 0,
    emailsSent: 0,
    metadata: {}
  });

  // Incluir o template na resposta
  const webhookWithTemplate = await EmailWebhookLink.findByPk(emailWebhook.id, {
    include: [
      {
        model: EmailTemplate,
        as: 'emailTemplate'
      }
    ]
  });

  return webhookWithTemplate!;
};

export default CreateEmailWebhookLinkService;