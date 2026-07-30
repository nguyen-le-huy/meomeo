const TIMESTAMP_PATTERN = /^(\d{1,2}):([0-5]\d):([0-5]\d)[,.](\d{3})$/;

function decodeSubtitleContent(content) {
  if (!Buffer.isBuffer(content)) return String(content || "");
  if (content.length >= 2 && content[0] === 0xff && content[1] === 0xfe) {
    return content.subarray(2).toString("utf16le");
  }
  if (content.length >= 2 && content[0] === 0xfe && content[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(content.subarray(2));
  }

  // Some SAMI exports omit the BOM even though their contents are UTF-16LE.
  const sampleLength = Math.min(content.length, 200);
  let oddNullBytes = 0;
  for (let index = 1; index < sampleLength; index += 2) {
    if (content[index] === 0) oddNullBytes += 1;
  }
  if (sampleLength >= 8 && oddNullBytes >= Math.floor(sampleLength / 4) * 0.6) {
    return content.toString("utf16le");
  }
  return content.toString("utf8");
}

function parseTimestamp(value) {
  const match = String(value).trim().match(TIMESTAMP_PATTERN);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

function normalizeInput(content) {
  return decodeSubtitleContent(content)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/^WEBVTT[^\n]*\n+/i, "")
    .trim();
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);?/gi, (match, entity) => {
    const normalized = entity.toLowerCase();
    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return namedEntities[normalized] ?? match;
  });
}

function cleanSamiText(value) {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getSamiCueText(body) {
  const paragraphPattern = /<p\b[^>]*>([\s\S]*?)(?=<p\b|$)/gi;
  const paragraphs = [...body.matchAll(paragraphPattern)];
  if (!paragraphs.length) return cleanSamiText(body);
  return paragraphs.map((match) => cleanSamiText(match[1])).find(Boolean) || "";
}

function parseSami(content) {
  const syncPattern = /<sync\b[^>]*\bstart\s*=\s*["']?(\d+)/gi;
  const syncPoints = [...content.matchAll(syncPattern)];
  const segments = [];
  const errors = [];
  const warnings = [];

  syncPoints.forEach((syncPoint, index) => {
    const startMilliseconds = Number(syncPoint[1]);
    const bodyStart = syncPoint.index + syncPoint[0].length;
    const bodyEnd = syncPoints[index + 1]?.index ?? content.length;
    const text = getSamiCueText(content.slice(bodyStart, bodyEnd));
    if (!text) return;

    const nextStartMilliseconds = Number(syncPoints[index + 1]?.[1]);
    const endMilliseconds = Number.isFinite(nextStartMilliseconds)
      ? nextStartMilliseconds
      : startMilliseconds + 2000;
    if (!Number.isFinite(startMilliseconds) || endMilliseconds <= startMilliseconds) {
      errors.push({ cue: index + 1, message: "Invalid SAMI timestamp" });
      return;
    }
    if (!Number.isFinite(nextStartMilliseconds)) {
      warnings.push({ cue: index + 1, message: "Final SAMI cue has no end marker; used a 2-second duration" });
    }
    segments.push({
      startTime: startMilliseconds / 1000,
      endTime: endMilliseconds / 1000,
      text,
    });
  });

  if (!syncPoints.length) errors.push({ cue: 0, message: "No SAMI sync points found" });
  if (!segments.length && !errors.length) errors.push({ cue: 0, message: "No valid subtitle cues found" });
  return { segments, errors, warnings };
}

function parseSrtOrVtt(content) {
  const blocks = content.split(/\n{2,}/);
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

export function parseSubtitle(content) {
  const normalized = normalizeInput(content);
  if (/<(?:sami|sync)\b/i.test(normalized)) return parseSami(normalized);
  return parseSrtOrVtt(normalized);
}
