import { TranscriptSegment } from "./transcriptSegment.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(text) {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(" ").length : 0;
}

async function getSegment(segmentId) {
  const segment = await TranscriptSegment.findById(segmentId);
  if (!segment) throw createHttpError(404, "Transcript segment not found");
  return segment;
}

export async function updateSegment(segmentId, data) {
  const segment = await getSegment(segmentId);

  if (data.text !== undefined) {
    segment.text = data.text;
    segment.normalizedText = normalizeText(data.text);
    segment.wordCount = getWordCount(data.text);
    segment.source = "edited";
  }
  if (data.startTime !== undefined) segment.startTime = data.startTime;
  if (data.endTime !== undefined) segment.endTime = data.endTime;
  if (segment.endTime < segment.startTime) {
    throw createHttpError(400, "End time must be greater than or equal to start time");
  }
  segment.duration = Math.max(0, segment.endTime - segment.startTime);
  if (data.isPublished !== undefined) segment.isPublished = data.isPublished;

  await segment.save();
  return segment;
}

export async function mergeWithNextSegment(segmentId) {
  const segment = await getSegment(segmentId);
  const nextSegment = await TranscriptSegment.findOne({
    videoId: segment.videoId,
    index: { $gt: segment.index },
  }).sort({ index: 1 });

  if (!nextSegment) {
    throw createHttpError(404, "Next transcript segment not found");
  }

  segment.text = `${segment.text} ${nextSegment.text}`.replace(/\s+/g, " ").trim();
  segment.normalizedText = normalizeText(segment.text);
  segment.wordCount = getWordCount(segment.text);
  segment.endTime = nextSegment.endTime;
  segment.duration = Math.max(0, segment.endTime - segment.startTime);
  segment.source = "edited";

  await segment.save();
  await nextSegment.deleteOne();

  const remainingSegments = await TranscriptSegment.find({ videoId: segment.videoId }).sort({ index: 1 });
  await Promise.all(
    remainingSegments.map((item, index) => {
      item.index = index + 1;
      return item.save();
    }),
  );

  return segment;
}

export async function deleteSegment(segmentId) {
  const segment = await getSegment(segmentId);
  const videoId = segment.videoId;
  await segment.deleteOne();

  const remainingSegments = await TranscriptSegment.find({ videoId }).sort({ index: 1 });
  await Promise.all(
    remainingSegments.map((item, index) => {
      item.index = index + 1;
      return item.save();
    }),
  );

  return { id: segmentId };
}

export async function reorderSegments(segmentIds) {
  const segments = await TranscriptSegment.find({ _id: { $in: segmentIds } });

  if (segments.length !== segmentIds.length) {
    throw createHttpError(404, "Some transcript segments were not found");
  }

  const videoIds = new Set(segments.map((segment) => segment.videoId.toString()));
  if (videoIds.size !== 1) {
    throw createHttpError(400, "All segments must belong to the same video");
  }

  const segmentMap = new Map(segments.map((segment) => [segment._id.toString(), segment]));
  await Promise.all(
    segmentIds.map((id, index) => {
      const segment = segmentMap.get(id);
      segment.index = index + 1;
      return segment.save();
    }),
  );

  return TranscriptSegment.find({ videoId: segments[0].videoId }).sort({ index: 1 });
}
