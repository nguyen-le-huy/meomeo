import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import courseRoutes from "../modules/courses/course.routes.js";
import vocabularyRoutes from "../modules/vocabulary/vocabulary.routes.js";
import grammarRoutes from "../modules/grammar/grammar.routes.js";
import exerciseRoutes from "../modules/exercises/exercise.routes.js";
import progressRoutes from "../modules/progress/progress.routes.js";
import speechRoutes from "../modules/speech/speech.routes.js";
import mediaRoutes from "../modules/media/media.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/vocabulary", vocabularyRoutes);
router.use("/grammar", grammarRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/progress", progressRoutes);
router.use("/speech", speechRoutes);
router.use("/media", mediaRoutes);

export default router;
