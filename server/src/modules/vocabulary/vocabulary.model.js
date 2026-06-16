import mongoose from "mongoose";

const partOfSpeechValues = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "phrase",
  "other",
];

const vocabularySchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    word: { type: String, required: true, trim: true },
    phonetic: { type: String, default: "" },
    partOfSpeech: { type: String, enum: partOfSpeechValues, default: "other" },
    meaningVi: { type: String, required: true, trim: true },
    meaningEn: { type: String, default: "" },
    example: { type: String, default: "" },
    exampleMeaningVi: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    audioPublicId: { type: String, default: "" },
    order: { type: Number, default: 0 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

vocabularySchema.index({ courseId: 1 });
vocabularySchema.index({ word: 1 });
vocabularySchema.index({ order: 1 });
vocabularySchema.index({ isPublished: 1 });

export const VocabularyItem = mongoose.model("VocabularyItem", vocabularySchema);
