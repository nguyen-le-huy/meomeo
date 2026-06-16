import { Router } from "express";
import { getGrammarHealth } from "./grammar.controller.js";

const router = Router();

router.get("/health", getGrammarHealth);

export default router;
