import assert from "node:assert/strict";
import test from "node:test";
import { createMovieSchema, reuploadCredentialsSchema, uploadCredentialsSchema } from "./movie.validation.js";

const movieBody = {
  title: "Test movie",
  uploadFileName: "test.mkv",
  uploadFileSize: 1024,
  uploadFileLastModified: 0,
  uploadFileType: "video/x-matroska",
};

test("movie creation accepts MKV files with external subtitles", () => {
  const result = createMovieSchema.safeParse({
    body: { ...movieBody, subtitleSource: "external" },
  });

  assert.equal(result.success, true);
});

test("movie creation accepts embedded subtitle mode only for MKV files", () => {
  const mkvResult = createMovieSchema.safeParse({
    body: { ...movieBody, subtitleSource: "embedded" },
  });
  const mp4Result = createMovieSchema.safeParse({
    body: {
      ...movieBody,
      uploadFileName: "test.mp4",
      uploadFileType: "video/mp4",
      subtitleSource: "embedded",
    },
  });

  assert.equal(mkvResult.success, true);
  assert.equal(mp4Result.success, false);
  assert.equal(
    mp4Result.error.issues.some((issue) => issue.path.at(-1) === "subtitleSource"),
    true,
  );
});

test("resume and re-upload credentials accept Matroska MIME types", () => {
  const result = uploadCredentialsSchema.safeParse({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      fileName: "test.mkv",
      fileSize: 1024,
      fileLastModified: 0,
      fileType: "video/matroska",
    },
  });

  assert.equal(result.success, true);
});

test("re-upload accepts embedded subtitles only for MKV files", () => {
  const params = { id: "507f1f77bcf86cd799439011" };
  const metadata = {
    fileName: "test.mkv",
    fileSize: 1024,
    fileLastModified: 0,
    fileType: "video/x-matroska",
    subtitleSource: "embedded",
  };
  const mkvResult = reuploadCredentialsSchema.safeParse({ params, body: metadata });
  const mp4Result = reuploadCredentialsSchema.safeParse({
    params,
    body: { ...metadata, fileName: "test.mp4", fileType: "video/mp4" },
  });

  assert.equal(mkvResult.success, true);
  assert.equal(mp4Result.success, false);
  assert.equal(
    mp4Result.error.issues.some((issue) => issue.path.at(-1) === "subtitleSource"),
    true,
  );
});
