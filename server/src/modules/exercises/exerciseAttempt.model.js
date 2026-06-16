import mongoose from "mongoose";

const exerciseAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
  answers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
});

export const ExerciseAttempt = mongoose.model("ExerciseAttempt", exerciseAttemptSchema);
