import mongoose from "mongoose";

const ebookProgressSchema = new mongoose.Schema(
  {
    ebookId: { type: mongoose.Schema.Types.ObjectId, ref: "Ebook", required: true },
    sessionId: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: mongoose.Schema.Types.Mixed, default: null },
    progress: { type: Number, min: 0, max: 1, default: 0 },
    page: { type: Number, min: 0, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ebookProgressSchema.index({ ebookId: 1, sessionId: 1 }, { unique: true });

export const EbookProgress = mongoose.model("EbookProgress", ebookProgressSchema);
