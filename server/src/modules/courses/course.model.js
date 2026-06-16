import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["vocabulary", "grammar", "shadowing", "listening"],
      required: true,
    },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Course = mongoose.model("Course", courseSchema);
