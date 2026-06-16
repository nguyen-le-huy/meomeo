import { Router } from "express";
import { assessShadowingController } from "./shadowing.controller.js";
import { assessShadowingSchema } from "./shadowing.validation.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.post("/assess", upload.single("audio"), validate(assessShadowingSchema), assessShadowingController);

export default router;
