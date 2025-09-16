import { Router } from "express";

import * as EmailTemplateController from "../controllers/EmailTemplateController";
import isAuth from "../middleware/isAuth";

const emailTemplateRoutes = Router();

emailTemplateRoutes.get("/email-templates", isAuth, EmailTemplateController.index);
emailTemplateRoutes.get("/email-templates/:templateId", isAuth, EmailTemplateController.show);
emailTemplateRoutes.post("/email-templates", isAuth, EmailTemplateController.store);
emailTemplateRoutes.put("/email-templates/:templateId", isAuth, EmailTemplateController.update);
emailTemplateRoutes.delete("/email-templates/:templateId", isAuth, EmailTemplateController.remove);
emailTemplateRoutes.post("/email-templates/:templateId/duplicate", isAuth, EmailTemplateController.duplicate);
emailTemplateRoutes.post("/email-templates/preview", isAuth, EmailTemplateController.preview);

export default emailTemplateRoutes;