import ytdlp from "yt-dlp-exec";
import { createHttpError } from "../../utils/createHttpError.js";

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

function normalizeTranscriptText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
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

export async function analyzeYoutubeUrl(youtubeUrl) {
  const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

  try {
    const output = await ytdlp(youtubeUrl, {
      dumpSingleJson: true,
      skipDownload: true,
      writeAutoSub: true,
      subLang: "en",
      noWarnings: true,
    });

    const rawSubtitles = output.subtitles?.en || output.automatic_captions?.en || [];
    const transcriptLanguage = rawSubtitles.length ? "en" : "";

    return {
      video: {
        youtubeVideoId,
        title: output.title || `YouTube video ${youtubeVideoId}`,
        thumbnailUrl: output.thumbnail || `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
        duration: Number(output.duration || 0),
        youtubeUrl,
      },
      transcriptLanguage,
      transcripts: [],
      rawTranscriptSources: rawSubtitles.map((item) => ({
        ext: item.ext,
        url: item.url,
        name: item.name,
      })),
    };
  } catch (error) {
    return {
      video: {
        youtubeVideoId,
        title: `YouTube video ${youtubeVideoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
        duration: 0,
        youtubeUrl,
      },
      transcriptLanguage: "",
      transcripts: [],
      warning: `yt-dlp metadata fallback used: ${error.message}`,
    };
  }
}

export function normalizeTranscriptSegments(segments) {
  return segments
    .map((segment, index) => normalizeSegment(segment, index + 1))
    .filter((segment) => segment.text && segment.endTime >= segment.startTime);
}
