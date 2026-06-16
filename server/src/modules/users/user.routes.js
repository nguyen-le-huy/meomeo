import { Router } from "express";
import { getUserHealth } from "./user.controller.js";

const router = Router();

router.get("/health", getUserHealth);

export default router;
