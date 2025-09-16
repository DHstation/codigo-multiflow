import EmailWebhookLink from "../../models/EmailWebhookLink";
import EmailTemplate from "../../models/EmailTemplate";
import AppError from "../../errors/AppError";

interface Request {
  webhookId: number;
  companyId: number;
}

const ShowEmailWebhookLinkService = async ({
  webhookId,
  companyId
}: Request): Promise<EmailWebhookLink> => {

  const webhook = await EmailWebhookLink.findOne({
    where: {
      id: webhookId,
      companyId
    },
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

  if (!webhook) {
    throw new AppError("ERR_EMAIL_WEBHOOK_NOT_FOUND", 404);
  }

  return webhook;
};

export default ShowEmailWebhookLinkService;