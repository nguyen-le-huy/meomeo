import mongoose from "mongoose";

const youtubeTranscriptJobSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoLesson", required: true, unique: true },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    lockedAt: { type: Date },
    completedAt: { type: Date },
    lastError: { type: String, default: "" },
  },
  { timestamps: true },
);

youtubeTranscriptJobSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

export const YoutubeTranscriptJob = mongoose.model("YoutubeTranscriptJob", youtubeTranscriptJobSchema);
