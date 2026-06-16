import mongoose from "mongoose";

const pronunciationAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vocabularyId: { type: mongoose.Schema.Types.ObjectId, ref: "VocabularyItem" },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" },
  spokenText: { type: String, default: "" },
  audioUrl: { type: String, default: "" },
  pronunciationScore: { type: Number, default: 0 },
  accuracyScore: { type: Number, default: 0 },
  fluencyScore: { type: Number, default: 0 },
  completenessScore: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  azureResult: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const PronunciationAttempt = mongoose.model(
  "PronunciationAttempt",
  pronunciationAttemptSchema,
);
