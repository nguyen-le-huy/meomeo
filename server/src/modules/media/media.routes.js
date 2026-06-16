import { Router } from "express";
import { getMediaHealth } from "./media.controller.js";

const router = Router();

router.get("/health", getMediaHealth);

export default router;
