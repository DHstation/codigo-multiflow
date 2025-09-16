import EmailTemplate from "../../models/EmailTemplate";
import EmailWebhookLink from "../../models/EmailWebhookLink";
import AppError from "../../errors/AppError";

interface Request {
  templateId: number;
  companyId: number;
}

const DeleteEmailTemplateService = async ({
  templateId,
  companyId
}: Request): Promise<void> => {

  const template = await EmailTemplate.findOne({
    where: {
      id: templateId,
      companyId
    }
  });

  if (!template) {
    throw new AppError("ERR_EMAIL_TEMPLATE_NOT_FOUND", 404);
  }

  // Verificar se há webhooks usando este template
  const webhooksUsingTemplate = await EmailWebhookLink.count({
    where: {
      emailTemplateId: templateId,
      companyId
    }
  });

  if (webhooksUsingTemplate > 0) {
    throw new AppError("ERR_EMAIL_TEMPLATE_IN_USE", 400);
  }

  await template.destroy();
};

export default DeleteEmailTemplateService;