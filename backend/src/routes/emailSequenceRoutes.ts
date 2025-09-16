import { Router } from "express";

import * as EmailSequenceController from "../controllers/EmailSequenceController";
import isAuth from "../middleware/isAuth";

const emailSequenceRoutes = Router();

emailSequenceRoutes.get("/email-sequences", isAuth, EmailSequenceController.index);
emailSequenceRoutes.get("/email-sequences/:sequenceId", isAuth, EmailSequenceController.show);
emailSequenceRoutes.post("/email-sequences", isAuth, EmailSequenceController.store);
emailSequenceRoutes.put("/email-sequences/:sequenceId", isAuth, EmailSequenceController.update);
emailSequenceRoutes.delete("/email-sequences/:sequenceId", isAuth, EmailSequenceController.remove);
emailSequenceRoutes.get("/email-sequences/:sequenceId/statistics", isAuth, EmailSequenceController.statistics);

export default emailSequenceRoutes;