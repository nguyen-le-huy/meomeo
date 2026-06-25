import { useState } from "react";
import { Button } from "../../../components/ui/button.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";
import { updateTranscriptSegment } from "../../videos/services/videoApi.js";

function parseTimeToSeconds(value) {
  const raw = String(value || "").trim().replace(",", ".");
  if (!raw) return Number.NaN;
  if (!raw.includes(":")) return Number(raw);
  const parts = raw.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return Number.NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number.NaN;
}

function parseManualVietsub(value) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { entries: [], error: "" };

  const entries = [];

  for (const [lineIndex, line] of lines.entries()) {
    const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
    const dashMatch = line.match(/^(\S+)\s*(?:-->|-|–|—)\s*(\S+)\s+(.+)$/);
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

    if (!text) {
      return { entries: [], error: `Dòng ${lineIndex + 1} chưa có nội dung.` };
    }

    entries.push({ startTime, endTime, text });
  }

  return { entries, error: "" };
}

function matchSegment(entry, segments) {
  return segments.find(
    (s) =>
      Math.abs(s.startTime - entry.startTime) < 2 &&
      Math.abs(s.endTime - entry.endTime) < 3,
  );
}

export default function ManualVietsubDialog({ segments, onDone }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");

    const { entries, error: parseError } = parseManualVietsub(text);
    if (parseError) {
      setError(parseError);
      return;
    }

    if (!entries.length) {
      setError("Chưa có dữ liệu phụ đề.");
      return;
    }

    setSaving(true);
    let matched = 0;
    let unmatched = 0;

    for (const entry of entries) {
      const segment = matchSegment(entry, segments);
      if (segment) {
        try {
          await updateTranscriptSegment(segment._id, {
            translationText: entry.text,
          });
          matched++;
        } catch {
          unmatched++;
        }
      } else {
        unmatched++;
      }
    }

    setSaving(false);
    setText("");
    setIsOpen(false);
    onDone?.(matched, unmatched);
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          Thêm Vietsub thủ công
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm Vietsub thủ công</DialogTitle>
          <DialogDescription>
            Dán phụ đề tiếng Việt theo từng dòng với thời gian. Hệ thống sẽ tự ghép với transcript tiếng Anh theo timestamp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-ink-muted">
              Định dạng mỗi dòng: <code className="rounded bg-cream px-1">00:01 - 00:04 Nội dung tiếng Việt</code>
            </p>
          </div>
          <Textarea
            className="min-h-60 font-mono text-sm"
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            placeholder={`00:20 - 00:25 Anh là ánh sáng, cũng là màn đêm\n00:25 - 00:30 Anh là sắc màu chảy trong huyết quản em`}
            value={text}
          />
          <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
            <span>{parseManualVietsub(text).entries.length} dòng</span>
            <Button
              onClick={() => {
                setText("");
                setError("");
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Xóa
            </Button>
          </div>
          {error ? (
            <p className="text-sm font-bold text-red-600">{error}</p>
          ) : null}
          <Button disabled={saving || !text.trim()} onClick={handleSave} type="button">
            {saving ? "Đang lưu..." : "Lưu Vietsub"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
