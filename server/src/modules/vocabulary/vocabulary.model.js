import mongoose from "mongoose";

const vocabularySchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    word: { type: String, required: true, trim: true },
    phonetic: { type: String, default: "" },
    partOfSpeech: { type: String, default: "" },
    meaningVi: { type: String, required: true },
    meaningEn: { type: String, default: "" },
    example: { type: String, default: "" },
    exampleMeaningVi: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    difficulty: { type: String, default: "beginner" },
  },
  { timestamps: true },
);

export const VocabularyItem = mongoose.model("VocabularyItem", vocabularySchema);
