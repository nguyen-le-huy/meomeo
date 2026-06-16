import { Router } from "express";
import { checkDictationController } from "./dictation.controller.js";
import { checkDictationSchema } from "./dictation.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();

router.post("/check", validate(checkDictationSchema), checkDictationController);

export default router;
