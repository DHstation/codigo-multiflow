import AppError from "../../errors/AppError";
import EmailTemplate from "../../models/EmailTemplate";
import User from "../../models/User";
import EmailSequenceStep from "../../models/EmailSequenceStep";
import EmailSequence from "../../models/EmailSequence";

interface Request {
  id: string | number;
  companyId: number;
}

const ShowEmailTemplateService = async ({
  id,
  companyId
}: Request): Promise<EmailTemplate> => {
  const emailTemplate = await EmailTemplate.findOne({
    where: {
      id,
      companyId
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      },
      {
        model: EmailSequenceStep,
        as: "sequenceSteps",
        include: [
          {
            model: EmailSequence,
            as: "sequence",
            attributes: ["id", "name", "active"]
          }
        ]
      }
    ]
  });

  if (!emailTemplate) {
    throw new AppError("ERR_NO_EMAIL_TEMPLATE_FOUND", 404);
  }

  return emailTemplate;
};

export default ShowEmailTemplateService;