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

const nonSpeechAnnotationPattern = /[\[(]\s*(?:music|instrumental|applause|cheering|laughter|singing)\s*[\])]/gi;
const musicSymbolPattern = /[♪♫♬♩🎵🎶]+/g;
const commonUppercaseTerms = ["AI", "BBC", "TV", "UK", "USA", "YouTube"];

function restoreEnglishCasing(text) {
  const letters = text.match(/[a-z]/gi) || [];
  const uppercaseLetters = text.match(/[A-Z]/g) || [];
  const isAllCaps = letters.length >= 4 && uppercaseLetters.length / letters.length >= 0.92;
  if (!isAllCaps) return text;

  let result = text.toLocaleLowerCase("en-US");
  result = result.replace(/\bi(?=(?:['’](?:m|d|ll|ve|re))?\b)/gi, (value) => `I${value.slice(1)}`);
  result = result.replace(
    /(^|[.!?]\s+)(["'‘’([{]*)([a-z])/g,
    (match, prefix, opening, letter) => `${prefix}${opening}${letter.toUpperCase()}`,
  );

  for (const term of commonUppercaseTerms) {
    result = result.replace(new RegExp(`\\b${term.toLocaleLowerCase("en-US")}\\b`, "gi"), term);
  }

  return result;
}

function cleanTranscriptToken(text) {
  return normalizeTranscriptText(text)
    .replace(nonSpeechAnnotationPattern, "")
    .replace(musicSymbolPattern, "")
    .trim();
}

export function cleanTranscriptText(text) {
  const cleaned = normalizeTranscriptText(text)
    .replace(nonSpeechAnnotationPattern, " ")
    .replace(musicSymbolPattern, " ")
    .replace(/\.{3,}/g, "…")
    .replace(/\s*…\s*/g, "… ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:!?])(?=[\p{L}\p{N}])/gu, "$1 ")
    .replace(/\s+/g, " ")
    .trim();

  return restoreEnglishCasing(cleaned);
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
  const text = cleanTranscriptText(segment.text);
  const words = Array.isArray(segment.words)
    ? segment.words
        .map((word) => ({
          text: cleanTranscriptToken(word.text),
          startTime: Number(word.startTime),
          endTime: Number(word.endTime),
        }))
        .filter(
          (word) =>
            word.text &&
            Number.isFinite(word.startTime) &&
            Number.isFinite(word.endTime) &&
            word.endTime > word.startTime,
        )
    : [];

  return {
    index,
    startTime,
    endTime,
    text,
    words,
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
      const eventSegments = event.segs || [];
      const text = normalizeTranscriptText(
        eventSegments
          .map((segment) => segment.utf8 || "")
          .join("")
          .replace(/\n/g, " "),
      );

      const startTime = Number(event.tStartMs || 0) / 1000;
      const duration = Number(event.dDurationMs || 0) / 1000;
      const endTime = startTime + duration;
      const words = eventSegments.flatMap((segment, segmentIndex) => {
        const segmentText = normalizeTranscriptText(segment.utf8 || "");
        const tokens = segmentText.split(/\s+/).filter(Boolean);
        if (!tokens.length) return [];

        const segmentStart = startTime + Number(segment.tOffsetMs || 0) / 1000;
        const nextOffset = eventSegments
          .slice(segmentIndex + 1)
          .find((nextSegment) => Number.isFinite(Number(nextSegment.tOffsetMs)))?.tOffsetMs;
        const segmentEnd = nextOffset === undefined
          ? endTime
          : Math.min(endTime, startTime + Number(nextOffset) / 1000);
        const tokenDuration = Math.max(0.04, (segmentEnd - segmentStart) / tokens.length);

        return tokens.map((token, tokenIndex) => ({
          text: token,
          startTime: segmentStart + tokenDuration * tokenIndex,
          endTime: Math.min(segmentEnd, segmentStart + tokenDuration * (tokenIndex + 1)),
        }));
      });

      return {
        startTime,
        endTime,
        text,
        words,
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
    text: cleanTranscriptText(`${current.text} ${next.text}`),
    words: [...(current.words || []), ...(next.words || [])],
  };
}

const maxSegmentWords = 12;
const minSegmentWords = 3;
const targetSegmentWords = 8;
const maxSegmentDuration = 8;
const strongBoundaryPattern = /[.!?][\"')\]]*$/;
const softBoundaryPattern = /[,;:][\"')\]]*$/;

function chooseChunkEnd(tokens, startIndex) {
  const remaining = tokens.length - startIndex;
  const firstToken = tokens[startIndex];
  const lastToken = tokens[tokens.length - 1];
  const hasTiming = Number.isFinite(firstToken?.startTime) && Number.isFinite(lastToken?.endTime);
  const remainingDuration = hasTiming ? lastToken.endTime - firstToken.startTime : 0;
  if (remaining <= maxSegmentWords && (!hasTiming || remainingDuration <= maxSegmentDuration)) {
    return tokens.length;
  }

  let maximumEnd = Math.min(tokens.length, startIndex + maxSegmentWords);
  const minimumEnd = Math.min(maximumEnd, startIndex + minSegmentWords);
  if (remaining <= maxSegmentWords && hasTiming && remainingDuration > maxSegmentDuration) {
    maximumEnd = Math.max(minimumEnd, tokens.length - minSegmentWords);
  }
  if (tokens.length - maximumEnd > 0 && tokens.length - maximumEnd < minSegmentWords) {
    maximumEnd = Math.max(minimumEnd, tokens.length - minSegmentWords);
  }

  let bestEnd = maximumEnd;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let end = minimumEnd; end <= maximumEnd; end += 1) {
    const token = tokens[end - 1];
    const nextToken = tokens[end];
    const chunkWordCount = end - startIndex;
    let score = -Math.abs(chunkWordCount - targetSegmentWords) * 4;

    if (strongBoundaryPattern.test(token?.text || "")) score += 90;
    else if (softBoundaryPattern.test(token?.text || "")) score += 45;

    if (Number.isFinite(token?.endTime) && Number.isFinite(nextToken?.startTime)) {
      const pause = nextToken.startTime - token.endTime;
      if (pause >= 0.6) score += 110;
      else if (pause >= 0.35) score += 75;
      else if (pause >= 0.18) score += 30;
    }

    if (hasTiming) {
      const chunkDuration = token.endTime - firstToken.startTime;
      if (chunkDuration > maxSegmentDuration) score -= 160 + (chunkDuration - maxSegmentDuration) * 20;
      else score += 10;
    }

    if (score > bestScore || (score === bestScore && end > bestEnd)) {
      bestScore = score;
      bestEnd = end;
    }
  }

  return bestEnd;
}

function splitLongSegment(segment) {
  const fallbackTokens = segment.text.split(/\s+/).filter(Boolean).map((text) => ({ text }));
  const timedWords = segment.words?.length ? segment.words : null;
  const tokens = timedWords || fallbackTokens;
  const timedDuration = timedWords
    ? timedWords[timedWords.length - 1].endTime - timedWords[0].startTime
    : 0;
  const shouldSplitForDuration =
    Boolean(timedWords) && tokens.length >= minSegmentWords * 2 && timedDuration > maxSegmentDuration;

  if (tokens.length <= maxSegmentWords && !shouldSplitForDuration) {
    return [segment];
  }
  // Never invent sub-cue timestamps. Long cues without word timing must be
  // aligned from audio by the worker instead of being split proportionally.
  if (!timedWords) return [segment];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < tokens.length) {
    const endIndex = chooseChunkEnd(tokens, startIndex);
    const chunkTokens = tokens.slice(startIndex, endIndex);
    const chunkStart = chunkTokens[0].startTime;
    const chunkEnd = chunkTokens[chunkTokens.length - 1].endTime;

    chunks.push({
      startTime: Math.max(segment.startTime, chunkStart),
      endTime: Math.min(segment.endTime, Math.max(chunkStart + 0.04, chunkEnd)),
      text: cleanTranscriptText(chunkTokens.map((token) => token.text).join(" ")),
      words: chunkTokens,
    });
    startIndex = endIndex;
  }

  return chunks;
}

export function mergeShortSegments(segments, options = {}) {
  const normalizedSegments = segments
    .map((segment, index) => normalizeSegment(segment, index + 1))
    .filter((segment) => segment.text && segment.endTime >= segment.startTime)
    .flatMap(splitLongSegment);
  const merged = [];

  for (const segment of normalizedSegments) {
    const previous = merged[merged.length - 1];
    const segmentWordCount = getWordCount(segment.text);
    const previousWordCount = previous ? getWordCount(previous.text) : 0;
    const mergedDuration = previous ? segment.endTime - previous.startTime : 0;
    const gap = previous ? segment.startTime - previous.endTime : Number.POSITIVE_INFINITY;
    const previousHasSentenceBoundary = previous ? /[.!?]["')\]]*$/.test(previous.text) : false;
    const hasShortFragment = previousWordCount <= 2 || segmentWordCount <= 2;
    const shouldMergeWithPrevious =
      previous &&
      !options.preserveCueBoundaries &&
      hasShortFragment &&
      !previousHasSentenceBoundary &&
      gap >= -0.1 &&
      gap <= 0.35 &&
      previousWordCount + segmentWordCount <= maxSegmentWords &&
      mergedDuration <= 8;

    if (shouldMergeWithPrevious) {
      merged[merged.length - 1] = mergeTwoSegments(previous, segment);
      continue;
    }

    merged.push(segment);
  }

  return merged.map((segment, index) => ({ ...segment, index: index + 1 }));
}

export function normalizeTranscriptSegments(segments, options = {}) {
  return mergeShortSegments(segments, options);
}

export function requiresAudioWordAlignment(segments = []) {
  return segments.some((segment) => {
    const wordCount = getWordCount(segment.text);
    const timedWordCount = Array.isArray(segment.words) ? segment.words.length : 0;
    return wordCount > maxSegmentWords && timedWordCount < wordCount * 0.8;
  });
}

export async function analyzeYoutubeUrl(youtubeUrl) {
  const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);

  try {
    const metadata = await getYoutubeMetadata(youtubeUrl);

    try {
      const transcript = await getYoutubeTranscript(metadata);
      if (requiresAudioWordAlignment(transcript.transcripts)) {
        return {
          video: metadata.video,
          transcriptLanguage: transcript.language,
          transcriptSource: transcript.source,
          transcripts: [],
          transcriptError: "YouTube subtitles do not contain precise word timestamps for long cues.",
          requiresAudioAlignment: true,
        };
      }
      const transcripts = normalizeTranscriptSegments(transcript.transcripts, {
        preserveCueBoundaries: transcript.source === "manual",
      });

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
