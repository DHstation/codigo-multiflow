import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateEmailSequenceService from "../services/EmailServices/CreateEmailSequenceService";
import EmailSequence from "../models/EmailSequence";
import EmailSequenceStep from "../models/EmailSequenceStep";
import EmailTemplate from "../models/EmailTemplate";
import WebhookLink from "../models/WebhookLink";
import User from "../models/User";
import EmailJob from "../models/EmailJob";
import { Op } from "sequelize";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  webhookLinkId: string;
  active: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, webhookLinkId, active } = req.query as IndexQuery;
  const { companyId } = req.user;

  const whereCondition: any = {
    companyId
  };

  if (searchParam) {
    whereCondition[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${searchParam}%`
        }
      },
      {
        description: {
          [Op.iLike]: `%${searchParam}%`
        }
      }
    ];
  }

  if (webhookLinkId) {
    whereCondition.webhookLinkId = webhookLinkId;
  }

  if (active !== undefined) {
    whereCondition.active = active === 'true';
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: emailSequences } = await EmailSequence.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      },
      {
        model: WebhookLink,
        as: "webhookLink",
        attributes: ["id", "name", "platform"]
      },
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
      }
    ]
  });

  const hasMore = count > offset + emailSequences.length;

  return res.json({ emailSequences, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { sequenceId } = req.params;
  const { companyId } = req.user;

  const emailSequence = await EmailSequence.findOne({
    where: {
      id: sequenceId,
      companyId
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      },
      {
        model: WebhookLink,
        as: "webhookLink"
      },
      {
        model: EmailSequenceStep,
        as: "steps",
        include: [
          {
            model: EmailTemplate,
            as: "template"
          }
        ],
        order: [["stepOrder", "ASC"]]
      }
    ]
  });

  if (!emailSequence) {
    return res.status(404).json({ error: "Sequência de email não encontrada" });
  }

  return res.status(200).json(emailSequence);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    description,
    webhookLinkId,
    triggerEvent,
    triggerConditions,
    settings,
    steps
  } = req.body;
  const { companyId, id: userId } = req.user;

  const emailSequence = await CreateEmailSequenceService({
    name,
    description,
    webhookLinkId,
    triggerEvent,
    triggerConditions,
    settings,
    steps,
    companyId,
    userId
  });

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailSequence`, {
      action: "create",
      emailSequence
    });

  return res.status(200).json(emailSequence);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { sequenceId } = req.params;
  const {
    name,
    description,
    triggerEvent,
    triggerConditions,
    settings,
    active,
    steps
  } = req.body;
  const { companyId } = req.user;

  const emailSequence = await EmailSequence.findOne({
    where: {
      id: sequenceId,
      companyId
    }
  });

  if (!emailSequence) {
    return res.status(404).json({ error: "Sequência de email não encontrada" });
  }

  // Atualizar sequência
  await emailSequence.update({
    name: name || emailSequence.name,
    description: description !== undefined ? description : emailSequence.description,
    triggerEvent: triggerEvent || emailSequence.triggerEvent,
    triggerConditions: triggerConditions !== undefined ? triggerConditions : emailSequence.triggerConditions,
    settings: settings !== undefined ? settings : emailSequence.settings,
    active: active !== undefined ? active : emailSequence.active
  });

  // Atualizar steps se fornecidos
  if (steps) {
    // Remover steps existentes
    await EmailSequenceStep.destroy({
      where: { sequenceId: emailSequence.id }
    });

    // Criar novos steps
    if (steps.length > 0) {
      const sequenceSteps = steps.map((step: any) => ({
        sequenceId: emailSequence.id,
        templateId: step.templateId,
        stepOrder: step.stepOrder,
        delayMinutes: step.delayMinutes,
        delayType: step.delayType || 'fixed_delay',
        delayConfig: step.delayConfig,
        conditions: step.conditions,
        active: step.active !== undefined ? step.active : true
      }));

      await EmailSequenceStep.bulkCreate(sequenceSteps);
    }
  }

  // Buscar sequência atualizada com relacionamentos
  const updatedSequence = await EmailSequence.findByPk(emailSequence.id, {
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

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailSequence`, {
      action: "update",
      emailSequence: updatedSequence
    });

  return res.status(200).json(updatedSequence);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { sequenceId } = req.params;
  const { companyId } = req.user;

  const emailSequence = await EmailSequence.findOne({
    where: {
      id: sequenceId,
      companyId
    }
  });

  if (!emailSequence) {
    return res.status(404).json({ error: "Sequência de email não encontrada" });
  }

  // Verificar se há jobs pendentes
  const pendingJobs = await EmailJob.findAll({
    where: {
      sequenceId: emailSequence.id,
      status: ['pending', 'processing']
    }
  });

  if (pendingJobs.length > 0) {
    // Se há jobs pendentes, apenas desativar
    await emailSequence.update({ active: false });

    // Cancelar jobs pendentes
    await EmailJob.update(
      { status: 'cancelled' },
      {
        where: {
          sequenceId: emailSequence.id,
          status: ['pending', 'processing']
        }
      }
    );
  } else {
    // Se não há jobs pendentes, pode deletar
    await emailSequence.destroy();
  }

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailSequence`, {
      action: "delete",
      sequenceId: emailSequence.id
    });

  return res.status(200).json({ message: "Sequência de email deletada" });
};

// Endpoint para estatísticas da sequência
export const statistics = async (req: Request, res: Response): Promise<Response> => {
  const { sequenceId } = req.params;
  const { companyId } = req.user;

  const emailSequence = await EmailSequence.findOne({
    where: {
      id: sequenceId,
      companyId
    }
  });

  if (!emailSequence) {
    return res.status(404).json({ error: "Sequência de email não encontrada" });
  }

  // Buscar estatísticas dos jobs
  const jobStats = await EmailJob.findAll({
    where: { sequenceId: emailSequence.id },
    attributes: [
      'status',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['status']
  });

  // Buscar estatísticas dos steps
  const stepStats = await EmailSequenceStep.findAll({
    where: { sequenceId: emailSequence.id },
    attributes: ['stepOrder', 'executionCount', 'successCount', 'failureCount'],
    include: [
      {
        model: EmailTemplate,
        as: "template",
        attributes: ["name", "subject"]
      }
    ],
    order: [["stepOrder", "ASC"]]
  });

  const statistics = {
    sequence: {
      totalExecutions: emailSequence.totalExecutions,
      successfulExecutions: emailSequence.successfulExecutions,
      lastExecutionAt: emailSequence.lastExecutionAt
    },
    jobs: jobStats,
    steps: stepStats
  };

  return res.status(200).json(statistics);
};