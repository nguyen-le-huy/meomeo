const TIMESTAMP_PATTERN = /^(\d{1,2}):([0-5]\d):([0-5]\d)[,.](\d{3})$/;

function parseTimestamp(value) {
  const match = String(value).trim().match(TIMESTAMP_PATTERN);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

function normalizeInput(content) {
  return String(content || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/^WEBVTT[^\n]*\n+/i, "")
    .trim();
}

export function parseSubtitle(content) {
  const blocks = normalizeInput(content).split(/\n{2,}/);
  const segments = [];
  const errors = [];
  const warnings = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block.split("\n").map((line) => line.trim());
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) {
      if (lines.some(Boolean)) warnings.push({ cue: blockIndex + 1, message: "Cue has no timestamp and was skipped" });
      return;
    }

    const [rawStart, rawEndWithSettings] = lines[timingIndex].split("-->").map((value) => value.trim());
    const rawEnd = rawEndWithSettings?.split(/\s+/)[0];
    const startTime = parseTimestamp(rawStart);
    const endTime = parseTimestamp(rawEnd);
    const text = lines.slice(timingIndex + 1).join("\n").trim();

    if (startTime === null || endTime === null) {
      errors.push({ cue: blockIndex + 1, message: "Invalid timestamp" });
      return;
    }
    if (endTime <= startTime) {
      errors.push({ cue: blockIndex + 1, message: "End time must be greater than start time" });
      return;
    }
    if (!text) {
      errors.push({ cue: blockIndex + 1, message: "Subtitle text is empty" });
      return;
    }

    const previous = segments.at(-1);
    if (previous && startTime < previous.endTime) {
      warnings.push({ cue: blockIndex + 1, message: "Subtitle overlaps the previous cue" });
    }
    segments.push({ startTime, endTime, text });
  });

  if (!segments.length && !errors.length) errors.push({ cue: 0, message: "No valid subtitle cues found" });
  return { segments, errors, warnings };
}
