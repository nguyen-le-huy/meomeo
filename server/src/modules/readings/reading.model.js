import mongoose from "mongoose";

const readingQuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true, trim: true },
    choices: {
      type: [String],
      required: true,
      validate: {
        validator: (choices) => choices.length >= 2 && choices.length <= 6,
        message: "Question must have between 2 and 6 choices",
      },
    },
    answer: { type: String, required: true, trim: true },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const readingLessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 220 },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    author: { type: String, default: "Meo Meo English", trim: true },
    authorRole: { type: String, default: "Reading Practice Editor", trim: true },
    level: { type: String, default: "TOEIC A2", trim: true },
    wordCount: { type: Number, default: 0 },
    estimatedReadingMinutes: { type: Number, default: 1 },
    durationLabel: { type: String, default: "1 phút", trim: true },
    publishedAt: { type: Date, default: Date.now },
    imageUrl: { type: String, required: true, trim: true },
    imageCredit: { type: String, default: "Meomeo Library", trim: true },
    imageCaption: { type: String, default: "", trim: true },
    secondaryImageUrl: { type: String, default: "", trim: true },
    secondaryImageCredit: { type: String, default: "Meomeo Library", trim: true },
    secondaryImageCaption: { type: String, default: "", trim: true },
    paragraphs: {
      type: [String],
      required: true,
      validate: {
        validator: (paragraphs) => paragraphs.length > 0,
        message: "Reading must have at least one paragraph",
      },
    },
    bodyHtml: { type: String, default: "" },
    questions: {
      type: [readingQuestionSchema],
      default: [],
    },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

readingLessonSchema.index({ slug: 1 }, { unique: true });
readingLessonSchema.index({ isPublished: 1, publishedAt: -1 });

export const ReadingLesson = mongoose.model("ReadingLesson", readingLessonSchema);
