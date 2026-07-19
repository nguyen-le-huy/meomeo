/**
 * One-time migration script: drop the old youtubeVideoId_1 unique index
 * so Mongoose can recreate it with the correct partialFilterExpression.
 *
 * Run once: node server/scripts/fix-youtube-index.js
 */
import mongoose from "mongoose";
import { config } from "../src/config/env.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB:", config.mongoUri.replace(/:\/\/[^@]+@/, "://***@"));

  const collection = mongoose.connection.collection("videolessons");
  const indexes = await collection.indexes();

  console.log("Current indexes:");
  for (const idx of indexes) {
    console.log(" -", idx.name, JSON.stringify(idx.key), idx.unique ? "[unique]" : "", idx.partialFilterExpression ? `[partial: ${JSON.stringify(idx.partialFilterExpression)}]` : "");
  }

  // Drop the old simple unique index if it exists (no partialFilterExpression)
  const oldIndex = indexes.find(
    (i) => i.name === "youtubeVideoId_1" && i.unique && !i.partialFilterExpression
  );

  if (oldIndex) {
    await collection.dropIndex("youtubeVideoId_1");
    console.log("✅ Dropped old index: youtubeVideoId_1");
  } else {
    console.log("ℹ️  Old index youtubeVideoId_1 (without partialFilterExpression) not found – nothing to drop.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
