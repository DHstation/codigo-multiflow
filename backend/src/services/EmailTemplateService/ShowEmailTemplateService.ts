import EmailTemplate from "../../models/EmailTemplate";
import AppError from "../../errors/AppError";

interface Request {
  templateId: number;
  companyId: number;
}

const ShowEmailTemplateService = async ({
  templateId,
  companyId
}: Request): Promise<EmailTemplate> => {

  const template = await EmailTemplate.findOne({
    where: {
      id: templateId,
      companyId
    },
    include: [
      {
        association: "user",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!template) {
    throw new AppError("ERR_EMAIL_TEMPLATE_NOT_FOUND", 404);
  }

  return template;
};

export default ShowEmailTemplateService;