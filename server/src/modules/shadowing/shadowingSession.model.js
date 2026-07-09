import mongoose from "mongoose";

const shadowingSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoLesson", required: true },
    segments: [
      {
        segmentId: { type: mongoose.Schema.Types.ObjectId, ref: "TranscriptSegment", required: true },
        bestPronunciationScore: { type: Number, required: true },
        bestAccuracyScore: { type: Number, required: true },
        bestFluencyScore: { type: Number, required: true },
        bestCompletenessScore: { type: Number, required: true },
        attempts: { type: Number, default: 1 },
      },
    ],
    averageScore: { type: Number, default: 0 },
    totalSegments: { type: Number, required: true, default: 0 },
    completedSegments: { type: Number, default: 0 },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    submittedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

shadowingSessionSchema.index({ videoId: 1, sessionId: 1 }, { unique: true });
shadowingSessionSchema.index({ sessionId: 1, status: 1 });

export const ShadowingSession = mongoose.model("ShadowingSession", shadowingSessionSchema);
