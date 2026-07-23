import crypto from "node:crypto";
import { deleteBunnyCaption, upsertBunnyCaption } from "../bunny/bunny.service.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { VideoLesson } from "../videos/video.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

const MOVIE_FILTER = {
  source: "bunny",
  contentType: "movie",
  deletedAt: { $exists: false },
};

// Versioned short codes give every upload a fresh CDN path while the labels
// remain stable in the Bunny player.
const CAPTION_TRACK_TEMPLATES = [
  { prefix: "bi", label: "Song ngữ", mode: "bilingual" },
  { prefix: "en", label: "English", mode: "english" },
  { prefix: "vi", label: "Tiếng Việt", mode: "vietnamese" },
];
const LEGACY_CAPTION_CODES = ["bi", "en", "vi", "mul"];
const CAPTION_FORMAT_VERSION = 6;
const CUE_LAYOUT = "position:50% size:94% align:center";

const activeSyncs = new Map();

function getCaptionTracks(version) {
  const value = Math.max(0, (Number(version) || 1) - 1) % (26 * 26);
  const suffix = `${String.fromCharCode(97 + Math.floor(value / 26))}${String.fromCharCode(97 + (value % 26))}`;
  return CAPTION_TRACK_TEMPLATES.map((track) => ({
    ...track,
    srclang: `${track.prefix[0]}${suffix}`,
  }));
}

export function getBilingualCaptionCode(version) {
  return Number(version) > 0 ? getCaptionTracks(version)[0].srclang : "bi";
}

function formatVttTimestamp(seconds) {
  const milliseconds = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function normalizeCueText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/-->/g, "→")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
}

function getTrackTexts(segment, mode) {
  const english = normalizeCueText(segment.text);
  const vietnamese = normalizeCueText(segment.translationText);
  if (mode === "english") return [english].filter(Boolean);
  if (mode === "vietnamese") return [vietnamese].filter(Boolean);

  // Bunny discards the second physical line inside one cue. Two simultaneous
  // cues survive its processing and are stacked automatically by WebVTT.
  // Bunny renders the later simultaneous cue on the lower row.
  return [english, vietnamese].filter(Boolean);
}

export function createMovieCaptionVtt(segments, mode) {
  const cues = segments
    .flatMap((segment) => {
      const startTime = Number(segment.startTime) || 0;
      const endTime = Math.max(Number(segment.endTime) || 0, startTime);
      return getTrackTexts(segment, mode).map((text) => ({ startTime, endTime, text }));
    })
    .filter((cue) => cue.text && cue.endTime > cue.startTime)
    .map(
      (cue, index) =>
        `${index + 1}\n${formatVttTimestamp(cue.startTime)} --> ${formatVttTimestamp(cue.endTime)} ${CUE_LAYOUT}\n${cue.text}`,
    );

  return `WEBVTT\n\n${cues.join("\n\n")}${cues.length ? "\n" : ""}`;
}

function getCaptionHash(segments) {
  const payload = {
    formatVersion: CAPTION_FORMAT_VERSION,
    segments: segments.map((segment) => [
      Number(segment.startTime) || 0,
      Number(segment.endTime) || 0,
      segment.text || "",
      segment.translationText || "",
    ]),
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function getMovie(movieOrId) {
  if (movieOrId?.bunnyVideoId) return movieOrId;
  const movie = await VideoLesson.findOne({ _id: movieOrId, ...MOVIE_FILTER });
  if (!movie) throw createHttpError(404, "Movie not found");
  return movie;
}

async function performSync(movieOrId, options = {}) {
  const movie = await getMovie(movieOrId);
  if (movie.streamStatus !== "ready") {
    movie.bunnyCaptionSyncStatus = "pending";
    movie.bunnyCaptionSyncHash = "";
    movie.bunnyCaptionSyncError = "";
    await movie.save();
    return { deferred: true, skipped: true, trackCount: 0 };
  }

  const segments = await TranscriptSegment.find({
    videoId: movie._id,
    isPublished: true,
    text: { $ne: "" },
  })
    .sort({ index: 1 })
    .lean();
  const hash = getCaptionHash(segments);
  const previousVersion = Number(movie.bunnyCaptionSyncVersion) || 0;

  if (
    !options.force
    && previousVersion > 0
    && movie.bunnyCaptionSyncStatus === "synced"
    && movie.bunnyCaptionSyncHash === hash
  ) {
    return {
      captionCode: getBilingualCaptionCode(previousVersion),
      hash,
      skipped: true,
      trackCount: CAPTION_TRACK_TEMPLATES.length,
    };
  }

  movie.bunnyCaptionSyncStatus = "processing";
  movie.bunnyCaptionSyncError = "";
  await movie.save();

  try {
    const nextVersion = previousVersion + 1;
    const tracks = getCaptionTracks(nextVersion);
    for (const track of tracks) {
      await upsertBunnyCaption(movie.bunnyVideoId, {
        srclang: track.srclang,
        label: track.label,
        content: createMovieCaptionVtt(segments, track.mode),
      });
    }

    movie.bunnyCaptionSyncStatus = "synced";
    movie.bunnyCaptionSyncHash = hash;
    movie.bunnyCaptionSyncVersion = nextVersion;
    movie.bunnyCaptionSyncError = "";
    movie.bunnyCaptionsSyncedAt = new Date();
    await movie.save();

    const previousCodes = previousVersion > 0
      ? getCaptionTracks(previousVersion).map((track) => track.srclang)
      : [];
    const obsoleteCodes = [...new Set([...LEGACY_CAPTION_CODES, ...previousCodes])]
      .filter((code) => !tracks.some((track) => track.srclang === code));
    await Promise.all(
      obsoleteCodes.map((code) =>
        deleteBunnyCaption(movie.bunnyVideoId, code).catch((error) => {
          if (error.statusCode !== 404) {
            console.warn(`[Bunny captions] Không thể xóa track cũ ${code}: ${error.message}`);
          }
        })),
    );

    return {
      captionCode: getBilingualCaptionCode(nextVersion),
      hash,
      skipped: false,
      trackCount: tracks.length,
    };
  } catch (error) {
    movie.bunnyCaptionSyncStatus = "failed";
    movie.bunnyCaptionSyncError = error.message || "Bunny caption sync failed";
    await movie.save().catch(() => undefined);
    throw error;
  }
}

export function syncMovieCaptions(movieOrId, options = {}) {
  const key = String(movieOrId?._id || movieOrId);
  if (activeSyncs.has(key)) return activeSyncs.get(key);

  const sync = performSync(movieOrId, options).finally(() => activeSyncs.delete(key));
  activeSyncs.set(key, sync);
  return sync;
}

export async function markMovieCaptionsPending(videoId) {
  await VideoLesson.updateOne(
    { _id: videoId, ...MOVIE_FILTER },
    {
      $set: {
        bunnyCaptionSyncStatus: "pending",
        bunnyCaptionSyncHash: "",
        bunnyCaptionSyncError: "",
      },
    },
  );
}
