import { Router } from "express";
import { analyzeYoutubeController } from "./youtube.controller.js";
import { analyzeYoutubeSchema } from "./youtube.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.post("/analyze", requireAuth, requireRole("admin"), validate(analyzeYoutubeSchema), analyzeYoutubeController);

export default router;
