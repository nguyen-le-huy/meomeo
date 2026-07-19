import { Router } from "express";
import { bunnyStreamWebhookController } from "./bunny.controller.js";

const router = Router();

router.post("/stream", bunnyStreamWebhookController);

export default router;
