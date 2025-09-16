import { Router } from "express";
import multer from "multer";

import * as EmailTemplateController from "../controllers/EmailTemplateController";
import * as EmailWebhookLinkController from "../controllers/EmailWebhookLinkController";
import * as EmailWebhookReceiverController from "../controllers/EmailWebhookReceiverController";

import isAuth from "../middleware/isAuth";

const upload = multer();
const emailWebhookRoutes = Router();

// Email Template routes
emailWebhookRoutes.get("/email-templates", isAuth, EmailTemplateController.listEmailTemplates);
emailWebhookRoutes.post("/email-templates", isAuth, EmailTemplateController.createEmailTemplate);
emailWebhookRoutes.get("/email-templates/:templateId", isAuth, EmailTemplateController.showEmailTemplate);
emailWebhookRoutes.put("/email-templates/:templateId", isAuth, EmailTemplateController.updateEmailTemplate);
emailWebhookRoutes.delete("/email-templates/:templateId", isAuth, EmailTemplateController.deleteEmailTemplate);

// Email Webhook Link routes (updated to match frontend expectations)
emailWebhookRoutes.get("/email-webhooks", isAuth, EmailWebhookLinkController.listEmailWebhookLinks);
emailWebhookRoutes.post("/email-webhooks", isAuth, EmailWebhookLinkController.createEmailWebhookLink);
emailWebhookRoutes.get("/email-webhooks/:webhookId", isAuth, EmailWebhookLinkController.showEmailWebhookLink);
emailWebhookRoutes.put("/email-webhooks/:webhookId", isAuth, EmailWebhookLinkController.updateEmailWebhookLink);
emailWebhookRoutes.delete("/email-webhooks/:webhookId", isAuth, EmailWebhookLinkController.deleteEmailWebhookLink);

// Public webhook receiver routes (no auth required)
emailWebhookRoutes.post("/webhook/email/:webhookHash", upload.none(), EmailWebhookReceiverController.receiveEmailWebhook);
emailWebhookRoutes.get("/webhook/email/:webhookHash/test", EmailWebhookReceiverController.testEmailWebhook);

// Email tracking routes (no auth required)
emailWebhookRoutes.get("/email/track/open/:dispatchId", EmailWebhookReceiverController.trackEmailOpen);
emailWebhookRoutes.get("/email/track/click/:dispatchId", EmailWebhookReceiverController.trackEmailClick);

export default emailWebhookRoutes;