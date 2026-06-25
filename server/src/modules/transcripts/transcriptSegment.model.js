import mongoose from "mongoose";

const transcriptSegmentSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoLesson", required: true },
    index: { type: Number, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    duration: { type: Number, default: 0 },
    text: { type: String, required: true, trim: true },
    normalizedText: { type: String, required: true, trim: true },
    wordCount: { type: Number, default: 0 },
    source: { type: String, enum: ["youtube", "manual", "edited"], default: "youtube" },
    isPublished: { type: Boolean, default: true },
    translationText: { type: String, default: "", trim: true },
    translationLanguage: { type: String, default: "vi" },
    translationStatus: {
      type: String,
      enum: ["none", "translated", "edited", "failed"],
      default: "none",
    },
    translationError: { type: String, default: "" },
    translatedAt: { type: Date },
  },
  { timestamps: true },
);

transcriptSegmentSchema.index({ videoId: 1, index: 1 }, { unique: true });
transcriptSegmentSchema.index({ videoId: 1, isPublished: 1 });
transcriptSegmentSchema.index({ videoId: 1, translationStatus: 1 });

export const TranscriptSegment = mongoose.model("TranscriptSegment", transcriptSegmentSchema);
