import mongoose from "mongoose";

const videoLessonSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    youtubeUrl: { type: String, required: true, trim: true },
    youtubeVideoId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1"], default: "A2" },
    source: { type: String, enum: ["youtube"], default: "youtube" },
    transcriptStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    transcriptLanguage: { type: String, default: "en" },
    viewCount: { type: Number, default: 0 },
    studyCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

videoLessonSchema.index({ topicId: 1, isPublished: 1 });
videoLessonSchema.index({ youtubeVideoId: 1 }, { unique: true });
videoLessonSchema.index({ level: 1 });

export const VideoLesson = mongoose.model("VideoLesson", videoLessonSchema);
