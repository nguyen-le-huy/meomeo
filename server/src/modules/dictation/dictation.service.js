import { DictationAttempt } from "./dictationAttempt.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compareWords(expectedText, actualText) {
  const expectedWords = normalizeAnswer(expectedText).split(" ").filter(Boolean);
  const actualWords = normalizeAnswer(actualText).split(" ").filter(Boolean);
  const maxLength = Math.max(expectedWords.length, actualWords.length);
  const mistakes = [];
  let correctCount = 0;

  for (let index = 0; index < maxLength; index += 1) {
    const expected = expectedWords[index] || "";
    const actual = actualWords[index] || "";

    if (expected && expected === actual) {
      correctCount += 1;
    } else if (expected || actual) {
      mistakes.push({ expected, actual, position: index + 1 });
    }
  }

  const score = expectedWords.length ? Math.round((correctCount / expectedWords.length) * 100) : 0;
  const normalizedCorrectText = normalizeAnswer(expectedText);
  const normalizedUserAnswer = normalizeAnswer(actualText);

  return {
    isCorrect: normalizedCorrectText === normalizedUserAnswer,
    score,
    normalizedCorrectText,
    normalizedUserAnswer,
    mistakes,
  };
}

export async function checkDictationAnswer({ sessionId, segmentId, difficulty, userAnswer }) {
  const segment = await TranscriptSegment.findById(segmentId);
  if (!segment || !segment.isPublished) {
    throw createHttpError(404, "Transcript segment not found");
  }

  const result = compareWords(segment.text, userAnswer);
  const attempt = await DictationAttempt.create({
    sessionId,
    videoId: segment.videoId,
    segmentId: segment._id,
    difficulty,
    userAnswer,
    correctText: segment.text,
    isCorrect: result.isCorrect,
    score: result.score,
    mistakes: result.mistakes,
  });

  return {
    attemptId: attempt._id,
    correctText: segment.text,
    ...result,
  };
}
