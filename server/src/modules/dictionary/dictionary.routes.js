import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { lookupDictionaryController } from "./dictionary.controller.js";
import { lookupDictionarySchema } from "./dictionary.validation.js";

const router = Router();

router.post("/lookup", validate(lookupDictionarySchema), lookupDictionaryController);

export default router;
