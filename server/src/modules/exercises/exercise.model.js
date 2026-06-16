import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
    lessonId: { type: mongoose.Schema.Types.ObjectId },
    type: {
      type: String,
      enum: [
        "pronunciation",
        "vocab-multiple-choice",
        "vocab-choose-meaning",
        "vocab-fill-blank",
        "grammar-multiple-choice",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, default: "" },
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    order: { type: Number, default: 0 },
    passingScore: { type: Number, default: 70 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Exercise = mongoose.model("Exercise", exerciseSchema);
