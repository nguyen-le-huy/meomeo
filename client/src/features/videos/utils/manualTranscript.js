export function parseTimeToSeconds(value) {
  const raw = String(value || "").trim().replace(",", ".");
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

export function parseManualTranscript(value) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { segments: [], error: "" };

  const segments = [];

  for (const [lineIndex, line] of lines.entries()) {
    const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
    const dashMatch = line.match(/^(\S+)\s*(?:-->|-|–|—)\s*(\S+)\s+(.+)$/);
    const match = pipeMatch || dashMatch;

    if (!match) {
      return {
        segments: [],
        error: `Dòng ${lineIndex + 1} chưa đúng định dạng. Dùng "00:01 - 00:04 Nội dung" hoặc "1 | 4 | Nội dung".`,
      };
    }

    const startTime = parseTimeToSeconds(match[1]);
    const endTime = parseTimeToSeconds(match[2]);
    const text = match[3].trim();

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return { segments: [], error: `Dòng ${lineIndex + 1} có thời gian không hợp lệ.` };
    }

    if (endTime <= startTime) {
      return { segments: [], error: `Dòng ${lineIndex + 1} cần thời gian kết thúc lớn hơn thời gian bắt đầu.` };
    }

    if (!text) {
      return { segments: [], error: `Dòng ${lineIndex + 1} chưa có nội dung transcript.` };
    }

    segments.push({ startTime, endTime, text });
  }

  return { segments, error: "" };
}

export function getTopicId(video) {
  if (!video?.topicId) return "";
  return typeof video.topicId === "string" ? video.topicId : video.topicId._id || "";
}
