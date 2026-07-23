import assert from "node:assert/strict";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { withYoutubeCookies } from "./youtubeCookies.js";

const cookiesText = [
  "# Netscape HTTP Cookie File",
  ".youtube.com\tTRUE\t/\tTRUE\t2147483647\tSID\ttest-value",
  "",
].join("\n");

test("passes options through when YouTube cookies are not configured", async () => {
  const options = { noPlaylist: true };
  const received = await withYoutubeCookies(options, async (value) => value, {});

  assert.deepEqual(received, options);
});

test("uses a configured cookies file", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "meomeo-cookie-test-"));
  const cookiesPath = path.join(directory, "cookies.txt");

  try {
    await writeFile(cookiesPath, cookiesText);
    const received = await withYoutubeCookies(
      { noPlaylist: true },
      async (value) => value,
      { YOUTUBE_COOKIES_PATH: cookiesPath },
    );

    assert.equal(received.cookies, cookiesPath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("materializes Base64 cookies only for the duration of the command", async () => {
  let temporaryPath;

  await withYoutubeCookies(
    {},
    async (options) => {
      temporaryPath = options.cookies;
      await access(temporaryPath);
    },
    { YOUTUBE_COOKIES_BASE64: Buffer.from(cookiesText).toString("base64") },
  );

  await assert.rejects(access(temporaryPath));
});

test("rejects Base64 content that is not a Netscape cookies export", async () => {
  await assert.rejects(
    withYoutubeCookies(
      {},
      async () => undefined,
      { YOUTUBE_COOKIES_BASE64: Buffer.from("not cookies").toString("base64") },
    ),
    /Netscape cookies\.txt/,
  );
});
