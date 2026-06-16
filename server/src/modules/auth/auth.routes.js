import { Router } from "express";
import { getAuthHealth, getMeController, loginController } from "./auth.controller.js";
import { loginSchema } from "./auth.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.get("/health", getAuthHealth);
router.post("/login", validate(loginSchema), loginController);
router.get("/me", requireAuth, getMeController);

export default router;
