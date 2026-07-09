import { Router } from "express";
import { assessShadowingController } from "./shadowing.controller.js";
import {
  saveShadowingSessionProgressController,
  submitShadowingSessionController,
  getMyShadowingSessionController,
  getMyShadowingSessionsController,
  getShadowingSessionsController,
  deleteShadowingSessionController,
} from "./shadowingSession.controller.js";
import { assessShadowingSchema } from "./shadowing.validation.js";
import {
  saveShadowingSessionProgressSchema,
  submitShadowingSessionSchema,
  getMyShadowingSessionSchema,
  getMyShadowingSessionsSchema,
  getShadowingSessionsSchema,
  shadowingSessionIdParamSchema,
} from "./shadowingSession.validation.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { optionalAuth, requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/assess", upload.single("audio"), validate(assessShadowingSchema), assessShadowingController);

router.put("/sessions/progress", optionalAuth, validate(saveShadowingSessionProgressSchema), saveShadowingSessionProgressController);
router.post("/sessions", optionalAuth, validate(submitShadowingSessionSchema), submitShadowingSessionController);
router.get("/sessions/mine/all", optionalAuth, validate(getMyShadowingSessionsSchema), getMyShadowingSessionsController);
router.get("/sessions/mine", optionalAuth, validate(getMyShadowingSessionSchema), getMyShadowingSessionController);
router.get("/sessions", requireAuth, requireRole("admin"), validate(getShadowingSessionsSchema), getShadowingSessionsController);
router.delete("/sessions/:id", requireAuth, requireRole("admin"), validate(shadowingSessionIdParamSchema), deleteShadowingSessionController);

export default router;
