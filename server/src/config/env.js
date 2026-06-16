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

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
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
  azureSpeech: {
    key: process.env.AZURE_SPEECH_KEY || "",
    region: process.env.AZURE_SPEECH_REGION || "",
  },
  openAi: {
    apiKey: process.env.OPENAI_API_KEY || "",
    ttsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
    ttsVoice: process.env.OPENAI_TTS_VOICE || "alloy",
  },
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "123456",
  },
};

export const env = config;
