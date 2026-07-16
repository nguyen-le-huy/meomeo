import mongoose from "mongoose";

const vocabularyExerciseSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonKey: {
      type: String,
      enum: ["match-meaning", "listening-fill", "cloze-quiz"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, default: "" },
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedByAi: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

vocabularyExerciseSchema.index({ courseId: 1, lessonKey: 1 }, { unique: true });

export const VocabularyExercise = mongoose.model("VocabularyExercise", vocabularyExerciseSchema);
