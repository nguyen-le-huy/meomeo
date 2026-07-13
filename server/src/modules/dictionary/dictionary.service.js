import OpenAI from "openai";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";
import { lookupCambridgeDictionary } from "./cambridgeDictionary.service.js";

let openaiClient;
const dictionaryCache = new Map();

function getOpenAIClient() {
  if (!config.openAi.apiKey) {
    throw createHttpError(500, "OPENAI_API_KEY is not configured");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: config.openAi.apiKey });
  }

  return openaiClient;
}

function normalizeQuery(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildCacheKey(query, context) {
  return `${query.toLowerCase()}\n${normalizeQuery(context || "").toLowerCase()}`;
}

function getCachedResult(cacheKey) {
  const cached = dictionaryCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    dictionaryCache.delete(cacheKey);
    return null;
  }

  return cached.result;
}

function setCachedResult(cacheKey, result) {
  if (dictionaryCache.size >= config.dictionary.cacheMaxEntries) {
    const oldestKey = dictionaryCache.keys().next().value;
    if (oldestKey) dictionaryCache.delete(oldestKey);
  }

  dictionaryCache.set(cacheKey, {
    expiresAt: Date.now() + config.dictionary.cacheTtlMs,
    result,
  });
}

function guessInputType(query) {
  const wordCount = query.split(/\s+/).filter(Boolean).length;
  const hasSentencePunctuation = /[.!?;:]/.test(query);

  if (wordCount <= 1) return "word";
  if (wordCount <= 4 && !hasSentencePunctuation) return "phrase";
  if (wordCount <= 14) return "sentence";
  return "paragraph";
}

function canUseCambridge(query) {
  const wordCount = query.split(/\s+/).filter(Boolean).length;
  const hasSentencePunctuation = /[.!?;:]/.test(query);
  return wordCount <= 4 && !hasSentencePunctuation;
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).slice(0, 8) : [];
}

function normalizeResult(result, query) {
  const inputType = ["word", "phrase", "idiom", "sentence", "paragraph"].includes(result?.inputType)
    ? result.inputType
    : guessInputType(query);

  return {
    query,
    normalizedQuery: normalizeQuery(result?.normalizedQuery || query).toLowerCase(),
    inputType,
    source: "openai",
    sourceLabel: "OpenAI",
    partOfSpeech: result?.partOfSpeech || "",
    phonetic: result?.phonetic || "",
    pronunciationHint: result?.pronunciationHint || "",
    vietnameseMeaning: result?.vietnameseMeaning || "",
    contextualMeaning: result?.contextualMeaning || "",
    explanation: result?.explanation || "",
    nuance: result?.nuance || "",
    translation: result?.translation || "",
    examples: safeArray(result?.examples),
    collocations: safeArray(result?.collocations),
    relatedTerms: safeArray(result?.relatedTerms),
    notes: safeArray(result?.notes),
  };
}

function buildSystemPrompt() {
  return [
    "You are an English-Vietnamese dictionary and learning assistant for Vietnamese students.",
    "Classify the user's input as word, phrase, idiom, sentence, or paragraph.",
    "For a single word, provide dictionary-style Vietnamese meanings, part of speech, phonetic text if known, pronunciation hint, examples, collocations, and related terms.",
    "For phrases, idioms, sentences, or paragraphs, translate naturally into Vietnamese, explain grammar/usage/nuance, and provide useful examples.",
    "Keep Vietnamese concise and learner-friendly. Do not invent source names such as Cambridge or Wordnik.",
    "Return only valid JSON that matches the requested schema.",
  ].join("\n");
}

function buildUserPrompt(query, context) {
  return JSON.stringify({
    query,
    context: context || "",
    outputSchema: {
      normalizedQuery: "string",
      inputType: "word | phrase | idiom | sentence | paragraph",
      partOfSpeech: "string",
      phonetic: "string",
      pronunciationHint: "Vietnamese pronunciation guidance, short",
      vietnameseMeaning: "string",
      contextualMeaning: "string",
      translation: "string",
      explanation: "string",
      nuance: "string",
      examples: ["English example - Vietnamese translation"],
      collocations: ["common combination - Vietnamese meaning"],
      relatedTerms: ["term - Vietnamese meaning"],
      notes: ["short usage note"],
    },
  });
}

export async function lookupDictionary(data) {
  const query = normalizeQuery(data.query);
  if (!query) throw createHttpError(400, "Query is required");

  const cacheKey = buildCacheKey(query, data.context);
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) return cachedResult;

  if (canUseCambridge(query)) {
    try {
      const cambridgeResult = await lookupCambridgeDictionary(query);
      if (cambridgeResult) {
        setCachedResult(cacheKey, cambridgeResult);
        return cambridgeResult;
      }
    } catch (error) {
      console.warn(`Cambridge dictionary lookup failed: ${error.message}`);
    }
  }

  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: config.openAi.dictionaryModel,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(query, data.context) },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw createHttpError(502, "Dictionary lookup returned an empty response");
  }

  try {
    const result = normalizeResult(JSON.parse(content), query);
    setCachedResult(cacheKey, result);
    return result;
  } catch {
    throw createHttpError(502, "Dictionary lookup returned invalid JSON");
  }
}
