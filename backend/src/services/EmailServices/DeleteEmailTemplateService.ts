import AppError from "../../errors/AppError";
import EmailTemplate from "../../models/EmailTemplate";
import EmailSequenceStep from "../../models/EmailSequenceStep";

interface Request {
  id: string | number;
  companyId: number;
}

const DeleteEmailTemplateService = async ({
  id,
  companyId
}: Request): Promise<void> => {
  const emailTemplate = await EmailTemplate.findOne({
    where: {
      id,
      companyId
    }
  });

  if (!emailTemplate) {
    throw new AppError("ERR_NO_EMAIL_TEMPLATE_FOUND", 404);
  }

  // Verificar se o template está sendo usado em alguma sequência ativa
  const sequenceStepsUsingTemplate = await EmailSequenceStep.findAll({
    where: {
      templateId: id,
      active: true
    },
    include: [
      {
        model: EmailSequence,
        as: "sequence",
        where: {
          active: true
        }
      }
    ]
  });

  if (sequenceStepsUsingTemplate.length > 0) {
    throw new AppError("ERR_EMAIL_TEMPLATE_IN_USE", 400);
  }

  // Desativar ao invés de deletar se houver histórico
  const sequenceStepsHistory = await EmailSequenceStep.findAll({
    where: {
      templateId: id
    }
  });

  if (sequenceStepsHistory.length > 0) {
    // Se há histórico, apenas desativar
    await emailTemplate.update({ active: false });
  } else {
    // Se não há histórico, pode deletar
    await emailTemplate.destroy();
  }
};

export default DeleteEmailTemplateService;