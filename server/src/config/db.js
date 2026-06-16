import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectDB() {
  try {
    const connection = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Atlas connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}
