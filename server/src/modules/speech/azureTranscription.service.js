import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

const audioMimeTypes = {
  ".flac": "audio/flac",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
};

function getAzureSpeechEndpoint() {
  const region = String(config.azureSpeech.region || "").trim();
  if (!config.azureSpeech.key || !region) {
    throw createHttpError(503, "Azure Speech is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.");
  }

  return `https://${region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`;
}

function extractAzureError(payload, fallback) {
  return payload?.error?.innerError?.message || payload?.error?.message || payload?.message || fallback;
}

export async function transcribeAudioFile(audioPath, options = {}) {
  const fileStats = await stat(audioPath);
  if (!fileStats.size) throw createHttpError(422, "Downloaded YouTube audio is empty.");
  if (fileStats.size > 250 * 1024 * 1024) {
    throw createHttpError(422, "Audio exceeds Azure Fast Transcription's 250 MB limit.");
  }

  const audio = await readFile(audioPath);
  const extension = path.extname(audioPath).toLowerCase();
  const form = new FormData();
  form.append("audio", new Blob([audio], { type: audioMimeTypes[extension] || "application/octet-stream" }), path.basename(audioPath));
  form.append(
    "definition",
    JSON.stringify({
      locales: [options.locale || "en-US"],
      profanityFilterMode: "None",
    }),
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15 * 60 * 1000);

  try {
    const response = await fetch(getAzureSpeechEndpoint(), {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": config.azureSpeech.key },
      body: form,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw createHttpError(response.status, extractAzureError(payload, "Azure Speech transcription failed."));
    }

    const segments = (payload?.phrases || [])
      .map((phrase) => {
        const startTime = Number(phrase.offsetMilliseconds || 0) / 1000;
        const duration = Number(phrase.durationMilliseconds || 0) / 1000;
        return {
          startTime,
          endTime: startTime + duration,
          text: String(phrase.text || "").trim(),
          words: (phrase.words || []).map((word) => {
            const wordStart = Number(word.offsetMilliseconds || 0) / 1000;
            const wordDuration = Number(word.durationMilliseconds || 0) / 1000;
            return {
              text: String(word.text || "").trim(),
              startTime: wordStart,
              endTime: wordStart + wordDuration,
            };
          }),
        };
      })
      .filter((segment) => segment.text && segment.endTime > segment.startTime);

    if (!segments.length) throw createHttpError(422, "Azure Speech did not return any usable English transcript segments.");

    return { language: options.locale || "en-US", segments };
  } catch (error) {
    if (error.name === "AbortError") throw createHttpError(504, "Azure Speech transcription timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
