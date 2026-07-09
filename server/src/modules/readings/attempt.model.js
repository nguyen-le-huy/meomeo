import mongoose from "mongoose";

const readingAttemptSchema = new mongoose.Schema(
  {
    readingId: { type: mongoose.Schema.Types.ObjectId, ref: "ReadingLesson", required: true, index: true },
    sessionId: { type: String, required: true, trim: true },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        selectedChoice: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

readingAttemptSchema.index({ readingId: 1, sessionId: 1 }, { unique: true });

export const ReadingAttempt = mongoose.model("ReadingAttempt", readingAttemptSchema);
