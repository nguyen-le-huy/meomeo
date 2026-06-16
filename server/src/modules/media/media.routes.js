import { Router } from "express";
import { getMediaHealth, uploadSingleMedia } from "./media.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();

router.get("/health", getMediaHealth);
router.post("/upload", upload.single("file"), uploadSingleMedia);

export default router;
