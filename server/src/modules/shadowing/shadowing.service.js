import { ShadowingAttempt } from "./shadowingAttempt.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function assessShadowing({ sessionId, segmentId, audioUrl = "" }) {
  const segment = await TranscriptSegment.findById(segmentId);
  if (!segment || !segment.isPublished) {
    throw createHttpError(404, "Transcript segment not found");
  }

  if (!config.azureSpeech.key || !config.azureSpeech.region) {
    throw createHttpError(501, "Azure Speech is not configured yet");
  }

  const attempt = await ShadowingAttempt.create({
    sessionId,
    videoId: segment.videoId,
    segmentId: segment._id,
    referenceText: segment.text,
    audioUrl,
    azureResult: { status: "not-implemented" },
  });

  return {
    attemptId: attempt._id,
    pronunciationScore: attempt.pronunciationScore,
    accuracyScore: attempt.accuracyScore,
    fluencyScore: attempt.fluencyScore,
    completenessScore: attempt.completenessScore,
    passed: attempt.passed,
  };
}
