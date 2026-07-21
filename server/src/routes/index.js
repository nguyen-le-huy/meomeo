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
import topicRoutes from "../modules/topics/topic.routes.js";
import videoRoutes from "../modules/videos/video.routes.js";
import transcriptRoutes from "../modules/transcripts/transcript.routes.js";
import dictationRoutes from "../modules/dictation/dictation.routes.js";
import shadowingRoutes from "../modules/shadowing/shadowing.routes.js";
import youtubeRoutes from "../modules/youtube/youtube.routes.js";
import bilingualRoutes from "../modules/bilingual/bilingual.routes.js";

import dictionaryRoutes from "../modules/dictionary/dictionary.routes.js";
import ebookRoutes from "../modules/ebooks/ebook.routes.js";
import movieRoutes from "../modules/movies/movie.routes.js";
import bunnyRoutes from "../modules/bunny/bunny.routes.js";

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
router.use("/topics", topicRoutes);
router.use("/videos", videoRoutes);
router.use("/videos", bilingualRoutes);
router.use("/transcripts", transcriptRoutes);
router.use("/dictation", dictationRoutes);
router.use("/shadowing", shadowingRoutes);
router.use("/youtube", youtubeRoutes);

router.use("/dictionary", dictionaryRoutes);
router.use("/ebooks", ebookRoutes);
router.use("/movies", movieRoutes);
router.use("/webhooks/bunny", bunnyRoutes);

export default router;
