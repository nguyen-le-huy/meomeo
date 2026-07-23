import mongoose from "mongoose";

const videoLessonSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    youtubeUrl: {
      type: String,
      trim: true,
      default: null,
      required() {
        return this.source === "youtube";
      },
    },
    youtubeVideoId: {
      type: String,
      trim: true,
      default: null,
      required() {
        return this.source === "youtube";
      },
    },
    bunnyVideoId: { type: String, trim: true, default: "" },
    bunnyLibraryId: { type: String, trim: true, default: "" },
    streamStatus: {
      type: String,
      enum: ["created", "uploading", "processing", "ready", "failed"],
      default: "created",
    },
    streamError: { type: String, default: "" },
    streamReadyAt: { type: Date },
    uploadProgress: { type: Number, default: 0, min: 0, max: 100 },
    uploadBytesUploaded: { type: Number, default: 0, min: 0 },
    uploadBytesTotal: { type: Number, default: 0, min: 0 },
    uploadUpdatedAt: { type: Date },
    encodeProgress: { type: Number, default: 0, min: 0, max: 100 },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    posterPublicId: { type: String, default: "" },
    backdropUrl: { type: String, default: "" },
    heroThumbnailUrl: { type: String, default: "" },
    heroThumbnailPublicId: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    releaseYear: { type: Number, min: 1888, max: 2200 },
    ageRating: { type: String, default: "13+", trim: true, maxlength: 12 },
    rating: { type: Number, default: 0, min: 0, max: 10 },
    isFeatured: { type: Boolean, default: false },
    level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1"], default: "A2" },
    source: { type: String, enum: ["youtube", "bunny"], default: "youtube" },
    transcriptStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    transcriptLanguage: { type: String, default: "en" },
    transcriptSource: {
      type: String,
      enum: ["", "manual", "youtube_manual", "youtube_auto", "azure_speech"],
      default: "",
    },
    transcriptStage: {
      type: String,
      enum: ["", "queued", "fetching_youtube_subtitle", "downloading_audio", "transcribing_audio", "creating_segments"],
      default: "",
    },
    transcriptProgress: { type: Number, default: 0, min: 0, max: 100 },
    transcriptError: { type: String, default: "" },
    publishWhenReady: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    studyCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    deletedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    contentType: {
      type: String,
      enum: ["lesson", "music", "movie", "other"],
      default: "lesson",
    },
    bilingualStatus: {
      type: String,
      enum: ["none", "pending", "processing", "completed", "failed"],
      default: "none",
    },
    bilingualSourceLanguage: { type: String, default: "en" },
    bilingualTargetLanguage: { type: String, default: "vi" },
    bilingualModel: { type: String, default: "" },
    bilingualError: { type: String, default: "" },
    bilingualGeneratedAt: { type: Date },
  },
  { timestamps: true },
);

videoLessonSchema.index({ topicId: 1, isPublished: 1 });
videoLessonSchema.index(
  { youtubeVideoId: 1 },
  { unique: true, partialFilterExpression: { source: "youtube", youtubeVideoId: { $type: "string", $gt: "" } } },
);
videoLessonSchema.index(
  { bunnyVideoId: 1 },
  { unique: true, partialFilterExpression: { source: "bunny", bunnyVideoId: { $type: "string", $gt: "" } } },
);
videoLessonSchema.index({ contentType: 1, source: 1, topicId: 1, isPublished: 1, streamStatus: 1 });
videoLessonSchema.index({ level: 1 });

export const VideoLesson = mongoose.model("VideoLesson", videoLessonSchema);
