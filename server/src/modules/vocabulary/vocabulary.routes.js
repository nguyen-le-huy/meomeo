import { Router } from "express";
import { getVocabularyHealth } from "./vocabulary.controller.js";

const router = Router();

router.get("/health", getVocabularyHealth);

export default router;
