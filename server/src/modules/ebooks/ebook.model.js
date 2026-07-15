import mongoose from "mongoose";

const ebookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 260 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    author: { type: String, default: "", trim: true, maxlength: 160 },
    level: { type: String, default: "", trim: true, maxlength: 60 },
    language: { type: String, default: "English", trim: true, maxlength: 60 },
    format: { type: String, enum: ["epub", "pdf"], required: true },
    fileUrl: { type: String, required: true, trim: true },
    filePublicId: { type: String, required: true, trim: true },
    fileStorageProvider: { type: String, enum: ["cloudinary", "r2"], default: "cloudinary" },
    fileStorageBucket: { type: String, default: "", trim: true },
    fileStorageKey: { type: String, default: "", trim: true },
    fileSize: { type: Number, required: true, min: 0 },
    originalFilename: { type: String, required: true, trim: true },
    coverUrl: { type: String, default: "", trim: true },
    coverPublicId: { type: String, default: "", trim: true },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

ebookSchema.index({ slug: 1 }, { unique: true });
ebookSchema.index({ isPublished: 1, publishedAt: -1, createdAt: -1 });

export const Ebook = mongoose.model("Ebook", ebookSchema);
