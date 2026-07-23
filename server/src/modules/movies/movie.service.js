import { Readable } from "node:stream";
import path from "node:path";
import { Topic } from "../topics/topic.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { VideoLesson } from "../videos/video.model.js";
import {
  createBunnyVideo,
  createPlaybackData,
  createTusUploadCredentials,
  deleteBunnyVideo,
  getBunnyLibraryId,
  getBunnyThumbnailUrl,
  getBunnyVideo,
  isBunnyManifestReady,
  isBunnyPlaybackReady,
  mapBunnyStatus,
} from "../bunny/bunny.service.js";
import { generateVietsub } from "../bilingual/bilingual.service.js";
import { createTranscriptSegments } from "../videos/video.service.js";
import { createHttpError } from "../../utils/createHttpError.js";
import { cloudinary } from "../../config/cloudinary.js";
import { parseSubtitle } from "./subtitleParser.js";
import { parsePlainTextVi } from "./plainTextViParser.js";
import { getBilingualCaptionCode, syncMovieCaptions } from "./movieCaption.service.js";

const MOVIE_FILTER = { source: "bunny", contentType: "movie", deletedAt: { $exists: false } };

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getDefaultMovieTopic() {
  const existing = await Topic.findOne({ slug: "all-videos" });
  if (existing) return existing;
  return Topic.create({
    name: "All videos",
    slug: "all-videos",
    description: "Internal category for uncategorized videos and movies.",
    order: 0,
    isPublished: false,
  });
}

function uploadPoster(file) {
  if (!file) return Promise.resolve(null);
  const extension = path.extname(file.originalname).toLowerCase().replace(".", "") || "jpg";
  const publicId = `${Date.now()}-${path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "movie-poster"}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "meomeo/movie-posters",
        public_id: publicId,
        resource_type: "image",
        format: extension,
        transformation: [{ width: 1000, height: 1500, crop: "limit", quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(createHttpError(502, `Poster upload failed: ${error.message || "Cloudinary error"}`));
        else resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });
}

function uploadHeroThumbnail(file) {
  if (!file) throw createHttpError(400, "Hero thumbnail is required");
  const extension = path.extname(file.originalname).toLowerCase().replace(".", "") || "jpg";
  const publicId = `${Date.now()}-${path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "movie-hero"}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "meomeo/movie-heroes",
        public_id: publicId,
        resource_type: "image",
        format: extension,
        transformation: [{ width: 1920, height: 1080, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(createHttpError(502, `Hero thumbnail upload failed: ${error.message || "Cloudinary error"}`));
        else resolve(result);
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });
}

async function getMovieDocument(id, options = {}) {
  const filter = { _id: id, ...MOVIE_FILTER };
  if (!options.admin) {
    Object.assign(filter, { isPublished: true, streamStatus: "ready" });
  }
  const movie = await VideoLesson.findOne(filter).populate("topicId");
  if (!movie) throw createHttpError(404, "Movie not found");
  if (!options.admin) {
    const segmentExists = await TranscriptSegment.exists({ videoId: movie._id, isPublished: true, text: { $ne: "" } });
    if (!segmentExists) throw createHttpError(404, "Movie not found");
  }
  return movie;
}

export async function getMoviePublishEligibility(movieOrId) {
  const movie = typeof movieOrId === "string" ? await getMovieDocument(movieOrId, { admin: true }) : movieOrId;
  const englishSegmentCount = await TranscriptSegment.countDocuments({ videoId: movie._id, isPublished: true, text: { $ne: "" } });
  const reasons = [];
  if (movie.streamStatus !== "ready") reasons.push({ code: "STREAM_NOT_READY", message: "Video chưa encode xong trên Bunny" });
  if (!movie.title?.trim()) reasons.push({ code: "TITLE_REQUIRED", message: "Thiếu tên phim" });
  if (englishSegmentCount < 1) reasons.push({ code: "ENGLISH_SUBTITLE_REQUIRED", message: "Cần ít nhất một câu phụ đề English" });
  return { eligible: reasons.length === 0, reasons, englishSegmentCount };
}

function serializeMovie(movie, extra = {}) {
  const value = movie.toObject ? movie.toObject() : movie;
  return { ...value, ...extra };
}

export async function getMovieLibrary(query = {}, options = {}) {
  const adminView = Boolean(options.admin && query.includeUnpublished);
  const movieFilter = { ...MOVIE_FILTER };
  if (!adminView) Object.assign(movieFilter, { isPublished: true, streamStatus: "ready" });
  if (query.search) {
    const search = { $regex: escapeRegExp(query.search), $options: "i" };
    movieFilter.$or = [{ title: search }, { description: search }];
  }

  let movies = await VideoLesson.find(movieFilter).sort({ isFeatured: -1, createdAt: -1 }).lean();
  const playableIds = await TranscriptSegment.distinct("videoId", {
    videoId: { $in: movies.map((movie) => movie._id) },
    isPublished: true,
    text: { $ne: "" },
  });
  const playableSet = new Set(playableIds.map(String));
  if (!adminView) movies = movies.filter((movie) => playableSet.has(String(movie._id)));

  const featuredMovie = movies.find((movie) => movie.isFeatured) || movies[0] || null;
  return {
    featuredMovie,
    movies,
    categories: [],
    counts: adminView
      ? {
          total: movies.length,
          public: movies.filter((movie) => movie.isPublished && movie.streamStatus === "ready" && playableSet.has(String(movie._id))).length,
          processing: movies.filter((movie) => ["created", "uploading", "processing"].includes(movie.streamStatus)).length,
          failed: movies.filter((movie) => movie.streamStatus === "failed").length,
        }
      : undefined,
  };
}

export async function getMovieDetail(id, options = {}) {
  const movie = await getMovieDocument(id, options);
  const segmentFilter = { videoId: movie._id, ...(options.admin ? {} : { isPublished: true }) };
  const segments = await TranscriptSegment.find(segmentFilter).sort({ index: 1 });
  const eligibility = options.admin ? await getMoviePublishEligibility(movie) : undefined;
  return { movie: serializeMovie(movie), segments, eligibility };
}

export async function createMovie(data, adminUser, files = {}) {
  const topic = await getDefaultMovieTopic();
  const bunnyVideo = await createBunnyVideo(data.title);
  let posterResult = null;
  let movie = null;
  try {
    posterResult = await uploadPoster(files.posterFile);
    movie = await VideoLesson.create({
      ...data,
      topicId: topic._id,
      source: "bunny",
      contentType: "movie",
      bunnyVideoId: bunnyVideo.guid,
      bunnyLibraryId: String(bunnyVideo.videoLibraryId || bunnyVideo.libraryId || getBunnyLibraryId()),
      streamStatus: "created",
      uploadBytesTotal: data.uploadFileSize,
      transcriptStatus: "pending",
      posterUrl: posterResult?.secure_url || data.posterUrl || "",
      posterPublicId: posterResult?.public_id || "",
      backdropUrl: data.backdropUrl || posterResult?.secure_url || data.posterUrl || "",
      isPublished: false,
      createdBy: adminUser.id,
    });
    if (files.subtitleFile) {
      await importEnglishSubtitle(movie._id.toString(), files.subtitleFile.buffer.toString("utf8"), false);
      movie = await VideoLesson.findById(movie._id);
    }
    if (files.viSubtitleFile) {
      await importVietnameseSubtitle(movie._id.toString(), files.viSubtitleFile.buffer.toString("utf8"), false);
      movie = await VideoLesson.findById(movie._id);
    }
    return { movie, upload: createTusUploadCredentials(movie.bunnyVideoId) };
  } catch (error) {
    if (movie?._id) {
      await Promise.all([
        VideoLesson.deleteOne({ _id: movie._id }),
        TranscriptSegment.deleteMany({ videoId: movie._id }),
      ]).catch(() => undefined);
    }
    if (posterResult?.public_id) cloudinary.uploader.destroy(posterResult.public_id, { resource_type: "image" }).catch(() => undefined);
    deleteBunnyVideo(bunnyVideo.guid).catch(() => undefined);
    throw error;
  }
}

export async function updateMovie(id, data, files = {}) {
  const movie = await getMovieDocument(id, { admin: true });
  if (!Object.keys(data).length && !files.posterFile) throw createHttpError(400, "At least one field or a poster is required");
  let posterResult = null;
  const previousPosterPublicId = movie.posterPublicId;
  const backdropUsedPoster = !movie.heroThumbnailUrl && movie.backdropUrl === movie.posterUrl;
  if (files.posterFile) posterResult = await uploadPoster(files.posterFile);
  for (const field of ["title", "description", "posterUrl", "backdropUrl", "releaseYear", "ageRating", "level", "rating"]) {
    if (data[field] !== undefined) movie[field] = data[field];
  }
  if (posterResult) {
    movie.posterUrl = posterResult.secure_url;
    movie.posterPublicId = posterResult.public_id;
    if (backdropUsedPoster) movie.backdropUrl = posterResult.secure_url;
  }
  try {
    await movie.save();
  } catch (error) {
    if (posterResult?.public_id) await cloudinary.uploader.destroy(posterResult.public_id, { resource_type: "image" }).catch(() => undefined);
    throw error;
  }
  if (posterResult && previousPosterPublicId && previousPosterPublicId !== posterResult.public_id) {
    cloudinary.uploader.destroy(previousPosterPublicId, { resource_type: "image" }).catch(() => undefined);
  }
  return movie.populate("topicId");
}

export async function setFeaturedMovie(id, thumbnailFile) {
  const movie = await getMovieDocument(id, { admin: true });
  const previousPublicId = movie.heroThumbnailPublicId;
  const upload = await uploadHeroThumbnail(thumbnailFile);
  try {
    await VideoLesson.updateMany({ ...MOVIE_FILTER, _id: { $ne: movie._id }, isFeatured: true }, { $set: { isFeatured: false } });
    movie.isFeatured = true;
    movie.heroThumbnailUrl = upload.secure_url;
    movie.heroThumbnailPublicId = upload.public_id;
    await movie.save();
  } catch (error) {
    await cloudinary.uploader.destroy(upload.public_id, { resource_type: "image" }).catch(() => undefined);
    throw error;
  }
  if (previousPublicId && previousPublicId !== upload.public_id) {
    cloudinary.uploader.destroy(previousPublicId, { resource_type: "image" }).catch(() => undefined);
  }
  return movie.populate("topicId");
}

export async function getMovieUploadCredentials(id, fileMetadata) {
  const movie = await getMovieDocument(id, { admin: true });
  if (["processing", "ready"].includes(movie.streamStatus)) {
    throw createHttpError(409, "Movie video upload is already complete");
  }

  const expected = {
    fileName: movie.uploadFileName,
    fileSize: Number(movie.uploadFileSize || 0),
    fileLastModified: Number(movie.uploadFileLastModified || 0),
    fileType: movie.uploadFileType,
  };
  if (
    (expected.fileName && expected.fileName !== fileMetadata.fileName)
    || (expected.fileSize && expected.fileSize !== fileMetadata.fileSize)
    || (expected.fileLastModified && fileMetadata.fileLastModified && expected.fileLastModified !== fileMetadata.fileLastModified)
    || (expected.fileType && expected.fileType !== fileMetadata.fileType)
  ) {
    throw createHttpError(409, "File đã chọn không khớp với file video ban đầu. Hãy chọn đúng file để tiếp tục upload.");
  }

  movie.uploadFileName ||= fileMetadata.fileName;
  movie.uploadFileSize ||= fileMetadata.fileSize;
  movie.uploadFileLastModified ||= fileMetadata.fileLastModified;
  movie.uploadFileType ||= fileMetadata.fileType;
  movie.streamStatus = "uploading";
  movie.streamError = "";
  movie.uploadUpdatedAt = new Date();
  await movie.save();
  return createTusUploadCredentials(movie.bunnyVideoId);
}

export async function reportMovieUploadProgress(id, data) {
  const movie = await getMovieDocument(id, { admin: true });
  if (movie.streamStatus === "ready") return movie;
  movie.streamStatus = "uploading";
  movie.uploadProgress = Math.max(movie.uploadProgress || 0, data.progress);
  movie.uploadBytesUploaded = Math.max(movie.uploadBytesUploaded || 0, data.bytesUploaded);
  movie.uploadBytesTotal = Math.max(movie.uploadBytesTotal || 0, data.bytesTotal);
  movie.uploadUpdatedAt = new Date();
  movie.streamError = data.error || "";
  await movie.save();
  return movie;
}

export async function markMovieUploadCompleted(id) {
  const movie = await getMovieDocument(id, { admin: true });
  if (movie.streamStatus !== "ready") movie.streamStatus = "processing";
  movie.uploadProgress = 100;
  movie.uploadBytesUploaded = movie.uploadBytesTotal || movie.uploadBytesUploaded;
  movie.uploadUpdatedAt = new Date();
  movie.streamError = "";
  await movie.save();
  return movie;
}

async function applyBunnyMetadata(movie, remote) {
  const remoteStatus = mapBunnyStatus(remote.status);
  const playbackReady = isBunnyPlaybackReady(remote)
    || ([3, 4].includes(Number(remote.status)) && await isBunnyManifestReady(movie.bunnyVideoId));
  movie.streamStatus = playbackReady
    ? "ready"
    : remoteStatus === "failed"
      ? "failed"
      : remoteStatus === "uploading"
        ? "uploading"
        : remoteStatus === "created" && movie.uploadProgress < 100
          ? "created"
          : "processing";
  movie.duration = Number(remote.length || movie.duration || 0);
  movie.encodeProgress = Math.min(100, Math.max(0, Number(remote.encodeProgress || 0)));
  if (remote.thumbnailFileName && !movie.thumbnailUrl) {
    movie.thumbnailUrl = getBunnyThumbnailUrl(movie.bunnyVideoId, remote.thumbnailFileName);
  }
  if (movie.streamStatus === "ready") {
    movie.streamReadyAt ||= new Date();
    movie.uploadProgress = 100;
    movie.encodeProgress = 100;
    movie.streamError = "";
  } else if (movie.streamStatus === "processing") {
    movie.streamError = "";
  } else if (movie.streamStatus === "failed") {
    movie.streamError = "Bunny Stream could not process this video";
  }
}

export async function syncMovieStreamStatus(id) {
  const movie = await getMovieDocument(id, { admin: true });
  const remote = await getBunnyVideo(movie.bunnyVideoId);
  await applyBunnyMetadata(movie, remote);
  await movie.save();
  if (movie.streamStatus === "ready") {
    await syncMovieCaptions(movie, { force: true, replaceExisting: true });
  }
  return movie;
}

export async function handleBunnyWebhook(payload) {
  if (String(payload.VideoLibraryId) !== getBunnyLibraryId()) throw createHttpError(400, "Unexpected Bunny library id");
  const movie = await VideoLesson.findOne({ ...MOVIE_FILTER, bunnyVideoId: payload.VideoGuid });
  if (!movie) return null;
  const mappedStatus = mapBunnyStatus(payload.Status);
  const nextStatus = mappedStatus === "created" && movie.uploadProgress >= 100 ? "processing" : mappedStatus;

  // Bunny can deliver webhook events out of order (for example, a caption event
  // after encoding finished). Never regress a playable video to processing.
  if (movie.streamStatus === "ready" && nextStatus !== "failed") {
    if (Number(payload.Status) === 3 && movie.encodeProgress < 100) {
      movie.encodeProgress = 100;
      await movie.save();
    }
    return movie;
  }
  if (movie.streamStatus === nextStatus && ![3, 4, 7].includes(Number(payload.Status))) return movie;

  movie.streamStatus = nextStatus;
  if ([3, 4, 7].includes(Number(payload.Status))) {
    movie.uploadProgress = 100;
    movie.uploadBytesTotal ||= movie.uploadFileSize;
    movie.uploadBytesUploaded = movie.uploadBytesTotal || movie.uploadFileSize || movie.uploadBytesUploaded;
    movie.uploadUpdatedAt = new Date();
  }
  if (nextStatus === "ready") {
    movie.streamReadyAt ||= new Date();
    if (Number(payload.Status) === 3) movie.encodeProgress = 100;
    movie.streamError = "";
  }
  if (nextStatus === "failed") {
    movie.streamError = "Bunny Stream encoding failed";
  }
  await movie.save();
  return movie;
}

export async function getMoviePlayback(id, options = {}) {
  const movie = await getMovieDocument(id, options);
  const remote = await getBunnyVideo(movie.bunnyVideoId);
  await applyBunnyMetadata(movie, remote);
  await movie.save();
  if (movie.streamStatus !== "ready") {
    throw createHttpError(409, `Video đang được Bunny encode (${movie.encodeProgress || 0}%)`);
  }
  try {
    await syncMovieCaptions(movie);
  } catch (error) {
    console.error(`[Bunny captions] Không thể đồng bộ phụ đề cho phim ${movie._id}:`, error.message);
  }
  return createPlaybackData(
    movie.bunnyVideoId,
    getBilingualCaptionCode(movie.bunnyCaptionSyncVersion),
  );
}

export async function importEnglishSubtitle(id, content, dryRun) {
  const movie = await getMovieDocument(id, { admin: true });
  const result = parseSubtitle(content);
  if (result.errors.length) throw createHttpError(422, "Subtitle file is invalid", result.errors);
  const preview = { count: result.segments.length, warnings: result.warnings, duration: result.segments.at(-1)?.endTime || 0 };
  if (dryRun) return preview;
  const segments = await createTranscriptSegments(movie._id, result.segments, "manual");
  movie.transcriptStatus = segments.length ? "completed" : "failed";
  movie.transcriptError = "";
  await movie.save();
  await syncMovieCaptions(movie);
  return { ...preview, savedCount: segments.length };
}

export async function importVietnameseSubtitle(id, content, dryRun) {
  const movie = await getMovieDocument(id, { admin: true });
  const parsed = parseSubtitle(content);
  if (parsed.errors.length) throw createHttpError(422, "Subtitle file is invalid", parsed.errors);
  const englishSegments = await TranscriptSegment.find({ videoId: movie._id }).sort({ index: 1 });
  if (!englishSegments.length) throw createHttpError(409, "Import English subtitles before Vietnamese subtitles");

  const usedIndexes = new Set();
  const matches = parsed.segments.map((segment) => {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    englishSegments.forEach((english, index) => {
      const distance = Math.abs(english.startTime - segment.startTime);
      if (!usedIndexes.has(index) && distance <= 0.75 && distance < bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    });
    if (bestIndex >= 0) usedIndexes.add(bestIndex);
    return { segment, english: bestIndex >= 0 ? englishSegments[bestIndex] : null, distance: bestDistance };
  });
  const unmatchedCount = matches.filter((match) => !match.english).length;
  const preview = { matchedCount: matches.length - unmatchedCount, unmatchedCount, warnings: parsed.warnings };
  if (unmatchedCount) throw createHttpError(422, "Some Vietnamese cues could not be matched safely", [preview]);
  if (dryRun) return preview;

  await Promise.all(
    matches.map(({ english, segment }) => {
      english.translationText = segment.text;
      english.translationStatus = "edited";
      english.translatedAt = new Date();
      return english.save();
    }),
  );
  movie.bilingualStatus = matches.length === englishSegments.length ? "completed" : "pending";
  movie.bilingualError = "";
  await movie.save();
  await syncMovieCaptions(movie);
  return { ...preview, savedCount: matches.length };
}

export async function importVietnamesePlainText(id, content, dryRun) {
  const movie = await getMovieDocument(id, { admin: true });
  const parsed = parsePlainTextVi(content);

  if (parsed.errors.length) {
    throw createHttpError(422, parsed.errors[0].message);
  }

  const englishSegments = await TranscriptSegment.find({ videoId: movie._id }).sort({ index: 1 });
  if (!englishSegments.length) {
    throw createHttpError(409, "Import English subtitles before Vietnamese subtitles");
  }

  const { translations } = parsed;

  if (translations.length > englishSegments.length) {
    throw createHttpError(
      422,
      `File có ${translations.length} dòng nhưng phim chỉ có ${englishSegments.length} câu EN. Hãy kiểm tra lại.`,
    );
  }

  const nonEmptyCount = translations.filter(Boolean).length;
  const preview = {
    totalLines: translations.length,
    nonEmptyLines: nonEmptyCount,
    segmentCount: englishSegments.length,
    warnings: parsed.warnings,
  };

  if (dryRun) return preview;

  // Update each segment that has a non-null translation
  await Promise.all(
    translations.map((text, i) => {
      const segment = englishSegments[i];
      if (!segment || text === null) return null;
      segment.translationText = text;
      segment.translationStatus = "edited";
      segment.translatedAt = new Date();
      return segment.save();
    }).filter(Boolean),
  );

  const updatedCount = translations.length - translations.filter((t) => t === null).length;
  const totalTranslated = await TranscriptSegment.countDocuments({
    videoId: movie._id,
    translationText: { $ne: "" },
  });
  movie.bilingualStatus = totalTranslated >= englishSegments.length ? "completed" : "pending";
  movie.bilingualError = "";
  await movie.save();
  await syncMovieCaptions(movie);

  return { ...preview, savedCount: updatedCount };
}

export async function generateMovieVietsub(id, options = {}) {
  const movie = await getMovieDocument(id, { admin: true });
  const result = await generateVietsub(movie._id.toString(), options);
  // Sync captions to Bunny after translation — failures are non-fatal:
  // translation data is already saved so we only warn instead of throwing.
  await syncMovieCaptions(movie).catch((syncError) => {
    console.warn("[generateMovieVietsub] Bunny caption sync failed after successful translation:", syncError?.message);
  });
  return {
    model: result.model,
    translatedCount: result.translatedCount,
    failedCount: result.failedCount,
  };
}

export async function publishMovie(id, isPublished) {
  const movie = await getMovieDocument(id, { admin: true });
  if (isPublished) {
    const eligibility = await getMoviePublishEligibility(movie);
    if (!eligibility.eligible) throw createHttpError(409, "Movie is not eligible for publishing", eligibility.reasons);
    await syncMovieCaptions(movie);
    movie.publishedAt = new Date();
  }
  movie.isPublished = isPublished;
  if (!isPublished) movie.publishedAt = undefined;
  await movie.save();
  return movie;
}

export async function deleteMovie(id, options = {}) {
  const movie = await getMovieDocument(id, { admin: true });
  movie.deletedAt = new Date();
  movie.isPublished = false;
  await movie.save();
  if (options.deleteAsset) await deleteBunnyVideo(movie.bunnyVideoId);
  if (options.deleteAsset && movie.posterPublicId) {
    await cloudinary.uploader.destroy(movie.posterPublicId, { resource_type: "image" }).catch(() => undefined);
  }
  if (options.deleteAsset && movie.heroThumbnailPublicId) {
    await cloudinary.uploader.destroy(movie.heroThumbnailPublicId, { resource_type: "image" }).catch(() => undefined);
  }
  return { id: movie._id, deletedAt: movie.deletedAt, assetDeleted: Boolean(options.deleteAsset) };
}
