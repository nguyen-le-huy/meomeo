import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { VideoLesson } from "../videos/video.model.js";
import { transcribeAudioFile } from "../speech/azureTranscription.service.js";
import { analyzeYoutubeUrl, downloadYoutubeAudio, normalizeTranscriptSegments } from "./youtube.service.js";
import { YoutubeTranscriptJob } from "./youtubeTranscriptJob.model.js";

const pollIntervalMs = 2000;
const staleLockMs = 20 * 60 * 1000;
let pollTimer;
let workerBusy = false;

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function segmentSource(transcriptSource) {
  if (transcriptSource === "youtube_auto") return "youtube_auto";
  if (transcriptSource === "azure_speech") return "azure_speech";
  return "youtube";
}

async function updateVideoStage(videoId, transcriptStage, transcriptProgress) {
  await VideoLesson.updateOne(
    { _id: videoId, transcriptSource: { $ne: "manual" } },
    { $set: { transcriptStatus: "processing", transcriptStage, transcriptProgress, transcriptError: "" } },
  );
}

async function replaceSegments(video, segments, transcriptSource, language) {
  const latestVideo = await VideoLesson.findById(video._id);
  if (!latestVideo || latestVideo.transcriptSource === "manual") return false;

  const normalizedSegments = normalizeTranscriptSegments(segments);
  if (!normalizedSegments.length) throw new Error("No usable transcript segments were generated.");

  await TranscriptSegment.deleteMany({ videoId: video._id });
  await TranscriptSegment.insertMany(
    normalizedSegments.map((segment, index) => {
      const text = String(segment.text || "").trim();
      const normalized = normalizeText(text);
      const startTime = Number(segment.startTime);
      const endTime = Number(segment.endTime);
      return {
        videoId: video._id,
        index: index + 1,
        startTime,
        endTime,
        duration: Math.max(0, endTime - startTime),
        text,
        normalizedText: normalized,
        wordCount: normalized ? normalized.split(" ").length : 0,
        source: segmentSource(transcriptSource),
        isPublished: true,
      };
    }),
  );

  latestVideo.transcriptStatus = "completed";
  latestVideo.transcriptSource = transcriptSource;
  latestVideo.transcriptLanguage = language || "en";
  latestVideo.transcriptStage = "";
  latestVideo.transcriptProgress = 100;
  latestVideo.transcriptError = "";
  if (latestVideo.publishWhenReady) {
    latestVideo.isPublished = true;
    latestVideo.publishedAt = latestVideo.publishedAt || new Date();
  }
  latestVideo.publishWhenReady = false;
  await latestVideo.save();
  return true;
}

async function processJob(job) {
  const video = await VideoLesson.findById(job.videoId);
  if (!video) return;
  if (video.transcriptSource === "manual") return;

  await updateVideoStage(video._id, "fetching_youtube_subtitle", 15);
  const analyzed = await analyzeYoutubeUrl(video.youtubeUrl);

  if (analyzed.transcripts?.length) {
    await updateVideoStage(video._id, "creating_segments", 85);
    await replaceSegments(
      video,
      analyzed.transcripts,
      analyzed.transcriptSource === "auto" ? "youtube_auto" : "youtube_manual",
      analyzed.transcriptLanguage,
    );
    return;
  }

  if (Number(analyzed.video?.duration || 0) >= 2 * 60 * 60) {
    throw new Error("Video is too long for Azure Fast Transcription (maximum 2 hours).");
  }

  await updateVideoStage(video._id, "downloading_audio", 35);
  const downloaded = await downloadYoutubeAudio(video.youtubeUrl);

  try {
    await updateVideoStage(video._id, "transcribing_audio", 60);
    const transcription = await transcribeAudioFile(downloaded.audioPath, { locale: "en-US" });
    await updateVideoStage(video._id, "creating_segments", 90);
    await replaceSegments(video, transcription.segments, "azure_speech", transcription.language);
  } finally {
    await downloaded.cleanup();
  }
}

async function claimNextJob() {
  const now = new Date();
  const staleBefore = new Date(Date.now() - staleLockMs);
  return YoutubeTranscriptJob.findOneAndUpdate(
    {
      $or: [
        { status: "queued", nextAttemptAt: { $lte: now } },
        { status: "processing", lockedAt: { $lte: staleBefore } },
      ],
    },
    { $set: { status: "processing", lockedAt: now }, $inc: { attempts: 1 } },
    { new: true, sort: { createdAt: 1 } },
  );
}

async function finishJob(job) {
  await YoutubeTranscriptJob.updateOne(
    { _id: job._id, status: "processing" },
    { $set: { status: "completed", completedAt: new Date(), lastError: "" }, $unset: { lockedAt: 1 } },
  );
}

async function failJob(job, error) {
  const message = String(error?.message || "Transcript processing failed").slice(0, 1000);
  const shouldRetry = job.attempts < job.maxAttempts;
  const retryDelayMs = Math.min(60_000, 5_000 * 2 ** Math.max(0, job.attempts - 1));

  await YoutubeTranscriptJob.updateOne(
    { _id: job._id },
    shouldRetry
      ? {
          $set: { status: "queued", nextAttemptAt: new Date(Date.now() + retryDelayMs), lastError: message },
          $unset: { lockedAt: 1 },
        }
      : {
          $set: { status: "failed", completedAt: new Date(), lastError: message },
          $unset: { lockedAt: 1 },
        },
  );

  await VideoLesson.updateOne(
    { _id: job.videoId, transcriptSource: { $ne: "manual" } },
    {
      $set: {
        transcriptStatus: shouldRetry ? "pending" : "failed",
        transcriptStage: shouldRetry ? "queued" : "",
        transcriptError: shouldRetry ? `${message} Retrying automatically...` : message,
      },
    },
  );
}

async function poll() {
  if (workerBusy) return;
  workerBusy = true;

  try {
    const job = await claimNextJob();
    if (!job) return;

    try {
      await processJob(job);
      await finishJob(job);
    } catch (error) {
      console.error(`[YouTube transcript] Job ${job._id} failed:`, error.message);
      await failJob(job, error);
    }
  } catch (error) {
    console.error("[YouTube transcript] Worker poll failed:", error.message);
  } finally {
    workerBusy = false;
  }
}

export function startYoutubeTranscriptWorker() {
  if (pollTimer) return;
  pollTimer = setInterval(poll, pollIntervalMs);
  pollTimer.unref?.();
  void poll();
  console.log("YouTube transcript worker started");
}
