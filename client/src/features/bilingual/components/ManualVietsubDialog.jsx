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
import { parseTimedTextLines } from "../../videos/utils/manualTranscript.js";

const START_TOLERANCE_SECONDS = 2.5;
const END_TOLERANCE_SECONDS = 4;
const MIN_OVERLAP_RATIO = 0.35;

function parseManualVietsub(value) {
  return parseTimedTextLines(value, { contentLabel: "Vietsub" });
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

  const exactMatch = availableSegments.find(
    (segment) =>
      Math.abs(Number(segment.startTime) - entry.startTime) <= START_TOLERANCE_SECONDS &&
      Math.abs(Number(segment.endTime) - entry.endTime) <= END_TOLERANCE_SECONDS,
  );
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
    const usedSegmentIds = new Set();

    for (const [entryIndex, entry] of entries.entries()) {
      const segment = matchSegment(entry, segments, usedSegmentIds, entryIndex, entries.length);
      if (segment) {
        try {
          await updateTranscriptSegment(segment._id, {
            translationText: entry.text,
          });
          usedSegmentIds.add(segment._id);
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
