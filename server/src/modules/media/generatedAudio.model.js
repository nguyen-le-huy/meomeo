import mongoose from "mongoose";

const generatedAudioSchema = new mongoose.Schema({
  text: { type: String, required: true },
  voice: { type: String, default: "" },
  provider: { type: String, enum: ["openai", "azure"], default: "openai" },
  audioUrl: { type: String, required: true },
  type: { type: String, enum: ["word", "sentence", "paragraph"], required: true },
  relatedModel: { type: String, default: "" },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

export const GeneratedAudio = mongoose.model("GeneratedAudio", generatedAudioSchema);
