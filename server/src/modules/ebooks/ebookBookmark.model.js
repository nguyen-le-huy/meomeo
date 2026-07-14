import mongoose from "mongoose";

const ebookBookmarkSchema = new mongoose.Schema(
  {
    ebookId: { type: mongoose.Schema.Types.ObjectId, ref: "Ebook", required: true },
    sessionId: { type: String, required: true, trim: true, maxlength: 120 },
    cfi: { type: String, required: true, trim: true, maxlength: 1000 },
    label: { type: String, default: "", trim: true, maxlength: 240 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ebookBookmarkSchema.index({ ebookId: 1, sessionId: 1, cfi: 1 }, { unique: true });
ebookBookmarkSchema.index({ ebookId: 1, sessionId: 1, createdAt: -1 });

export const EbookBookmark = mongoose.model("EbookBookmark", ebookBookmarkSchema);
