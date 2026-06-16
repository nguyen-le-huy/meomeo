import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

dotenv.config({ path: path.resolve(currentDir, "../../.env") });

const requiredEnvVars = [
  "PORT",
  "MONGO_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

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
  port,
  mongoUri: process.env.MONGO_URI,
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
  },
};

export const env = config;
