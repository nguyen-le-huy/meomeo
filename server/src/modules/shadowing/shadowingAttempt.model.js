import mongoose from "mongoose";

const shadowingAttemptSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoLesson", required: true },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: "TranscriptSegment", required: true },
    referenceText: { type: String, required: true },
    audioUrl: { type: String, default: "" },
    pronunciationScore: { type: Number, default: 0 },
    accuracyScore: { type: Number, default: 0 },
    fluencyScore: { type: Number, default: 0 },
    completenessScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    azureResult: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

shadowingAttemptSchema.index({ sessionId: 1, createdAt: -1 });
shadowingAttemptSchema.index({ segmentId: 1 });

export const ShadowingAttempt = mongoose.model("ShadowingAttempt", shadowingAttemptSchema);
