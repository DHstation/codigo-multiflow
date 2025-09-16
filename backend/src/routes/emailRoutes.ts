import express from "express";
import isAuth from "../middleware/isAuth";
import * as EmailTemplateController from "../controllers/EmailTemplateController";
import * as EmailWebhookController from "../controllers/EmailWebhookController";
import * as EmailWebhookReceiverController from "../controllers/EmailWebhookReceiverController";

const emailRoutes = express.Router();

// ===== ROTAS DE TEMPLATES DE EMAIL =====
// Listar templates
emailRoutes.get("/email-templates", isAuth, EmailTemplateController.listEmailTemplates);

// Criar template
emailRoutes.post("/email-templates", isAuth, EmailTemplateController.createEmailTemplate);

// Obter template específico
emailRoutes.get("/email-templates/:templateId", isAuth, EmailTemplateController.showEmailTemplate);

// Atualizar template
emailRoutes.put("/email-templates/:templateId", isAuth, EmailTemplateController.updateEmailTemplate);

// Deletar template
emailRoutes.delete("/email-templates/:templateId", isAuth, EmailTemplateController.deleteEmailTemplate);

// ===== ROTAS DE WEBHOOKS DE EMAIL =====
// Listar webhooks
emailRoutes.get("/email-webhooks", isAuth, EmailWebhookController.listEmailWebhooks);

// Criar webhook
emailRoutes.post("/email-webhooks", isAuth, EmailWebhookController.createEmailWebhook);

// Obter webhook específico
emailRoutes.get("/email-webhooks/:webhookId", isAuth, EmailWebhookController.showEmailWebhook);

// Atualizar webhook
emailRoutes.put("/email-webhooks/:webhookId", isAuth, EmailWebhookController.updateEmailWebhook);

// Deletar webhook
emailRoutes.delete("/email-webhooks/:webhookId", isAuth, EmailWebhookController.deleteEmailWebhook);

// ===== ROTAS PÚBLICAS (RECEIVER) =====
// Receber webhook de email via POST
emailRoutes.post("/webhook/email/:webhookHash", EmailWebhookReceiverController.receiveEmailWebhook);

// Receber webhook de email via GET (teste)
emailRoutes.get("/webhook/email/:webhookHash", EmailWebhookReceiverController.testEmailWebhook);

// Tracking de abertura de email
emailRoutes.get("/email/track/open/:dispatchId", EmailWebhookReceiverController.trackEmailOpen);

// Tracking de clique de email
emailRoutes.get("/email/track/click/:dispatchId", EmailWebhookReceiverController.trackEmailClick);

export default emailRoutes;