import assert from "node:assert/strict";
import test from "node:test";
import { getYoutubeTranscriptQueueStatuses } from "./youtubeTranscriptJob.service.js";

test("development transcript jobs use statuses that production workers cannot claim", () => {
  assert.deepEqual(getYoutubeTranscriptQueueStatuses("development"), {
    queued: "queued_local",
    processing: "processing_local",
  });
});

test("production transcript jobs keep the existing production statuses", () => {
  assert.deepEqual(getYoutubeTranscriptQueueStatuses("production"), {
    queued: "queued",
    processing: "processing",
  });
});
