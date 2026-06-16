import mongoose from "mongoose";

const grammarLessonSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    contentHtml: { type: String, default: "" },
    contentJson: { type: mongoose.Schema.Types.Mixed, default: null },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const GrammarLesson = mongoose.model("GrammarLesson", grammarLessonSchema);
