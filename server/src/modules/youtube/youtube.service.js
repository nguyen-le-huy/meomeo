import { execFile } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import ytdlp from "yt-dlp-exec";
import { createHttpError } from "../../utils/createHttpError.js";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const ytDlpPostinstallPath = require.resolve("yt-dlp-exec/scripts/postinstall.js");
const ytDlpPackageRoot = path.dirname(path.dirname(ytDlpPostinstallPath));
const ytDlpBinaryPath = path.join(ytDlpPackageRoot, "bin", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
let ytDlpBinaryPromise;

const transcriptExtensionPriority = ["json3", "vtt", "srv3", "ttml"];

async function ensureYtDlpBinary() {
  try {
    await access(ytDlpBinaryPath, fsConstants.X_OK);
    return;
  } catch {
    // The package downloads the native yt-dlp binary in postinstall. Some local
    // installs skip scripts, so recover once at runtime before failing analysis.
  }

  ytDlpBinaryPromise ||= execFileAsync(process.execPath, [ytDlpPostinstallPath], {
    cwd: ytDlpPackageRoot,
    timeout: 120000,
  }).then(async () => {
    await access(ytDlpBinaryPath, fsConstants.X_OK);
  });

  await ytDlpBinaryPromise;
}

async function runYtDlp(youtubeUrl, options) {
  await ensureYtDlpBinary();
  return ytdlp(youtubeUrl, options);
}

export function extractYoutubeVideoId(url) {
  const value = String(url || "").trim();
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (/^[a-zA-Z0-9_-]{8,}$/.test(value)) return value;
  throw createHttpError(400, "Invalid YouTube URL");
}

export function normalizeTranscriptText(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(text) {
  const normalized = normalizeTranscriptText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized ? normalized.split(" ").length : 0;
}

function parseTimestamp(value) {
  const parts = String(value || "").trim().split(":");
  const secondsPart = parts.pop() || "0";
  const seconds = Number(secondsPart.replace(",", "."));
  const minutes = Number(parts.pop() || 0);
  const hours = Number(parts.pop() || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function normalizeSegment(segment, index) {
  const startTime = Number(segment.start ?? segment.startTime ?? 0);
  const duration = Number(segment.duration ?? 0);
  const endTime = Number(segment.end ?? segment.endTime ?? startTime + duration);
  const text = normalizeTranscriptText(segment.text);

  return {
    index,
    startTime,
    endTime,
    text,
  };
}

function pickPreferredSubtitleTrack(metadata) {
  for (const container of ["subtitles", "automatic_captions"]) {
    const availableTracks = metadata[container] || {};
    const languages = [
      "en",
      "en-US",
      ...Object.keys(availableTracks).filter((language) => /^en(?:[-_]|$)/i.test(language)),
    ].filter((language, index, values) => values.indexOf(language) === index);

    for (const language of languages) {
      const tracks = availableTracks[language];
      if (!tracks?.length) continue;

      for (const ext of transcriptExtensionPriority) {
        const track = tracks.find((item) => item.ext === ext && item.url);
        if (track) return { ...track, language, source: container === "subtitles" ? "manual" : "auto" };
      }

      const fallbackTrack = tracks.find((item) => item.url);
      if (fallbackTrack) {
        return {
          ...fallbackTrack,
          language,
          source: container === "subtitles" ? "manual" : "auto",
        };
      }
    }
  }

  return null;
}

export async function getYoutubeMetadata(youtubeUrl) {
  const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);
  const output = await runYtDlp(youtubeUrl, {
    dumpSingleJson: true,
    skipDownload: true,
    writeSub: true,
    writeAutoSub: true,
    subLang: "en,en-US",
    noWarnings: true,
  });

  return {
    raw: output,
    video: {
      youtubeUrl,
      youtubeVideoId,
      title: output.title || `YouTube video ${youtubeVideoId}`,
      description: output.description || "",
      thumbnailUrl: output.thumbnail || `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
      duration: Number(output.duration || 0),
      viewCount: Number(output.view_count || 0),
    },
  };
}

export async function getYoutubeTranscript(metadata) {
  const track = pickPreferredSubtitleTrack(metadata.raw);

  if (!track) {
    throw createHttpError(422, "No English transcript found for this video.");
  }

  const response = await fetch(track.url);

  if (!response.ok) {
    throw createHttpError(502, "Failed to download YouTube transcript.");
  }

  const rawSubtitle = await response.text();
  const transcripts = parseSubtitleToSegments(rawSubtitle, track.ext);

  if (!transcripts.length) {
    throw createHttpError(422, "No usable transcript segments found for this video.");
  }

  return {
    language: track.language,
    source: track.source,
    transcripts,
  };
}

export async function downloadYoutubeAudio(youtubeUrl) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "meomeo-youtube-audio-"));
  const sourceTemplate = path.join(directory, "source.%(ext)s");
  const outputPath = path.join(directory, "audio.flac");

  try {
    await runYtDlp(youtubeUrl, {
      format: "bestaudio/best",
      output: sourceTemplate,
      noPlaylist: true,
      noWarnings: true,
    });

    const files = await readdir(directory);
    const sourceName = files.find((name) => name.startsWith("source."));
    if (!sourceName) throw createHttpError(502, "yt-dlp did not produce an audio file.");
    const ffmpegBinary = process.env.FFMPEG_PATH || ffmpegPath || "ffmpeg";

    await execFileAsync(
      ffmpegBinary,
      ["-y", "-i", path.join(directory, sourceName), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "flac", outputPath],
      { timeout: 15 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 },
    );

    return {
      audioPath: outputPath,
      cleanup: () => rm(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    if (error.statusCode) throw error;
    throw createHttpError(502, `Failed to download YouTube audio: ${error.message}`);
  }
}

function parseJson3Subtitle(rawSubtitle) {
  const payload = JSON.parse(rawSubtitle);
  const events = Array.isArray(payload.events) ? payload.events : [];

  return events
    .map((event) => {
      const text = normalizeTranscriptText(
        (event.segs || [])
          .map((segment) => segment.utf8 || "")
          .join("")
          .replace(/\n/g, " "),
      );

      const startTime = Number(event.tStartMs || 0) / 1000;
      const duration = Number(event.dDurationMs || 0) / 1000;
      return {
        startTime,
        endTime: startTime + duration,
        text,
      };
    })
    .filter((segment) => segment.text);
}

function parseVttSubtitle(rawSubtitle) {
  return rawSubtitle
    .replace(/\r/g, "")
    .split(/\n\n+/)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const timeLine = lines.find((line) => line.includes("-->"));

      if (!timeLine) return null;

      const [startRaw, endRaw] = timeLine.split("-->").map((value) => value.trim().split(/\s+/)[0]);
      const text = normalizeTranscriptText(
        lines
          .filter((line) => !line.includes("-->") && !line.startsWith("WEBVTT") && !line.startsWith("Kind:") && !line.startsWith("Language:"))
          .join(" "),
      );

      return {
        startTime: parseTimestamp(startRaw),
        endTime: parseTimestamp(endRaw),
        text,
      };
    })
    .filter(Boolean)
    .filter((segment) => segment.text);
}

function parseXmlLikeSubtitle(rawSubtitle) {
  return Array.from(rawSubtitle.matchAll(/<text[^>]*start="([^"]+)"[^>]*(?:dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/g))
    .map((match) => {
      const startTime = Number(match[1] || 0);
      const duration = Number(match[2] || 0);
      return {
        startTime,
        endTime: startTime + duration,
        text: normalizeTranscriptText(match[3]),
      };
    })
    .filter((segment) => segment.text);
}

export function parseSubtitleToSegments(rawSubtitle, extension = "") {
  const ext = extension.toLowerCase();

  if (ext === "json3") return parseJson3Subtitle(rawSubtitle);
  if (ext === "vtt") return parseVttSubtitle(rawSubtitle);
  if (ext === "srv3" || ext === "ttml") return parseXmlLikeSubtitle(rawSubtitle);

  try {
    return parseJson3Subtitle(rawSubtitle);
  } catch {
    return parseVttSubtitle(rawSubtitle);
  }
}

function mergeTwoSegments(current, next) {
  return {
    startTime: current.startTime,
    endTime: next.endTime,
    text: normalizeTranscriptText(`${current.text} ${next.text}`),
  };
}

export function mergeShortSegments(segments) {
  const normalizedSegments = segments
    .map((segment, index) => normalizeSegment(segment, index + 1))
    .filter((segment) => segment.text && segment.endTime >= segment.startTime);
  const merged = [];

  for (const segment of normalizedSegments) {
    const previous = merged[merged.length - 1];
    const segmentWordCount = getWordCount(segment.text);
    const previousWordCount = previous ? getWordCount(previous.text) : 0;
    const mergedDuration = previous ? segment.endTime - previous.startTime : 0;
    const shouldMergeWithPrevious =
      previous &&
      (previousWordCount < 2 ||
        segmentWordCount < 2 ||
        (previousWordCount + segmentWordCount <= 12 && mergedDuration <= 8));

    if (shouldMergeWithPrevious) {
      merged[merged.length - 1] = mergeTwoSegments(previous, segment);
      continue;
    }

    merged.push(segment);
  }

  return merged.map((segment, index) => ({ ...segment, index: index + 1 }));
}

export function normalizeTranscriptSegments(segments) {
  return mergeShortSegments(segments);
}

export async function analyzeYoutubeUrl(youtubeUrl) {
  const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

  try {
    const metadata = await getYoutubeMetadata(youtubeUrl);

    try {
      const transcript = await getYoutubeTranscript(metadata);
      const transcripts = normalizeTranscriptSegments(transcript.transcripts);

      return {
        video: metadata.video,
        transcriptLanguage: transcript.language,
        transcriptSource: transcript.source,
        transcripts,
      };
    } catch (error) {
      return {
        video: metadata.video,
        transcriptLanguage: "",
        transcripts: [],
        transcriptError: error.message,
      };
    }
  } catch (error) {
    return {
      video: {
        youtubeVideoId,
        title: `YouTube video ${youtubeVideoId}`,
        description: "",
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
        duration: 0,
        viewCount: 0,
        youtubeUrl,
      },
      transcriptLanguage: "",
      transcripts: [],
      transcriptError: `yt-dlp failed: ${error.message}`,
      warning: `yt-dlp metadata fallback used: ${error.message}`,
    };
  }
}
