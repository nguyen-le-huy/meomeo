import OpenAI from "openai";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function generateSpeechAudioBuffer(text, options = {}) {
  const input = text?.trim();

  if (!input) {
    throw createHttpError(400, "Text is required to generate audio");
  }

  if (!config.openAi.apiKey) {
    throw createHttpError(500, "OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({
    apiKey: config.openAi.apiKey,
  });

  const response = await openai.audio.speech.create({
    model: config.openAi.ttsModel,
    voice: options.voice || config.openAi.ttsVoice,
    input,
    format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
