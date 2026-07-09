import { ReadingAttempt } from "./attempt.model.js";
import { getReadingById } from "./reading.service.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function submitAttempt(readingId, { sessionId, answers }) {
  const reading = await getReadingById(readingId, { admin: true });
  if (!reading) throw createHttpError(404, "Reading not found");

  const existing = await ReadingAttempt.findOne({ readingId, sessionId });
  if (existing) throw createHttpError(409, "Bạn đã nộp bài đọc này rồi");

  const correctCount = answers.filter((a) => a.selectedChoice === a.correctAnswer).length;

  return ReadingAttempt.create({
    readingId,
    sessionId,
    answers: answers.map((a) => ({
      questionIndex: a.questionIndex,
      selectedChoice: a.selectedChoice,
      correctAnswer: a.correctAnswer,
      isCorrect: a.selectedChoice === a.correctAnswer,
    })),
    correctCount,
    totalQuestions: answers.length,
  });
}

export async function getAttemptByUser(readingId, sessionId) {
  return ReadingAttempt.findOne({ readingId, sessionId });
}

export async function getAttempts(readingId) {
  return ReadingAttempt.find({ readingId }).sort({ submittedAt: -1 });
}

export async function deleteAttempt(readingId, attemptId) {
  const attempt = await ReadingAttempt.findOneAndDelete({ _id: attemptId, readingId });
  if (!attempt) throw createHttpError(404, "Attempt not found");
  return { id: attempt._id };
}
