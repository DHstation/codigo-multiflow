import EmailWebhookLink from "../../models/EmailWebhookLink";
import EmailWebhookLog from "../../models/EmailWebhookLog";
import AppError from "../../errors/AppError";

interface Request {
  webhookId: number;
  companyId: number;
}

const DeleteEmailWebhookLinkService = async ({
  webhookId,
  companyId
}: Request): Promise<void> => {

  const webhook = await EmailWebhookLink.findOne({
    where: {
      id: webhookId,
      companyId
    }
  });

  if (!webhook) {
    throw new AppError("ERR_EMAIL_WEBHOOK_NOT_FOUND", 404);
  }

  // Primeiro deletar os logs relacionados
  await EmailWebhookLog.destroy({
    where: {
      emailWebhookLinkId: webhookId
    }
  });

  // Depois deletar o webhook
  await webhook.destroy();
};

export default DeleteEmailWebhookLinkService;