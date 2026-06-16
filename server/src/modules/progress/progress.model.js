import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
  lessonId: { type: mongoose.Schema.Types.ObjectId },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "completed"],
    default: "not-started",
  },
  progressPercent: { type: Number, default: 0 },
  completedVocabularyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "VocabularyItem" }],
  completedExerciseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
  lastAccessedAt: { type: Date },
  completedAt: { type: Date },
});

export const UserProgress = mongoose.model("UserProgress", progressSchema);
