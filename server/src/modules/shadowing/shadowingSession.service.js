import { ShadowingSession } from "./shadowingSession.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

const passingScore = 60;

function toSegmentKey(value) {
  return String(value);
}

function summarizeSegments(segments, totalSegments) {
  const completedSegments = segments.filter((segment) => segment.bestPronunciationScore >= passingScore).length;
  const averageScore = completedSegments
    ? Math.round(segments.reduce((sum, segment) => sum + segment.bestPronunciationScore, 0) / segments.length)
    : 0;

  return {
    averageScore,
    totalSegments,
    completedSegments,
  };
}

async function getPublishedTranscriptIds(videoId) {
  const transcripts = await TranscriptSegment.find({ videoId, isPublished: true }).select("_id").sort({ index: 1 });
  if (!transcripts.length) throw createHttpError(400, "Video này chưa có transcript để nộp shadowing");
  return transcripts.map((segment) => toSegmentKey(segment._id));
}

function normalizeBestSegments(segments = []) {
  const bestBySegment = new Map();

  for (const segment of segments) {
    const key = toSegmentKey(segment.segmentId);
    const existing = bestBySegment.get(key);
    const attempts = Math.max(Number(segment.attempts || 1), Number(existing?.attempts || 0));

    if (!existing || segment.bestPronunciationScore > existing.bestPronunciationScore) {
      bestBySegment.set(key, { ...segment, attempts });
      continue;
    }

    bestBySegment.set(key, { ...existing, attempts });
  }

  return Array.from(bestBySegment.values());
}

async function upsertShadowingSession({ sessionId, videoId, segments, status }) {
  const transcriptIds = await getPublishedTranscriptIds(videoId);
  const transcriptIdSet = new Set(transcriptIds);
  const normalizedSegments = normalizeBestSegments(segments).filter((segment) => transcriptIdSet.has(toSegmentKey(segment.segmentId)));
  const summary = summarizeSegments(normalizedSegments, transcriptIds.length);
  const isCompleted = status === "completed";

  if (isCompleted) {
    if (normalizedSegments.length !== transcriptIds.length) {
      throw createHttpError(400, "Bạn cần hoàn thành tất cả transcript trước khi nộp bài");
    }

    const failedSegment = normalizedSegments.find((segment) => segment.bestPronunciationScore < passingScore);
    if (failedSegment) {
      throw createHttpError(400, "Mỗi transcript cần đạt tối thiểu 60 điểm trước khi nộp bài");
    }
  }

  const existing = await ShadowingSession.findOne({ videoId, sessionId });
  if (existing?.status === "completed") {
    if (isCompleted) throw createHttpError(409, "Bạn đã nộp bài shadowing này rồi");
    return existing;
  }

  const update = {
    sessionId,
    videoId,
    segments: normalizedSegments,
    ...summary,
    status: isCompleted ? "completed" : "in_progress",
    ...(isCompleted ? { submittedAt: new Date(), completedAt: new Date() } : {}),
  };

  return ShadowingSession.findOneAndUpdate(
    { videoId, sessionId },
    { $set: update },
    { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true },
  );
}

export async function saveShadowingSessionProgress(data) {
  return upsertShadowingSession({ ...data, status: "in_progress" });
}

export async function submitShadowingSession(data) {
  return upsertShadowingSession({ ...data, status: "completed" });
}

export async function getMyShadowingSession(videoId, sessionId) {
  return ShadowingSession.findOne({ videoId, sessionId });
}

export async function getMyShadowingSessions(sessionId) {
  return ShadowingSession.find({ sessionId }).sort({ updatedAt: -1 });
}

export async function getShadowingSessions(videoId) {
  return ShadowingSession.find({ videoId }).sort({ submittedAt: -1 });
}

export async function deleteShadowingSession(id) {
  const session = await ShadowingSession.findByIdAndDelete(id);
  if (!session) throw createHttpError(404, "Shadowing session not found");
  return { id: session._id };
}
