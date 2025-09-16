import { Request, Response } from "express";
import CreateEmailTemplateService from "../services/EmailTemplateService/CreateEmailTemplateService";
import ListEmailTemplatesService from "../services/EmailTemplateService/ListEmailTemplatesService";
import ShowEmailTemplateService from "../services/EmailTemplateService/ShowEmailTemplateService";
import UpdateEmailTemplateService from "../services/EmailTemplateService/UpdateEmailTemplateService";
import DeleteEmailTemplateService from "../services/EmailTemplateService/DeleteEmailTemplateService";

export const createEmailTemplate = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    description,
    subject,
    htmlContent,
    textContent,
    variables,
    previewData
  } = req.body;
  const { companyId } = req.user;
  const userId = parseInt(req.user.id);

  const template = await CreateEmailTemplateService({
    name,
    description,
    subject,
    htmlContent,
    textContent,
    variables,
    previewData,
    companyId,
    userId
  });

  return res.status(201).json(template);
};

export const listEmailTemplates = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, pageNumber } = req.query;

  const { templates, count, hasMore } = await ListEmailTemplatesService({
    companyId,
    searchParam: searchParam as string,
    pageNumber: pageNumber as string
  });

  return res.status(200).json({ templates, count, hasMore });
};

export const showEmailTemplate = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const { companyId } = req.user;

  const template = await ShowEmailTemplateService({
    templateId: parseInt(templateId),
    companyId
  });

  return res.status(200).json(template);
};

export const updateEmailTemplate = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const { companyId } = req.user;
  const updateData = req.body;

  const template = await UpdateEmailTemplateService({
    templateId: parseInt(templateId),
    companyId,
    updateData
  });

  return res.status(200).json(template);
};

export const deleteEmailTemplate = async (req: Request, res: Response): Promise<Response> => {
  const { templateId } = req.params;
  const { companyId } = req.user;

  await DeleteEmailTemplateService({
    templateId: parseInt(templateId),
    companyId
  });

  return res.status(200).json({ message: "Template de e-mail deletado com sucesso" });
};