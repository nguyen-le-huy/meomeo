import { config } from "../../config/env.js";
import { VideoLesson } from "../videos/video.model.js";
import { syncMovieStreamStatus } from "./movie.service.js";

const pollIntervalMs = 10_000;
let pollTimer;
let workerBusy = false;

async function findMovieToReconcile() {
  return VideoLesson.findOne({
    source: "bunny",
    contentType: "movie",
    deletedAt: { $exists: false },
    $or: [
      { streamStatus: "processing" },
      { streamStatus: "uploading", uploadProgress: { $gte: 100 } },
      {
        streamStatus: "ready",
        $or: [{ duration: { $lte: 0 } }, { encodeProgress: { $lt: 100 } }],
      },
    ],
  })
    .sort({ updatedAt: 1 })
    .select("_id")
    .lean();
}

async function poll() {
  if (workerBusy) return;
  workerBusy = true;
  try {
    const movie = await findMovieToReconcile();
    if (movie) await syncMovieStreamStatus(movie._id.toString());
  } catch (error) {
    console.error("[Bunny Stream] Reconciliation failed:", error.message);
  } finally {
    workerBusy = false;
  }
}

export function startMovieStreamWorker() {
  if (pollTimer) return;
  if (!config.bunnyStream.libraryId || !config.bunnyStream.apiKey) return;
  pollTimer = setInterval(poll, pollIntervalMs);
  pollTimer.unref?.();
  void poll();
  console.log("Bunny Stream reconciliation worker started");
}
