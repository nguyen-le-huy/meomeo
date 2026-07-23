import { VideoLesson } from "../videos/video.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { translateSegmentsInBatches } from "./openaiTranslation.service.js";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function generateVietsub(videoId, options = {}) {
  const video = await VideoLesson.findById(videoId);
  if (!video) throw createHttpError(404, "Video not found");

  if (video.transcriptStatus !== "completed") {
    throw createHttpError(400, "Cannot generate Vietnamese subtitles before transcript is completed");
  }

  const filter = { videoId: video._id, isPublished: true };

  if (!options.force) {
    filter.$or = [
      { translationText: "" },
      { translationText: { $exists: false } },
      { translationStatus: { $in: ["none", "failed"] } },
    ];
  }

  const segments = await TranscriptSegment.find(filter).sort({ index: 1 });
  if (!segments.length) {
    throw createHttpError(400, "No transcript segments need translation");
  }

  const model = options.model || config.openAi.translationModel;
  video.bilingualStatus = "processing";
  video.bilingualError = "";
  video.bilingualModel = model;
  await video.save();

  try {
    const result = await translateSegmentsInBatches(segments, {
      model,
      targetLanguage: options.targetLanguage || config.openAi.translationTargetLanguage,
    });

    const savePromises = result.segments.map((segment) => segment.save());
    await Promise.all(savePromises);

    video.bilingualStatus = result.translatedCount > 0 ? "completed" : "failed";
    video.bilingualGeneratedAt = new Date();
    video.bilingualError = result.translatedCount > 0 ? "" : "No subtitles were translated";
    await video.save();

    return { video, model, translatedCount: result.translatedCount, failedCount: result.failedCount, segments: result.segments };
  } catch (error) {
    console.error("[Vietsub] Lỗi OpenAI:", error.message);
    video.bilingualStatus = "failed";
    video.bilingualError = error.message;
    await video.save();
    throw error;
  }
}

export async function getBilingualVideoData(videoId, options = {}) {
  const filter = { _id: videoId };
  if (!options.admin) {
    filter.isPublished = true;
    filter.deletedAt = { $exists: false };
  }

  const video = await VideoLesson.findOne(filter).populate("topicId");
  if (!video) throw createHttpError(404, "Video not found");
  if (!options.admin && video.source === "bunny" && (video.streamStatus !== "ready" || !video.topicId?.isPublished)) {
    throw createHttpError(404, "Video not found");
  }

  const segmentFilter = { videoId: video._id };
  if (!options.admin) segmentFilter.isPublished = true;

  const segments = await TranscriptSegment.find(segmentFilter).sort({ index: 1 });

  const publicSegments = segments.map((s) => ({
    _id: s._id,
    index: s.index,
    startTime: s.startTime,
    endTime: s.endTime,
    duration: s.duration,
    text: s.text,
    translationText: options.admin || ["translated", "edited"].includes(s.translationStatus) ? s.translationText : "",
    translationLanguage: s.translationLanguage,
    translationStatus: s.translationStatus,
    isPublished: s.isPublished,
  }));

  return {
    video: {
      _id: video._id,
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      youtubeVideoId: video.youtubeVideoId,
      source: video.source,
      contentType: video.contentType,
      bunnyVideoId: video.bunnyVideoId,
      bunnyLibraryId: video.bunnyLibraryId,
      streamStatus: video.streamStatus,
      posterUrl: video.posterUrl,
      backdropUrl: video.backdropUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      level: video.level,
      transcriptStatus: video.transcriptStatus,
      transcriptSource: video.transcriptSource,
      transcriptStage: video.transcriptStage,
      transcriptProgress: video.transcriptProgress,
      transcriptError: video.transcriptError,
      bilingualStatus: video.bilingualStatus,
      bilingualSourceLanguage: video.bilingualSourceLanguage,
      bilingualTargetLanguage: video.bilingualTargetLanguage,
      bilingualGeneratedAt: video.bilingualGeneratedAt,
    },
    segments: publicSegments,
  };
}
