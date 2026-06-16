import { Router } from "express";
import { getAuthHealth } from "./auth.controller.js";

const router = Router();

router.get("/health", getAuthHealth);

export default router;
