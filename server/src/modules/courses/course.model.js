import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: ["vocabulary", "grammar", "shadowing", "toeic-practice", "toeic-dictation"],
      default: "vocabulary",
      required: true,
    },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

courseSchema.index({ type: 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ order: 1 });
courseSchema.index({ type: 1, slug: 1 }, { unique: true });

export const Course = mongoose.model("Course", courseSchema);
