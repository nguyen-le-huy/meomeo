/**
 * One-time migration: set youtubeVideoId and youtubeUrl to null
 * for existing Bunny/movie documents that have empty strings.
 *
 * Run: node server/scripts/fix-empty-youtube-fields.js
 */
import mongoose from "mongoose";
import { config } from "../src/config/env.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected.");

  const col = mongoose.connection.collection("videolessons");

  const r1 = await col.updateMany({ youtubeVideoId: "" }, { $set: { youtubeVideoId: null } });
  const r2 = await col.updateMany({ youtubeUrl: "" }, { $set: { youtubeUrl: null } });

  console.log(`✅ Fixed youtubeVideoId: ${r1.modifiedCount} documents`);
  console.log(`✅ Fixed youtubeUrl: ${r2.modifiedCount} documents`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
