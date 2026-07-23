import { constants as fsConstants } from "node:fs";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function decodeCookiesBase64(value) {
  const normalized = String(value || "").replace(/\s+/g, "");

  if (!normalized || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error("YOUTUBE_COOKIES_BASE64 is not valid Base64.");
  }

  const cookies = Buffer.from(normalized, "base64").toString("utf8");
  if (!cookies.trim()) {
    throw new Error("YOUTUBE_COOKIES_BASE64 decoded to an empty cookies file.");
  }

  if (!/^# (?:Netscape )?HTTP Cookie File/im.test(cookies)) {
    throw new Error(
      "YOUTUBE_COOKIES_BASE64 must contain a Netscape cookies.txt export.",
    );
  }

  return cookies;
}

export async function withYoutubeCookies(options, callback, environment = process.env) {
  const configuredPath = String(environment.YOUTUBE_COOKIES_PATH || "").trim();
  const configuredBase64 = String(environment.YOUTUBE_COOKIES_BASE64 || "").trim();

  if (configuredPath) {
    const cookiesPath = path.resolve(configuredPath);

    try {
      await access(cookiesPath, fsConstants.R_OK);
    } catch {
      throw new Error(`YOUTUBE_COOKIES_PATH is not readable: ${cookiesPath}`);
    }

    return callback({ ...options, cookies: cookiesPath });
  }

  if (!configuredBase64) {
    return callback(options);
  }

  const directory = await mkdtemp(path.join(os.tmpdir(), "meomeo-youtube-cookies-"));
  const cookiesPath = path.join(directory, "cookies.txt");

  try {
    await writeFile(cookiesPath, decodeCookiesBase64(configuredBase64), {
      encoding: "utf8",
      mode: 0o600,
    });
    return await callback({ ...options, cookies: cookiesPath });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
