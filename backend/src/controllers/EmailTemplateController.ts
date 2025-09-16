import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateEmailTemplateService from "../services/EmailServices/CreateEmailTemplateService";
import ListEmailTemplatesService from "../services/EmailServices/ListEmailTemplatesService";
import ShowEmailTemplateService from "../services/EmailServices/ShowEmailTemplateService";
import UpdateEmailTemplateService from "../services/EmailServices/UpdateEmailTemplateService";
import DeleteEmailTemplateService from "../services/EmailServices/DeleteEmailTemplateService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  category: string;
  active: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, category, active } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { emailTemplates, count, hasMore } = await ListEmailTemplatesService({
    searchParam,
    pageNumber,
    companyId,
    category,
    active: active !== undefined ? active === 'true' : undefined
  });

  return res.json({ emailTemplates, count, hasMore });
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const { companyId } = req.user;

  const emailTemplate = await ShowEmailTemplateService({
    id: templateId,
    companyId
  });

  return res.status(200).json(emailTemplate);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    description,
    subject,
    htmlContent,
    textContent,
    designJson,
    variables,
    category,
    metadata
  } = req.body;
  const { companyId, id: userId } = req.user;

  const emailTemplate = await CreateEmailTemplateService({
    name,
    description,
    subject,
    htmlContent,
    textContent,
    designJson,
    variables,
    category,
    metadata,
    companyId,
    userId
  });

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailTemplate`, {
      action: "create",
      emailTemplate
    });

  return res.status(200).json(emailTemplate);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const {
    name,
    description,
    subject,
    htmlContent,
    textContent,
    designJson,
    variables,
    category,
    metadata,
    active
  } = req.body;
  const { companyId, id: userId } = req.user;

  const emailTemplate = await UpdateEmailTemplateService({
    id: templateId,
    name,
    description,
    subject,
    htmlContent,
    textContent,
    designJson,
    variables,
    category,
    metadata,
    active,
    companyId,
    userId
  });

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailTemplate`, {
      action: "update",
      emailTemplate
    });

  return res.status(200).json(emailTemplate);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const { companyId } = req.user;

  await DeleteEmailTemplateService({
    id: templateId,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailTemplate`, {
      action: "delete",
      templateId
    });

  return res.status(200).json({ message: "Template de email deletado" });
};

// Endpoint para duplicar template
export const duplicate = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const { companyId, id: userId } = req.user;

  // Buscar template original
  const originalTemplate = await ShowEmailTemplateService({
    id: templateId,
    companyId
  });

  // Criar novo template baseado no original
  const duplicatedTemplate = await CreateEmailTemplateService({
    name: `${originalTemplate.name} (Cópia)`,
    description: originalTemplate.description,
    subject: originalTemplate.subject,
    htmlContent: originalTemplate.htmlContent,
    textContent: originalTemplate.textContent,
    designJson: originalTemplate.designJson,
    variables: originalTemplate.variables,
    category: originalTemplate.category,
    metadata: originalTemplate.metadata,
    companyId,
    userId
  });

  const io = getIO();
  io.to(`company-${companyId}-maindashboard`)
    .emit(`company-${companyId}-emailTemplate`, {
      action: "create",
      emailTemplate: duplicatedTemplate
    });

  return res.status(200).json(duplicatedTemplate);
};

// Endpoint para pré-visualização do template
export const preview = async (req: Request, res: Response): Promise<Response> => {
  const { htmlContent, variables } = req.body;

  // Processar template com variáveis de exemplo
  let processedHtml = htmlContent;

  if (variables && variables.variables) {
    for (const variable of variables.variables) {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, variable.example || `[${variable.name}]`);
    }
  }

  return res.status(200).json({
    processedHtml,
    originalHtml: htmlContent
  });
};