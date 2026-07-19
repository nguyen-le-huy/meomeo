import crypto from "node:crypto";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

const BUNNY_API_BASE_URL = "https://video.bunnycdn.com";
export const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

function assertConfigured(keys = ["libraryId", "apiKey"]) {
  const missing = keys.filter((key) => !config.bunnyStream[key]);
  if (missing.length) {
    throw createHttpError(503, `Bunny Stream is not configured: ${missing.join(", ")}`);
  }
}

async function bunnyRequest(path, options = {}) {
  assertConfigured();
  const response = await fetch(`${BUNNY_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      AccessKey: config.bunnyStream.apiKey,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15000),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!response.ok) {
    throw createHttpError(response.status >= 500 ? 502 : response.status, data?.message || "Bunny Stream request failed");
  }
  return data;
}

export function mapBunnyStatus(status) {
  const value = Number(status);
  if (value === 3) return "ready";
  if ([5, 8].includes(value)) return "failed";
  if (value === 6) return "uploading";
  if (value === 0) return "created";
  return "processing";
}

export function isBunnyPlaybackReady(video) {
  return [3, 4].includes(Number(video?.status)) && Number(video?.encodeProgress) >= 100;
}

export async function isBunnyManifestReady(videoId) {
  if (!config.bunnyStream.pullZoneHost) return false;
  const host = config.bunnyStream.pullZoneHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
  try {
    const response = await fetch(`https://${host}/${videoId}/playlist.m3u8`, {
      method: "HEAD",
      headers: { Referer: "https://iframe.mediadelivery.net/" },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function createBunnyVideo(title) {
  return bunnyRequest(`/library/${config.bunnyStream.libraryId}/videos`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function getBunnyVideo(videoId) {
  return bunnyRequest(`/library/${config.bunnyStream.libraryId}/videos/${videoId}`);
}

export async function deleteBunnyVideo(videoId) {
  return bunnyRequest(`/library/${config.bunnyStream.libraryId}/videos/${videoId}`, { method: "DELETE" });
}

export function createTusUploadCredentials(videoId) {
  assertConfigured();
  const expirationTime = Math.floor(Date.now() / 1000) + config.bunnyStream.uploadExpiresIn;
  const signature = crypto
    .createHash("sha256")
    .update(`${config.bunnyStream.libraryId}${config.bunnyStream.apiKey}${expirationTime}${videoId}`)
    .digest("hex");

  return {
    endpoint: BUNNY_TUS_ENDPOINT,
    videoId,
    libraryId: config.bunnyStream.libraryId,
    expirationTime,
    signature,
  };
}

export function createPlaybackData(videoId) {
  assertConfigured(["libraryId"]);
  const expires = Math.floor(Date.now() / 1000) + config.bunnyStream.playbackExpiresIn;
  const tokenKey = config.bunnyStream.tokenKey;
  const token = tokenKey
    ? crypto.createHash("sha256").update(`${tokenKey}${videoId}${expires}`).digest("hex")
    : "";
  const query = new URLSearchParams({ autoplay: "false", preload: "true" });
  if (token) {
    query.set("token", token);
    query.set("expires", String(expires));
  }

  return {
    embedUrl: `https://iframe.mediadelivery.net/embed/${config.bunnyStream.libraryId}/${videoId}?${query}`,
    expires,
  };
}

export function verifyBunnyWebhook(rawBody, headers) {
  assertConfigured(["readOnlyApiKey"]);
  const signature = headers["x-bunnystream-signature"];
  const version = headers["x-bunnystream-signature-version"];
  const algorithm = headers["x-bunnystream-signature-algorithm"];
  if (version !== "v1" || algorithm !== "hmac-sha256" || typeof signature !== "string") return false;

  const expected = crypto.createHmac("sha256", config.bunnyStream.readOnlyApiKey).update(rawBody).digest("hex");
  if (!/^[0-9a-f]{64}$/.test(signature) || signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function getBunnyLibraryId() {
  return String(config.bunnyStream.libraryId);
}

export function getBunnyThumbnailUrl(videoId, fileName) {
  if (!config.bunnyStream.pullZoneHost || !fileName) return "";
  const host = config.bunnyStream.pullZoneHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}/${videoId}/${fileName}`;
}
