import app from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";
import { prepareDictionaryHistoryStorage } from "./modules/dictionary/dictionaryHistory.model.js";
import { startMovieStreamWorker } from "./modules/movies/movieStream.worker.js";
import { startYoutubeTranscriptWorker } from "./modules/youtube/youtubeTranscript.worker.js";

async function startServer() {
  await connectDB();
  await prepareDictionaryHistoryStorage();
  startYoutubeTranscriptWorker();
  startMovieStreamWorker();

  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

startServer();
