import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function generateElevenLabsAudioBuffer(text, options = {}) {
  const apiKey = options.apiKey || config.elevenLabs.apiKey;
  const voiceId = options.voiceId || config.elevenLabs.voiceId;

  if (!text?.trim()) throw createHttpError(400, "Text is required to generate audio");
  if (!apiKey) throw createHttpError(400, "ElevenLabs API key is not configured");
  if (!voiceId) throw createHttpError(400, "ElevenLabs voice id is required");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: options.model || config.elevenLabs.model,
        voice_settings: {
          stability: options.stability ?? 0.55,
          similarity_boost: options.similarityBoost ?? 0.75,
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw createHttpError(502, `ElevenLabs audio generation failed: ${details.slice(0, 180)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
