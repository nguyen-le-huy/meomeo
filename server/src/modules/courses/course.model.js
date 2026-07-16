import mongoose from "mongoose";

const defaultVocabularyLessons = [
  {
    key: "flashcards",
    title: "Flashcard từ vựng",
    description: "Lật thẻ để nhớ nghĩa, phát âm và ví dụ.",
    order: 1,
  },
  {
    key: "match-meaning",
    title: "Chọn cặp từ",
    description: "Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng.",
    order: 2,
  },
  {
    key: "listening-fill",
    title: "Viết lại câu",
    description: "Sắp xếp các từ để viết lại câu bằng tiếng Anh hoặc tiếng Việt.",
    order: 3,
  },
  {
    key: "cloze-quiz",
    title: "Nghe đục lỗ",
    description: "Nghe câu mẫu rồi nhập từ còn thiếu.",
    order: 4,
  },
];

const lessonConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ["flashcards", "match-meaning", "listening-fill", "cloze-quiz"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

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
    lessons: {
      type: [lessonConfigSchema],
      default: () => defaultVocabularyLessons.map((lesson) => ({ ...lesson })),
    },
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
export { defaultVocabularyLessons };
