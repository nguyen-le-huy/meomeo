import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";
import { bulkUpdateTranscriptTranslations } from "../../videos/services/videoApi.js";
import { parseTimedTextLines } from "../../videos/utils/manualTranscript.js";

const START_TOLERANCE_SECONDS = 2.5;
const END_TOLERANCE_SECONDS = 4;
const MIN_OVERLAP_RATIO = 0.35;

function parseManualVietsub(value) {
  const timedResult = parseTimedTextLines(value, { contentLabel: "Vietsub" });
  if (!timedResult.error) return { ...timedResult, mode: "timed" };

  const rawValue = String(value || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
  const looksTimed =
    rawValue.includes("-->") ||
    /(?:^|\n)\s*\d{1,2}(?::\d{1,2}){1,2}(?:[.,]\d+)?\s*(?:-|–|—|\|)/.test(rawValue);
  if (looksTimed) return { ...timedResult, mode: "timed" };

  const entries = rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      text: line.replace(/^(?:\d+[.)]|[-*•])\s+/, "").trim(),
    }))
    .filter(({ text }) => text);

  return { entries, error: "", mode: "ordered" };
}

function getOverlapScore(entry, segment) {
  const overlap = Math.min(entry.endTime, segment.endTime) - Math.max(entry.startTime, segment.startTime);
  if (overlap <= 0) return 0;

  const entryDuration = Math.max(entry.endTime - entry.startTime, 0.001);
  const segmentDuration = Math.max(segment.endTime - segment.startTime, 0.001);
  return overlap / Math.max(entryDuration, segmentDuration);
}

function matchSegment(entry, segments, usedSegmentIds, entryIndex, entryCount) {
  const availableSegments = segments.filter((segment) => !usedSegmentIds.has(segment._id));

  if (!Number.isFinite(entry.startTime) || !Number.isFinite(entry.endTime)) {
    const indexedSegment = segments[entryIndex];
    return indexedSegment && !usedSegmentIds.has(indexedSegment._id) ? indexedSegment : null;
  }

  const exactMatch = availableSegments
    .map((segment) => ({
      distance:
        Math.abs(Number(segment.startTime) - entry.startTime) +
        Math.abs(Number(segment.endTime) - entry.endTime),
      segment,
    }))
    .filter(
      ({ segment }) =>
        Math.abs(Number(segment.startTime) - entry.startTime) <= START_TOLERANCE_SECONDS &&
        Math.abs(Number(segment.endTime) - entry.endTime) <= END_TOLERANCE_SECONDS,
    )
    .sort((a, b) => a.distance - b.distance)[0]?.segment;
  if (exactMatch) return exactMatch;

  const overlapMatch = availableSegments
    .map((segment) => ({ segment, score: getOverlapScore(entry, segment) }))
    .filter((item) => item.score >= MIN_OVERLAP_RATIO)
    .sort((a, b) => b.score - a.score)[0]?.segment;
  if (overlapMatch) return overlapMatch;

  if (entryCount === segments.length) {
    const indexedSegment = segments[entryIndex];
    if (indexedSegment && !usedSegmentIds.has(indexedSegment._id)) return indexedSegment;
  }

  return null;
}

function buildUpdatePlan(entries, segments) {
  const usedSegmentIds = new Set();
  const updates = [];

  entries.forEach((entry, entryIndex) => {
    const segment = matchSegment(entry, segments, usedSegmentIds, entryIndex, entries.length);
    if (!segment) return;
    usedSegmentIds.add(segment._id);
    updates.push({ segmentId: segment._id, translationText: entry.text });
  });

  return { updates, unmatched: entries.length - updates.length };
}

export default function ManualVietsubDialog({ segments, onDone }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const deferredText = useDeferredValue(text);
  const parsed = useMemo(() => parseManualVietsub(deferredText), [deferredText]);
  const preview = useMemo(
    () => buildUpdatePlan(parsed.entries, segments),
    [parsed.entries, segments],
  );

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

    const { updates, unmatched } = buildUpdatePlan(entries, segments);
    if (!updates.length) {
      setError("Không tìm thấy transcript tiếng Anh phù hợp để ghép Vietsub.");
      return;
    }

    setSaving(true);
    try {
      await bulkUpdateTranscriptTranslations(updates);
      setText("");
      setIsOpen(false);
      onDone?.(updates.length, unmatched);
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Không lưu được Vietsub. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setText(await file.text());
      setError("");
    } catch {
      setError("Không đọc được file phụ đề.");
    }
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
            Dán SRT để tự ghép theo thời gian, hoặc dán riêng bản dịch — mỗi dòng ứng với một câu tiếng Anh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-muted">
                SRT, <code className="rounded bg-cream px-1">00:01 - 00:04 Nội dung</code>, hoặc chỉ nội dung từng dòng.
              </p>
              <input
                accept=".srt,.vtt,.txt,text/plain,application/x-subrip"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
              <Button onClick={() => fileInputRef.current?.click()} size="sm" type="button" variant="outline">
                <Upload className="h-3.5 w-3.5" />
                Chọn file
              </Button>
            </div>
          </div>
          <Textarea
            autoFocus
            className="min-h-60 font-mono text-sm"
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                if (!saving && text.trim()) handleSave();
              }
            }}
            placeholder={`1\n00:00:20,000 --> 00:00:25,000\nAnh là ánh sáng, cũng là màn đêm\n\n2\n00:00:25,000 --> 00:00:30,000\nAnh là sắc màu chảy trong huyết quản em`}
            value={text}
          />
          <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
            <span>
              {parsed.entries.length} dòng
              {parsed.entries.length && !parsed.error ? (
                <> · <span className="text-green-700">{preview.updates.length} khớp</span>{preview.unmatched ? ` · ${preview.unmatched} chưa khớp` : ""}</>
              ) : null}
            </span>
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
            {saving ? <Spinner size="sm" /> : null}
            {saving ? "Đang lưu..." : `Lưu Vietsub${preview.updates.length ? ` (${preview.updates.length})` : ""}`}
          </Button>
          <p className="text-[11px] text-ink-muted">Mẹo: nhấn Ctrl/⌘ + Enter để lưu ngay.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
