import { YoutubeTranscriptJob } from "./youtubeTranscriptJob.model.js";

export async function enqueueYoutubeTranscript(videoId) {
  return YoutubeTranscriptJob.findOneAndUpdate(
    { videoId },
    {
      $set: {
        status: "queued",
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
