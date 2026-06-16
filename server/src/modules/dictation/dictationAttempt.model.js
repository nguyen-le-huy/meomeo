import mongoose from "mongoose";

const mistakeSchema = new mongoose.Schema(
  {
    expected: { type: String, default: "" },
    actual: { type: String, default: "" },
    position: { type: Number, default: 0 },
  },
  { _id: false },
);

const dictationAttemptSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoLesson", required: true },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: "TranscriptSegment", required: true },
    difficulty: { type: String, enum: ["easy", "normal", "hard"], default: "normal" },
    userAnswer: { type: String, default: "" },
    correctText: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    mistakes: { type: [mistakeSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

dictationAttemptSchema.index({ sessionId: 1, createdAt: -1 });
dictationAttemptSchema.index({ segmentId: 1 });

export const DictationAttempt = mongoose.model("DictationAttempt", dictationAttemptSchema);
