import mongoose from "mongoose";

const generatedAudioSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    voice: { type: String, default: "alloy" },
    provider: { type: String, enum: ["openai", "azure"], default: "openai" },
    audioUrl: { type: String, required: true },
    publicId: { type: String, default: "" },
    type: { type: String, enum: ["word", "sentence", "paragraph"], default: "word" },
    relatedModel: {
      type: String,
      enum: ["VocabularyItem", "GrammarLesson"],
      default: "VocabularyItem",
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

generatedAudioSchema.index({ text: 1 });
generatedAudioSchema.index({ relatedModel: 1 });
generatedAudioSchema.index({ relatedId: 1 });

export const GeneratedAudio = mongoose.model("GeneratedAudio", generatedAudioSchema);
