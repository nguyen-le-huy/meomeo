const TIME_TOKEN_PATTERN = String.raw`\d{1,2}(?::\d{1,2}){1,2}(?:[\.,]\d+)?|\d+(?:[\.,]\d+)?`;
const DASH_TIME_PATTERN = new RegExp(
  String.raw`^[^\d|]*(${TIME_TOKEN_PATTERN})\s*(?:-->|-|–|—)\s*(${TIME_TOKEN_PATTERN})\s+(.+)$`,
);
const PIPE_TIME_PATTERN = new RegExp(
  String.raw`^[^\d|]*(${TIME_TOKEN_PATTERN})\s*\|\s*(${TIME_TOKEN_PATTERN})\s*\|\s*(.+)$`,
);
const SRT_TIME_PATTERN = new RegExp(
  String.raw`^\s*(${TIME_TOKEN_PATTERN})\s*-->\s*(${TIME_TOKEN_PATTERN})(?:\s+.*)?$`,
);

export function parseTimeToSeconds(value) {
  const raw = String(value || "")
    .trim()
    .replace(",", ".");
  if (!raw) return Number.NaN;

  if (!raw.includes(":")) return Number(raw);

  const parts = raw.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return Number.NaN;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return Number.NaN;
}

function cleanSubtitleText(lines) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSrtBlocks(value, options = {}) {
  const contentLabel = options.contentLabel || "transcript";
  const blocks = String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((block) => block.length);

  if (!blocks.length) return { entries: [], error: "" };

  const entries = [];

  for (const [blockIndex, block] of blocks.entries()) {
    const timeLineIndex = block.findIndex((line) => SRT_TIME_PATTERN.test(line));
    if (timeLineIndex < 0) {
      return {
        entries: [],
        error: `Block phụ đề ${blockIndex + 1} chưa có dòng thời gian hợp lệ.`,
      };
    }

    const match = block[timeLineIndex].match(SRT_TIME_PATTERN);
    const startTime = parseTimeToSeconds(match[1]);
    const endTime = parseTimeToSeconds(match[2]);
    const text = cleanSubtitleText(block.slice(timeLineIndex + 1));

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return { entries: [], error: `Block phụ đề ${blockIndex + 1} có thời gian không hợp lệ.` };
    }

    if (endTime <= startTime) {
      return { entries: [], error: `Block phụ đề ${blockIndex + 1} cần thời gian kết thúc lớn hơn thời gian bắt đầu.` };
    }

    if (!text) {
      return { entries: [], error: `Block phụ đề ${blockIndex + 1} chưa có nội dung ${contentLabel}.` };
    }

    entries.push({ startTime, endTime, text });
  }

  return { entries, error: "" };
}

export function parseTimedTextLines(value, options = {}) {
  const contentLabel = options.contentLabel || "transcript";
  const rawValue = String(value || "");
  if (rawValue.includes("-->") && /(?:^|\n)\s*\d{1,2}(?::\d{1,2}){1,2}[\.,]\d+\s*-->/.test(rawValue)) {
    return parseSrtBlocks(rawValue, options);
  }

  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { entries: [], error: "" };

  const entries = [];

  for (const [lineIndex, line] of lines.entries()) {
    const pipeMatch = line.match(PIPE_TIME_PATTERN);
    const dashMatch = line.match(DASH_TIME_PATTERN);
    const match = pipeMatch || dashMatch;

    if (!match) {
      return {
        entries: [],
        error: `Dòng ${lineIndex + 1} chưa đúng định dạng. Dùng "00:01 - 00:04 Nội dung" hoặc "1 | 4 | Nội dung".`,
      };
    }

    const startTime = parseTimeToSeconds(match[1]);
    const endTime = parseTimeToSeconds(match[2]);
    const text = match[3].trim();

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return { entries: [], error: `Dòng ${lineIndex + 1} có thời gian không hợp lệ.` };
    }

    if (endTime <= startTime) {
      return { entries: [], error: `Dòng ${lineIndex + 1} cần thời gian kết thúc lớn hơn thời gian bắt đầu.` };
    }

    if (!text) {
      return { entries: [], error: `Dòng ${lineIndex + 1} chưa có nội dung ${contentLabel}.` };
    }

    entries.push({ startTime, endTime, text });
  }

  return { entries, error: "" };
}

export function parseManualTranscript(value) {
  const { entries, error } = parseTimedTextLines(value, { contentLabel: "transcript" });
  if (error) return { segments: [], error };
  const segments = entries;

  return { segments, error: "" };
}

export function getTopicId(video) {
  if (!video?.topicId) return "";
  return typeof video.topicId === "string" ? video.topicId : video.topicId._id || "";
}
