import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { VideoLesson } from './src/modules/videos/video.model.js';
import { analyzeYoutubeUrl } from './src/modules/youtube/youtube.service.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const videos = await VideoLesson.find({ source: 'youtube' });
  console.log(`Found ${videos.length} videos`);
  
  for (const video of videos) {
    if (!video.youtubeUrl) continue;
    try {
      console.log(`Fetching ${video.youtubeUrl}...`);
      const analyzed = await analyzeYoutubeUrl(video.youtubeUrl);
      if (analyzed.video && analyzed.video.viewCount !== undefined) {
        video.viewCount = analyzed.video.viewCount;
        await video.save();
        console.log(`Updated ${video.title} with viewCount: ${video.viewCount}`);
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  process.exit(0);
}

run();
