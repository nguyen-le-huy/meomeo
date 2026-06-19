import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import speechSdk from "microsoft-cognitiveservices-speech-sdk";
import { ShadowingAttempt } from "./shadowingAttempt.model.js";
import { TranscriptSegment } from "../transcripts/transcriptSegment.model.js";
import { uploadMedia } from "../media/media.service.js";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

const passingScore = 70;

function normalizeWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
}

function getWordColor(score, errorType) {
  if (errorType && errorType !== "None") return "red";
  if (score >= 85) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

function getFfmpegBinary() {
  return process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegBinary(), args);
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", () => {
      reject(createHttpError(500, "ffmpeg is required to process audio"));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(createHttpError(400, `Could not process uploaded audio: ${stderr.slice(0, 240)}`));
    });
  });
}

async function convertAudioToWavBuffer(file) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "meomeo-shadowing-"));
  const inputPath = path.join(workDir, `input-${randomUUID()}`);
  const outputPath = path.join(workDir, "audio.wav");

  try {
    await fs.writeFile(inputPath, file.buffer);
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-ac",
      "1",
      "-ar",
      "16000",
      "-sample_fmt",
      "s16",
      outputPath,
    ]);

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(workDir, { force: true, recursive: true });
  }
}

function recognizeOnce(recognizer) {
  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(resolve, reject);
  });
}

async function assessWithAzure({ audioBuffer, referenceText }) {
  const speechConfig = speechSdk.SpeechConfig.fromSubscription(config.azureSpeech.key, config.azureSpeech.region);
  speechConfig.speechRecognitionLanguage = "en-US";

  const audioConfig = speechSdk.AudioConfig.fromWavFileInput(audioBuffer);
  const pronunciationConfig = new speechSdk.PronunciationAssessmentConfig(
    referenceText,
    speechSdk.PronunciationAssessmentGradingSystem.HundredMark,
    speechSdk.PronunciationAssessmentGranularity.Word,
    true,
  );
  pronunciationConfig.enableProsodyAssessment = false;

  const recognizer = new speechSdk.SpeechRecognizer(speechConfig, audioConfig);
  pronunciationConfig.applyTo(recognizer);

  try {
    const result = await recognizeOnce(recognizer);
    const rawJson = result.properties.getProperty(speechSdk.PropertyId.SpeechServiceResponse_JsonResult);
    const payload = rawJson ? JSON.parse(rawJson) : {};

    if (result.reason === speechSdk.ResultReason.Canceled) {
      const cancellation = speechSdk.CancellationDetails.fromResult(result);
      throw createHttpError(502, cancellation.errorDetails || "Azure Speech assessment was canceled");
    }

    if (result.reason === speechSdk.ResultReason.NoMatch) {
      throw createHttpError(422, "Không nhận ra giọng nói. Hãy thử ghi âm lại rõ hơn.");
    }

    if (!payload.NBest?.[0]?.PronunciationAssessment) {
      throw createHttpError(502, "Azure Speech did not return pronunciation scores");
    }

    return payload;
  } finally {
    recognizer.close();
  }
}

function getBestAzureResult(azureResult) {
  return azureResult?.NBest?.[0] || {};
}

function mapWordResults(referenceText, azureWords = []) {
  const remainingAzureWords = [...azureWords];
  const referenceWords = String(referenceText || "").split(/\s+/).filter(Boolean);

  return referenceWords.map((displayWord) => {
    const normalizedReference = normalizeWord(displayWord);
    let matchedIndex = remainingAzureWords.findIndex((item) => normalizeWord(item.Word) === normalizedReference);

    if (matchedIndex === -1 && remainingAzureWords.length) {
      matchedIndex = 0;
    }

    const matched = matchedIndex >= 0 ? remainingAzureWords.splice(matchedIndex, 1)[0] : null;
    const assessment = matched?.PronunciationAssessment || {};
    const accuracyScore = Math.round(Number(assessment.AccuracyScore || 0));
    const errorType = assessment.ErrorType || (matched ? "None" : "Omission");

    return {
      word: displayWord,
      accuracyScore,
      errorType,
      color: getWordColor(accuracyScore, errorType),
    };
  });
}

export async function assessShadowing({ sessionId, segmentId, audioFile }) {
  const segment = await TranscriptSegment.findById(segmentId);
  if (!segment || !segment.isPublished) {
    throw createHttpError(404, "Transcript segment not found");
  }

  if (!audioFile?.buffer?.length) {
    throw createHttpError(400, "Audio file is required");
  }

  if (!config.azureSpeech.key || !config.azureSpeech.region) {
    throw createHttpError(501, "Azure Speech is not configured yet");
  }

  const wavBuffer = await convertAudioToWavBuffer(audioFile);
  const azureResult = await assessWithAzure({
    audioBuffer: wavBuffer,
    referenceText: segment.text,
  });
  const bestResult = getBestAzureResult(azureResult);
  const pronunciation = bestResult.PronunciationAssessment || {};
  const pronunciationScore = Math.round(Number(pronunciation.PronScore || 0));
  const accuracyScore = Math.round(Number(pronunciation.AccuracyScore || 0));
  const fluencyScore = Math.round(Number(pronunciation.FluencyScore || 0));
  const completenessScore = Math.round(Number(pronunciation.CompletenessScore || 0));
  const words = mapWordResults(segment.text, bestResult.Words || []);
  const media = await uploadMedia(audioFile);

  const attempt = await ShadowingAttempt.create({
    sessionId,
    videoId: segment.videoId,
    segmentId: segment._id,
    referenceText: segment.text,
    audioUrl: media.secureUrl,
    pronunciationScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    passed: pronunciationScore >= passingScore,
    azureResult,
  });

  return {
    attemptId: attempt._id,
    pronunciationScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    passed: attempt.passed,
    recognizedText: bestResult.Display || "",
    words,
  };
}
