import { TranscriptSegment } from "./transcriptSegment.model.js";
import { VideoLesson } from "../videos/video.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

async function markCaptionSyncPending(videoIds) {
  const ids = [...new Set([videoIds].flat().filter(Boolean).map(String))];
  if (!ids.length) return;
  await VideoLesson.updateMany(
    { _id: { $in: ids }, source: "bunny", contentType: "movie" },
    {
      $set: {
        bunnyCaptionSyncStatus: "pending",
        bunnyCaptionSyncHash: "",
        bunnyCaptionSyncError: "",
      },
    },
  );
}

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

export async function createSegment(data) {
  const video = await VideoLesson.findById(data.videoId);
  if (!video) throw createHttpError(404, "Video not found");

  if (data.endTime < data.startTime) {
    throw createHttpError(400, "End time must be greater than or equal to start time");
  }

  const lastSegment = await TranscriptSegment.findOne({ videoId: video._id }).sort({ index: -1 });
  const normalizedText = normalizeText(data.text);
  const segment = await TranscriptSegment.create({
    videoId: video._id,
    index: lastSegment ? lastSegment.index + 1 : 1,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: Math.max(0, data.endTime - data.startTime),
    text: data.text,
    normalizedText,
    wordCount: getWordCount(data.text),
    source: "manual",
    isPublished: data.isPublished ?? true,
  });

  video.transcriptStatus = "completed";
  video.transcriptSource = "manual";
  video.transcriptStage = "";
  video.transcriptProgress = 100;
  video.transcriptError = "";
  if (!video.transcriptLanguage) video.transcriptLanguage = "en";
  await video.save();
  await markCaptionSyncPending(video._id);

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

  if (data.translationText !== undefined) {
    segment.translationText = data.translationText;
    if (data.translationText.trim()) {
      segment.translationStatus = "edited";
      segment.translationError = "";
      segment.translatedAt = new Date();
    } else {
      segment.translationStatus = "none";
      segment.translationError = "";
      segment.translatedAt = undefined;
    }
  }

  await segment.save();
  await markCaptionSyncPending(segment.videoId);
  return segment;
}

export async function bulkUpdateTranslations(updates) {
  const segmentIds = updates.map(({ segmentId }) => segmentId);
  const existingSegments = await TranscriptSegment.find({ _id: { $in: segmentIds } }).select("_id videoId").lean();

  if (existingSegments.length !== segmentIds.length) {
    throw createHttpError(404, "Some transcript segments were not found");
  }

  const translatedAt = new Date();
  const result = await TranscriptSegment.bulkWrite(
    updates.map(({ segmentId, translationText }) => {
      const text = translationText.trim();
      const update = {
        $set: {
          translationText: text,
          translationStatus: text ? "edited" : "none",
          translationError: "",
          updatedAt: translatedAt,
        },
      };

      if (text) {
        update.$set.translatedAt = translatedAt;
      } else {
        update.$unset = { translatedAt: 1 };
      }

      return {
        updateOne: {
          filter: { _id: segmentId },
          update,
        },
      };
    }),
    { ordered: false },
  );
  await markCaptionSyncPending(existingSegments.map((segment) => segment.videoId));

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
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
  await markCaptionSyncPending(segment.videoId);

  return segment;
}

export async function deleteSegment(segmentId) {
  const segment = await getSegment(segmentId);
  await segment.deleteOne();
  await markCaptionSyncPending(segment.videoId);

  return { id: segmentId };
}

export async function deleteSegments(segmentIds) {
  const uniqueSegmentIds = [...new Set(segmentIds)];
  const segments = await TranscriptSegment.find({ _id: { $in: uniqueSegmentIds } }).select("_id videoId");

  if (segments.length !== uniqueSegmentIds.length) {
    throw createHttpError(404, "Some transcript segments were not found");
  }

  await TranscriptSegment.deleteMany({ _id: { $in: uniqueSegmentIds } });
  await markCaptionSyncPending(segments.map((segment) => segment.videoId));

  return { ids: uniqueSegmentIds, deletedCount: uniqueSegmentIds.length };
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
  await markCaptionSyncPending(segments[0].videoId);

  return TranscriptSegment.find({ videoId: segments[0].videoId }).sort({ index: 1 });
}
