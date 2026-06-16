import { Router } from "express";
import { getProgressHealth } from "./progress.controller.js";

const router = Router();

router.get("/health", getProgressHealth);

export default router;
