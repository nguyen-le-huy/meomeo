import { Router } from "express";
import { getExerciseHealth } from "./exercise.controller.js";

const router = Router();

router.get("/health", getExerciseHealth);

export default router;
