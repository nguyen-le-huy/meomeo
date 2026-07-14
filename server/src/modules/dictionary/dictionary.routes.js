import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { clearDictionaryHistoryController, listDictionaryHistoryController, lookupDictionaryController, removeDictionaryHistoryController } from "./dictionary.controller.js";
import { dictionaryHistoryParamsSchema, dictionaryHistoryQuerySchema, lookupDictionarySchema } from "./dictionary.validation.js";

const router = Router();

router.post("/lookup", validate(lookupDictionarySchema), lookupDictionaryController);
router.get("/history", validate(dictionaryHistoryQuerySchema), listDictionaryHistoryController);
router.delete("/history", validate(dictionaryHistoryQuerySchema), clearDictionaryHistoryController);
router.delete("/history/:id", validate({ params: dictionaryHistoryParamsSchema.shape.params, query: dictionaryHistoryQuerySchema.shape.query }), removeDictionaryHistoryController);

export default router;
