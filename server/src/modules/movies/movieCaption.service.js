import crypto from "node:crypto";
import { upsertBunnyCaption } from "../bunny/bunny.service.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { VideoLesson } from "../videos/video.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

const MOVIE_FILTER = {
  source: "bunny",
  contentType: "movie",
  deletedAt: { $exists: false },
};

// Bunny requires a unique ISO 639-1 code per caption track. "bi" is used as
// the stable key for the combined track; the player-facing label is "Song ngữ".
const CAPTION_TRACKS = [
  { srclang: "bi", label: "Song ngữ", mode: "bilingual" },
  { srclang: "en", label: "English", mode: "english" },
  { srclang: "vi", label: "Tiếng Việt", mode: "vietnamese" },
];
const CAPTION_FORMAT_VERSION = 2;
const CUE_LAYOUT = "position:50% size:94% align:center";

const activeSyncs = new Map();

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

function getTrackText(segment, mode) {
  const english = normalizeCueText(segment.text);
  const vietnamese = normalizeCueText(segment.translationText);
  if (mode === "english") return english;
  if (mode === "vietnamese") return vietnamese;
  return [english, vietnamese].filter(Boolean).join("\n");
}

export function createMovieCaptionVtt(segments, mode) {
  const cues = segments
    .map((segment) => ({
      startTime: Number(segment.startTime) || 0,
      endTime: Math.max(Number(segment.endTime) || 0, Number(segment.startTime) || 0),
      text: getTrackText(segment, mode),
    }))
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

  if (!options.force && movie.bunnyCaptionSyncStatus === "synced" && movie.bunnyCaptionSyncHash === hash) {
    return { hash, skipped: true, trackCount: CAPTION_TRACKS.length };
  }

  movie.bunnyCaptionSyncStatus = "processing";
  movie.bunnyCaptionSyncError = "";
  await movie.save();

  try {
    for (const track of CAPTION_TRACKS) {
      await upsertBunnyCaption(movie.bunnyVideoId, {
        srclang: track.srclang,
        label: track.label,
        content: createMovieCaptionVtt(segments, track.mode),
      });
    }

    movie.bunnyCaptionSyncStatus = "synced";
    movie.bunnyCaptionSyncHash = hash;
    movie.bunnyCaptionSyncError = "";
    movie.bunnyCaptionsSyncedAt = new Date();
    await movie.save();
    return { hash, skipped: false, trackCount: CAPTION_TRACKS.length };
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
