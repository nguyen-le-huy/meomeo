import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  if (!env.mongoUri) {
    console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
    return null;
  }

  const connection = await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
}
