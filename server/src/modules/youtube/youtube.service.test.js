import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTranscriptSegments,
  pickPreferredSubtitleTrack,
  requiresAudioWordAlignment,
} from "./youtube.service.js";

function segment(startTime, endTime, text) {
  const words = text.split(/\s+/).map((word, index, allWords) => {
    const tokenDuration = (endTime - startTime) / allWords.length;
    return {
      text: word,
      startTime: startTime + tokenDuration * index,
      endTime: startTime + tokenDuration * (index + 1),
    };
  });

  return { startTime, endTime, text, words };
}

test("youtube auto segmentation merges adjacent timed cues into natural phrases", () => {
  const segments = normalizeTranscriptSegments(
    [
      segment(0, 2, "Vietnam is the cheapest country in all"),
      segment(2.05, 5, "of Southeast Asia from food to"),
      segment(5.05, 7, "transportation to just about everything"),
      segment(7.05, 10, "your money goes very far here to measure"),
    ],
    { profile: "youtube_auto" },
  );

  assert.equal(segments.length, 2);
  assert.equal(
    segments[0].text,
    "Vietnam is the cheapest country in all of Southeast Asia from food to transportation to just about everything",
  );
  assert.equal(segments[0].startTime, 0);
  assert.equal(segments[0].endTime, 7);
  assert.equal(segments[1].startTime, 7.05);
});

test("manual segmentation can preserve subtitle cue boundaries", () => {
  const segments = normalizeTranscriptSegments(
    [
      segment(0, 2, "Vietnam is the cheapest country in all"),
      segment(2.05, 5, "of Southeast Asia from food to"),
    ],
    { preserveCueBoundaries: true },
  );

  assert.equal(segments.length, 2);
  assert.equal(segments[0].text, "Vietnam is the cheapest country in all");
  assert.equal(segments[1].text, "of Southeast Asia from food to");
});

test("audio alignment check handles long untimed subtitle cues", () => {
  assert.equal(
    requiresAudioWordAlignment([
      {
        startTime: 0,
        endTime: 12,
        text: "This is a long automatic subtitle cue that does not include reliable word level timing data",
        words: [],
      },
    ]),
    true,
  );
});

test("subtitle selection prefers a manual English track over automatic captions", () => {
  const track = pickPreferredSubtitleTrack({
    subtitles: {
      en: [{ ext: "json3", url: "https://example.com/manual" }],
    },
    automatic_captions: {
      en: [{ ext: "json3", url: "https://example.com/auto" }],
    },
  });

  assert.equal(track.source, "manual");
  assert.equal(track.language, "en");
  assert.equal(track.ext, "json3");
  assert.equal(track.url, "https://example.com/manual");
});

test("subtitle selection accepts regional and generated English language keys", () => {
  const track = pickPreferredSubtitleTrack({
    subtitles: {},
    automatic_captions: {
      "en-orig": [{ ext: "vtt", url: "https://example.com/auto-en-orig" }],
    },
  });

  assert.equal(track.source, "auto");
  assert.equal(track.language, "en-orig");
});
