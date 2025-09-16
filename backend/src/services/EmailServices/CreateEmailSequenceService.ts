import AppError from "../../errors/AppError";
import EmailSequence from "../../models/EmailSequence";
import EmailSequenceStep from "../../models/EmailSequenceStep";
import WebhookLink from "../../models/WebhookLink";
import EmailTemplate from "../../models/EmailTemplate";

interface SequenceStep {
  templateId: number;
  stepOrder: number;
  delayMinutes: number;
  delayType?: string;
  delayConfig?: object;
  conditions?: object;
}

interface Request {
  name: string;
  description?: string;
  webhookLinkId: number;
  triggerEvent: string;
  triggerConditions?: object;
  settings?: object;
  steps: SequenceStep[];
  companyId: number;
  userId: number;
}

const CreateEmailSequenceService = async ({
  name,
  description,
  webhookLinkId,
  triggerEvent,
  triggerConditions,
  settings,
  steps,
  companyId,
  userId
}: Request): Promise<EmailSequence> => {

  // Verificar se o webhook link existe e pertence à empresa
  const webhookLink = await WebhookLink.findOne({
    where: {
      id: webhookLinkId,
      companyId
    }
  });

  if (!webhookLink) {
    throw new AppError("ERR_WEBHOOK_LINK_NOT_FOUND", 404);
  }

  // Verificar se já existe sequência com mesmo nome na empresa
  const existingSequence = await EmailSequence.findOne({
    where: {
      name,
      companyId
    }
  });

  if (existingSequence) {
    throw new AppError("ERR_EMAIL_SEQUENCE_NAME_EXISTS", 400);
  }

  // Validar se todos os templates dos steps existem e pertencem à empresa
  if (steps && steps.length > 0) {
    const templateIds = steps.map(step => step.templateId);
    const templates = await EmailTemplate.findAll({
      where: {
        id: templateIds,
        companyId,
        active: true
      }
    });

    if (templates.length !== templateIds.length) {
      throw new AppError("ERR_SOME_EMAIL_TEMPLATES_NOT_FOUND", 400);
    }
  }

  // Criar a sequência
  const emailSequence = await EmailSequence.create({
    name,
    description,
    webhookLinkId,
    triggerEvent,
    triggerConditions,
    settings,
    companyId,
    userId,
    active: true
  });

  // Criar os steps da sequência
  if (steps && steps.length > 0) {
    const sequenceSteps = steps.map(step => ({
      sequenceId: emailSequence.id,
      templateId: step.templateId,
      stepOrder: step.stepOrder,
      delayMinutes: step.delayMinutes,
      delayType: step.delayType || 'fixed_delay',
      delayConfig: step.delayConfig,
      conditions: step.conditions,
      active: true
    }));

    await EmailSequenceStep.bulkCreate(sequenceSteps);
  }

  // Retornar a sequência com os steps
  const sequenceWithSteps = await EmailSequence.findByPk(emailSequence.id, {
    include: [
      {
        model: EmailSequenceStep,
        as: "steps",
        include: [
          {
            model: EmailTemplate,
            as: "template",
            attributes: ["id", "name", "subject"]
          }
        ],
        order: [["stepOrder", "ASC"]]
      },
      {
        model: WebhookLink,
        as: "webhookLink",
        attributes: ["id", "name", "platform"]
      }
    ]
  });

  return sequenceWithSteps!;
};

export default CreateEmailSequenceService;