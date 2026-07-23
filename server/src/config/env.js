import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

dotenv.config({ path: path.resolve(currentDir, "../../.env") });

const requiredEnvVars = [
  "PORT",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  throw new Error("Missing required environment variable: MONGODB_URI or MONGO_URI");
}

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const port = Number(process.env.PORT);
const cambridgeTimeoutMs = Number(process.env.CAMBRIDGE_DICTIONARY_TIMEOUT_MS || 1500);
const dictionaryCacheTtlSeconds = Number(process.env.DICTIONARY_CACHE_TTL_SECONDS || 86400);
const dictionaryCacheMaxEntries = Number(process.env.DICTIONARY_CACHE_MAX_ENTRIES || 1000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  apiPublicUrl: process.env.API_PUBLIC_URL || "",
  port,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET || "change_this_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "",
    endpoint:
      process.env.R2_ENDPOINT ||
      (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : ""),
    region: process.env.R2_REGION || "auto",
    ebookPrefix: process.env.R2_EBOOK_PREFIX || "ebooks",
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || "",
  },
  bunnyStream: {
    libraryId: process.env.BUNNY_STREAM_LIBRARY_ID || "",
    apiKey: process.env.BUNNY_STREAM_API_KEY || "",
    tokenKey: process.env.BUNNY_STREAM_TOKEN_KEY || "",
    readOnlyApiKey: process.env.BUNNY_STREAM_READ_ONLY_API_KEY || process.env.BUNNY_STREAM_WEBHOOK_SECRET || "",
    pullZoneHost: process.env.BUNNY_STREAM_PULL_ZONE_HOST || "",
    uploadExpiresIn: Number(process.env.BUNNY_STREAM_UPLOAD_EXPIRES_IN || 86400),
    playbackExpiresIn: Number(process.env.BUNNY_STREAM_PLAYBACK_EXPIRES_IN || 300),
  },
  azureSpeech: {
    key: process.env.AZURE_SPEECH_KEY || "",
    region: process.env.AZURE_SPEECH_REGION || "",
  },
  openAi: {
    apiKey: process.env.OPENAI_API_KEY || "",
    ttsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
    ttsVoice: process.env.OPENAI_TTS_VOICE || "alloy",
    translationModel: process.env.OPENAI_TRANSLATION_MODEL || "deepseek-v4-pro",
    translationTargetLanguage: process.env.OPENAI_TRANSLATION_TARGET_LANGUAGE || "vi",
    dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL || "gpt-4o-mini",
    vocabularyModel: process.env.OPENAI_VOCABULARY_MODEL || process.env.OPENAI_DICTIONARY_MODEL || "gpt-4o-mini",
  },
  deepSeek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    model: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
    voiceId: process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb",
  },
  cambridgeDictionary: {
    enabled: process.env.CAMBRIDGE_DICTIONARY_ENABLED !== "false",
    baseUrl:
      process.env.CAMBRIDGE_DICTIONARY_BASE_URL ||
      "https://dictionary.cambridge.org/dictionary/english-vietnamese",
    timeoutMs: Number.isInteger(cambridgeTimeoutMs) && cambridgeTimeoutMs > 0 ? cambridgeTimeoutMs : 1500,
  },
  dictionary: {
    cacheTtlMs:
      Number.isInteger(dictionaryCacheTtlSeconds) && dictionaryCacheTtlSeconds > 0
        ? dictionaryCacheTtlSeconds * 1000
        : 86400 * 1000,
    cacheMaxEntries:
      Number.isInteger(dictionaryCacheMaxEntries) && dictionaryCacheMaxEntries > 0 ? dictionaryCacheMaxEntries : 1000,
  },
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "123456",
  },
};

export const env = config;
