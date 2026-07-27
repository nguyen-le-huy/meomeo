import { YoutubeTranscriptJob } from "./youtubeTranscriptJob.model.js";

export function getYoutubeTranscriptQueueStatuses(nodeEnv = process.env.NODE_ENV) {
  const isProduction = nodeEnv === "production";
  return {
    queued: isProduction ? "queued" : "queued_local",
    processing: isProduction ? "processing" : "processing_local",
  };
}

export async function enqueueYoutubeTranscript(videoId) {
  const statuses = getYoutubeTranscriptQueueStatuses();
  return YoutubeTranscriptJob.findOneAndUpdate(
    { videoId },
    {
      $set: {
        status: statuses.queued,
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: "",
      },
      $unset: { lockedAt: 1, completedAt: 1 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function deleteYoutubeTranscriptJob(videoId) {
  return YoutubeTranscriptJob.deleteOne({ videoId });
}
