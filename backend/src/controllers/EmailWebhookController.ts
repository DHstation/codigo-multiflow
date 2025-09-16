import { Request, Response } from "express";
import CreateEmailWebhookLinkService from "../services/EmailWebhookService/CreateEmailWebhookLinkService";
import ListEmailWebhookLinksService from "../services/EmailWebhookService/ListEmailWebhookLinksService";
import ShowEmailWebhookLinkService from "../services/EmailWebhookService/ShowEmailWebhookLinkService";
import UpdateEmailWebhookLinkService from "../services/EmailWebhookService/UpdateEmailWebhookLinkService";
import DeleteEmailWebhookLinkService from "../services/EmailWebhookService/DeleteEmailWebhookLinkService";

export const createEmailWebhook = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    description,
    platform,
    emailTemplateId,
    delayType,
    delayValue,
    triggerEvents
  } = req.body;
  const { companyId } = req.user;
  const userId = parseInt(req.user.id);

  const webhook = await CreateEmailWebhookLinkService({
    name,
    description,
    platform,
    emailTemplateId,
    delayType,
    delayValue,
    triggerEvents,
    companyId,
    userId
  });

  return res.status(201).json(webhook);
};

export const listEmailWebhooks = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, pageNumber } = req.query;

  const { webhooks, count, hasMore } = await ListEmailWebhookLinksService({
    companyId,
    searchParam: searchParam as string,
    pageNumber: pageNumber as string
  });

  return res.status(200).json({ webhooks, count, hasMore });
};

export const showEmailWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { webhookId } = req.params;
  const { companyId } = req.user;

  const webhook = await ShowEmailWebhookLinkService({
    webhookId: parseInt(webhookId),
    companyId
  });

  return res.status(200).json(webhook);
};

export const updateEmailWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { webhookId } = req.params;
  const { companyId } = req.user;
  const updateData = req.body;

  const webhook = await UpdateEmailWebhookLinkService({
    webhookId: parseInt(webhookId),
    companyId,
    updateData
  });

  return res.status(200).json(webhook);
};

export const deleteEmailWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { webhookId } = req.params;
  const { companyId } = req.user;

  await DeleteEmailWebhookLinkService({
    webhookId: parseInt(webhookId),
    companyId
  });

  return res.status(200).json({ message: "Webhook de e-mail deletado com sucesso" });
};