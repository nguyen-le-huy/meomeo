import { useMemo, useState } from "react";
import { Check, Clipboard, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import {
  createTranscriptSegment,
  deleteTranscriptSegments,
  updateTranscriptSegment,
} from "../../videos/services/videoApi.js";
import { parseManualTranscript } from "../../videos/utils/manualTranscript.js";

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
  const totalSeconds = Math.max(0, safeSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const millis = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  const base =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return millis > 0 ? `${base}.${String(millis).padStart(3, "0").replace(/0+$/, "")}` : base;
}

function formatSegmentLine(segment, language) {
  const text = language === "vi" ? segment.translationText : segment.text;
  if (!String(text || "").trim()) return "";
  return `${formatTime(segment.startTime)} - ${formatTime(segment.endTime)} ${String(text).trim()}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function TranscriptImportTools({ onDone, segments, videoId }) {
  const [copyLanguage, setCopyLanguage] = useState("en");
  const [copyStatus, setCopyStatus] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const copiedText = useMemo(
    () =>
      segments
        .map((segment) => formatSegmentLine(segment, copyLanguage))
        .filter(Boolean)
        .join("\n"),
    [copyLanguage, segments],
  );

  const parsed = parseManualTranscript(text);

  async function handleCopy() {
    setCopyStatus("");
    if (!copiedText.trim()) {
      setCopyStatus(copyLanguage === "vi" ? "Chưa có Vietsub để copy." : "Chưa có transcript để copy.");
      return;
    }

    try {
      await copyToClipboard(copiedText);
      setCopyStatus(copyLanguage === "vi" ? "Đã copy transcript Việt." : "Đã copy transcript Anh.");
      window.setTimeout(() => setCopyStatus(""), 2500);
    } catch {
      setCopyStatus("Không copy được. Trình duyệt đang chặn clipboard.");
    }
  }

  async function handleImport() {
    setError("");
    const { segments: entries, error: parseError } = parseManualTranscript(text);
    if (parseError) {
      setError(parseError);
      return;
    }

    if (!entries.length) {
      setError("Chưa có dữ liệu transcript.");
      return;
    }

    const ok = window.confirm(
      "Import lại transcript sẽ thay nội dung/timing tiếng Anh theo dữ liệu mới. Vietsub hiện có được giữ theo thứ tự dòng nếu segment vẫn còn.",
    );
    if (!ok) return;

    setSaving(true);
    try {
      const existingCount = segments.length;
      const updateCount = Math.min(existingCount, entries.length);

      for (let index = 0; index < updateCount; index += 1) {
        const entry = entries[index];
        await updateTranscriptSegment(segments[index]._id, {
          startTime: entry.startTime,
          endTime: entry.endTime,
          text: entry.text,
        });
      }

      if (entries.length > existingCount) {
        for (const entry of entries.slice(existingCount)) {
          await createTranscriptSegment({
            videoId,
            startTime: entry.startTime,
            endTime: entry.endTime,
            text: entry.text,
            isPublished: true,
          });
        }
      }

      if (entries.length < existingCount) {
        await deleteTranscriptSegments(segments.slice(entries.length).map((segment) => segment._id));
      }

      setText("");
      setIsOpen(false);
      onDone?.();
    } catch (importError) {
      setError(importError?.response?.data?.message || "Không import lại transcript được.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-[#e6dfd8] pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select onValueChange={setCopyLanguage} value={copyLanguage}>
          <SelectTrigger className="h-8 w-36 rounded-md px-3 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">Transcript Anh</SelectItem>
            <SelectItem value="vi">Transcript Việt</SelectItem>
          </SelectContent>
        </Select>

        <Button disabled={!segments.length} onClick={handleCopy} size="sm" type="button" variant="outline">
          <Clipboard className="h-3.5 w-3.5" />
          Copy
        </Button>

        {copyStatus ? (
          <span className="text-xs font-semibold text-ink-muted">
            {copyStatus.startsWith("Đã") ? <Check className="mr-1 inline h-3.5 w-3.5 text-green-700" /> : null}
            {copyStatus}
          </span>
        ) : null}
      </div>

      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger asChild>
          <Button disabled={!videoId} size="sm" type="button" variant="outline">
            <Upload className="h-3.5 w-3.5" />
            Import lại transcript
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import lại transcript</DialogTitle>
            <DialogDescription>
              Dán nguyên file SRT tiếng Anh hoặc transcript theo từng dòng. Hệ thống sẽ cập nhật lại nội dung và thời gian theo thứ tự dòng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-ink-muted">
              Hỗ trợ SRT chuẩn hoặc mỗi dòng: <code className="rounded bg-cream px-1">00:01 - 00:04 Nội dung tiếng Anh</code>
            </p>
            <Textarea
              className="min-h-60 font-mono text-sm"
              onChange={(event) => {
                setText(event.target.value);
                setError("");
              }}
              placeholder={`1\n00:00:01,000 --> 00:00:04,000\nTell me something I need to know\n\n2\n00:00:04,000 --> 00:00:07,000\nThen take my breath and never let it go`}
              value={text}
            />
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
              <span>{parsed.segments.length || 0} segment</span>
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
            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
            <Button disabled={saving || !text.trim()} onClick={handleImport} type="button">
              {saving ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
              {saving ? "Đang import..." : "Import transcript"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
