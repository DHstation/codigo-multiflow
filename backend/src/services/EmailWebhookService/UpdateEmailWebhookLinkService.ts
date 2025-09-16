import EmailWebhookLink from "../../models/EmailWebhookLink";
import EmailTemplate from "../../models/EmailTemplate";
import AppError from "../../errors/AppError";

interface Request {
  webhookId: number;
  companyId: number;
  updateData: {
    name?: string;
    description?: string;
    platform?: string;
    emailTemplateId?: number;
    delayType?: string;
    delayValue?: number;
    triggerEvents?: string[];
    active?: boolean;
  };
}

const UpdateEmailWebhookLinkService = async ({
  webhookId,
  companyId,
  updateData
}: Request): Promise<EmailWebhookLink> => {

  const webhook = await EmailWebhookLink.findOne({
    where: {
      id: webhookId,
      companyId
    }
  });

  if (!webhook) {
    throw new AppError("ERR_EMAIL_WEBHOOK_NOT_FOUND", 404);
  }

  // Se está mudando o template, verificar se existe
  if (updateData.emailTemplateId && updateData.emailTemplateId !== webhook.emailTemplateId) {
    const template = await EmailTemplate.findOne({
      where: {
        id: updateData.emailTemplateId,
        companyId
      }
    });

    if (!template) {
      throw new AppError("ERR_EMAIL_TEMPLATE_NOT_FOUND", 404);
    }
  }

  // Se está mudando o nome, verificar se não conflita
  if (updateData.name && updateData.name !== webhook.name) {
    const existingWebhook = await EmailWebhookLink.findOne({
      where: {
        name: updateData.name,
        companyId,
        id: { [require('sequelize').Op.ne]: webhookId }
      }
    });

    if (existingWebhook) {
      throw new AppError("ERR_EMAIL_WEBHOOK_NAME_EXISTS", 400);
    }
  }

  // Validar delayType e delayValue
  if (updateData.delayType !== undefined && updateData.delayValue !== undefined) {
    if (updateData.delayType !== 'immediate' && updateData.delayValue <= 0) {
      throw new AppError("ERR_INVALID_DELAY_VALUE", 400);
    }
  }

  await webhook.update(updateData);

  return webhook.reload({
    include: [
      {
        model: EmailTemplate,
        as: "emailTemplate"
      },
      {
        association: "user",
        attributes: ["id", "name"]
      }
    ]
  });
};

export default UpdateEmailWebhookLinkService;