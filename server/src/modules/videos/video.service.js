import { Topic } from "../topics/topic.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { analyzeYoutubeUrl, normalizeTranscriptSegments } from "../youtube/youtube.service.js";
import { VideoLesson } from "./video.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSegment(videoId, segment, index, source = "youtube") {
  const text = segment.text.trim();
  const normalizedText = normalizeText(text);
  const startTime = Number(segment.startTime);
  const endTime = Number(segment.endTime);

  return {
    videoId,
    index: index + 1,
    startTime,
    endTime,
    duration: Math.max(0, endTime - startTime),
    text,
    normalizedText,
    wordCount: normalizedText ? normalizedText.split(" ").length : 0,
    source,
    isPublished: true,
  };
}

async function assertTopic(topicId, options = {}) {
  const filter = { _id: topicId };
  if (!options.admin) filter.isPublished = true;
  const topic = await Topic.findOne(filter);
  if (!topic) throw createHttpError(404, "Topic not found");
  return topic;
}

async function getDefaultTopic() {
  const topic = await Topic.findOne({ slug: "all-videos" });

  if (topic) return topic;

  return Topic.create({
    name: "All videos",
    slug: "all-videos",
    description: "Internal default topic for videos without categories.",
    order: 0,
    isPublished: false,
  });
}

export async function createTranscriptSegments(videoId, segments = [], source = "youtube") {
  const normalizedSegments =
    source === "manual"
      ? segments
          .map((segment) => ({
            startTime: Number(segment.startTime),
            endTime: Number(segment.endTime),
            text: String(segment.text || "").trim(),
          }))
          .filter((segment) => segment.text && Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime) && segment.endTime > segment.startTime)
      : normalizeTranscriptSegments(segments);
  await TranscriptSegment.deleteMany({ videoId });

  if (!normalizedSegments.length) return [];
  return TranscriptSegment.insertMany(
    normalizedSegments.map((segment, index) => buildSegment(videoId, segment, index, source)),
  );
}

export async function getVideos(query = {}, options = {}) {
  const filter = { contentType: { $ne: "movie" } };

  if (!options.admin || !query.includeUnpublished) {
    filter.isPublished = true;
  }
  if (query.topicId) filter.topicId = query.topicId;
  if (query.level) filter.level = query.level;
  if (query.search) {
    const search = { $regex: escapeRegExp(query.search), $options: "i" };
    filter.$or = [{ title: search }, { description: search }];
  }

  return VideoLesson.find(filter).populate("topicId").sort({ createdAt: -1 });
}

export async function getVideosByTopicSlug(slug, options = {}) {
  const topic = await Topic.findOne({ slug, ...(!options.admin ? { isPublished: true } : {}) });
  if (!topic) throw createHttpError(404, "Topic not found");
  return getVideos({ topicId: topic._id, includeUnpublished: options.admin }, options);
}

export async function getVideoById(id, options = {}) {
  const filter = { _id: id };
  if (!options.admin) filter.isPublished = true;
  const video = await VideoLesson.findOne(filter).populate("topicId");
  if (!video) throw createHttpError(404, "Video not found");
  return video;
}

export async function getVideoTranscripts(id, options = {}) {
  await getVideoById(id, options);
  const filter = { videoId: id };
  if (!options.admin) filter.isPublished = true;
  return TranscriptSegment.find(filter).sort({ index: 1 });
}

export async function createVideo(data, adminUser) {
  const topic = data.topicId ? await assertTopic(data.topicId, { admin: true }) : await getDefaultTopic();
  const analyzed = await analyzeYoutubeUrl(data.youtubeUrl);
  const existingVideo = await VideoLesson.findOne({ youtubeVideoId: analyzed.video.youtubeVideoId });

  if (existingVideo) {
    throw createHttpError(409, "Video already exists");
  }

  const hasManualTranscripts = Boolean(data.transcripts?.length);
  const transcriptInputs = data.transcripts || analyzed.transcripts || [];
  const transcriptStatus = transcriptInputs.length ? "completed" : "failed";
  const requestedPublish = data.isPublished ?? false;

  if (requestedPublish && transcriptStatus !== "completed") {
    throw createHttpError(400, analyzed.transcriptError || "Cannot publish video before transcript is completed");
  }

  const video = await VideoLesson.create({
    topicId: topic._id,
    youtubeUrl: analyzed.video.youtubeUrl,
    youtubeVideoId: analyzed.video.youtubeVideoId,
    title: data.title || analyzed.video.title,
    description: data.description || "",
    thumbnailUrl: analyzed.video.thumbnailUrl,
    duration: analyzed.video.duration,
    level: data.level || "A2",
    transcriptStatus,
    transcriptLanguage: analyzed.transcriptLanguage || "en",
    transcriptError: transcriptInputs.length ? "" : analyzed.transcriptError || "No English transcript found for this video.",
    isPublished: requestedPublish,
    createdBy: adminUser.id,
  });

  const segments = await createTranscriptSegments(video._id, transcriptInputs, hasManualTranscripts ? "manual" : "youtube");
  return {
    video,
    segments,
    transcriptsCount: segments.length,
    analysisWarning: analyzed.warning,
  };
}

export async function updateVideo(id, data) {
  const video = await getVideoById(id, { admin: true });

  if (data.topicId !== undefined) {
    const topic = data.topicId ? await assertTopic(data.topicId, { admin: true }) : await getDefaultTopic();
    video.topicId = topic._id;
  }
  if (data.youtubeUrl !== undefined) {
    const analyzed = await analyzeYoutubeUrl(data.youtubeUrl);
    video.youtubeUrl = analyzed.video.youtubeUrl;
    video.youtubeVideoId = analyzed.video.youtubeVideoId;
    if (!data.title) video.title = analyzed.video.title;
    video.thumbnailUrl = analyzed.video.thumbnailUrl;
    video.duration = analyzed.video.duration;
  }
  if (data.title !== undefined) video.title = data.title;
  if (data.description !== undefined) video.description = data.description;
  if (data.level !== undefined) video.level = data.level;
  if (data.isPublished !== undefined) video.isPublished = data.isPublished;

  await video.save();
  return video;
}

export async function deleteVideo(id) {
  const video = await getVideoById(id, { admin: true });
  await TranscriptSegment.deleteMany({ videoId: video._id });
  await video.deleteOne();
  return { id };
}

export async function publishVideo(id, isPublished) {
  const video = await getVideoById(id, { admin: true });

  if (isPublished) {
    const segmentsCount = await TranscriptSegment.countDocuments({ videoId: video._id });

    if (video.transcriptStatus !== "completed" || segmentsCount < 1) {
      throw createHttpError(400, "Cannot publish video before transcript is completed");
    }
  }

  video.isPublished = isPublished;
  await video.save();
  return video;
}

export async function analyzeVideoTranscript(id) {
  const video = await getVideoById(id, { admin: true });
  video.transcriptStatus = "processing";
  await video.save();

  const analyzed = await analyzeYoutubeUrl(video.youtubeUrl);
  const segments = await createTranscriptSegments(video._id, analyzed.transcripts || []);
  video.transcriptStatus = segments.length ? "completed" : "failed";
  video.transcriptLanguage = analyzed.transcriptLanguage || video.transcriptLanguage;
  video.transcriptError = segments.length ? "" : analyzed.transcriptError || "No English transcript found for this video.";
  await video.save();

  return { video, segments, transcriptsCount: segments.length, analysisWarning: analyzed.warning };
}
