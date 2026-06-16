import { Router } from "express";
import { getSpeechHealth } from "./speech.controller.js";

const router = Router();

router.get("/health", getSpeechHealth);

export default router;
