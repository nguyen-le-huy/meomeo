import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import OpenAI from "openai";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

const openAiAudioLimitBytes = 25 * 1024 * 1024;

function getOpenAIClient() {
  if (!config.openAi.apiKey) {
    throw createHttpError(503, "OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey: config.openAi.apiKey });
}

function normalizeWord(word) {
  const startTime = Number(word.start ?? word.startTime);
  const endTime = Number(word.end ?? word.endTime);
  const text = String(word.word ?? word.text ?? "").trim();

  if (!text || !Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return null;
  }

  return { text, startTime, endTime };
}

function buildSegmentsFromWords(words) {
  if (!words.length) return [];

  const segments = [];
  let current = [];

  for (const word of words) {
    const previous = current[current.length - 1];
    const gap = previous ? word.startTime - previous.endTime : 0;
    const duration = current.length ? word.endTime - current[0].startTime : 0;
    const endsSentence = previous ? /[.!?]["')\]]*$/.test(previous.text) : false;

    if (current.length && (endsSentence || gap > 0.8 || current.length >= 24 || duration > 11)) {
      segments.push(current);
      current = [];
    }

    current.push(word);
  }

  if (current.length) segments.push(current);

  return segments.map((chunk) => ({
    startTime: chunk[0].startTime,
    endTime: chunk[chunk.length - 1].endTime,
    text: chunk.map((word) => word.text).join(" "),
    words: chunk,
  }));
}

export async function transcribeAudioFileWithOpenAI(audioPath, options = {}) {
  const fileStats = await stat(audioPath);
  if (!fileStats.size) throw createHttpError(422, "Downloaded YouTube audio is empty.");
  if (fileStats.size > openAiAudioLimitBytes) {
    throw createHttpError(422, "Audio is too large for OpenAI Whisper transcription. Use a shorter video or add chunked transcription.");
  }

  const client = getOpenAIClient();
  const response = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: options.model || config.openAi.transcriptionModel,
    language: options.language || "en",
    prompt: options.prompt || undefined,
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
  });

  const words = (response.words || []).map(normalizeWord).filter(Boolean);
  const fallbackSegments = (response.segments || [])
    .map((segment) => {
      const startTime = Number(segment.start);
      const endTime = Number(segment.end);
      const segmentWords = words.filter((word) => word.startTime >= startTime - 0.05 && word.endTime <= endTime + 0.05);
      return {
        startTime,
        endTime,
        text: String(segment.text || "").trim(),
        words: segmentWords,
      };
    })
    .filter((segment) => segment.text && Number.isFinite(segment.startTime) && Number.isFinite(segment.endTime) && segment.endTime > segment.startTime);

  const alignedSegments = words.length ? buildSegmentsFromWords(words) : fallbackSegments;
  if (!alignedSegments.length) {
    throw createHttpError(422, "OpenAI Whisper did not return usable word-level transcript timestamps.");
  }

  return {
    language: options.language || "en",
    model: options.model || config.openAi.transcriptionModel,
    segments: alignedSegments,
  };
}
