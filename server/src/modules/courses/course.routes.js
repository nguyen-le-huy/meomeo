import { Router } from "express";
import { getCourseHealth } from "./course.controller.js";

const router = Router();

router.get("/health", getCourseHealth);

export default router;
