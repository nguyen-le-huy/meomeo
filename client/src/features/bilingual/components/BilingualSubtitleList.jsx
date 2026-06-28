import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { cn } from "../../../utils/cn.js";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BilingualSubtitleList({ activeIndex, canEdit = false, onSeek, onUpdateSegment, segments }) {
  const activeRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ text: "", translationText: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  function startEditing(segment) {
    setEditingId(segment._id);
    setDraft({
      text: segment.text || "",
      translationText: segment.translationText || "",
    });
    setError("");
  }

  function cancelEditing() {
    if (isSaving) return;
    setEditingId(null);
    setError("");
  }

  async function saveSegment(segmentId) {
    const text = draft.text.trim();
    const translationText = draft.translationText.trim();

    if (!text) {
      setError("Phụ đề tiếng Anh không được để trống.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onUpdateSegment?.(segmentId, { text, translationText });
      setEditingId(null);
    } catch (saveError) {
      setError(saveError?.response?.data?.message || "Không lưu được phụ đề.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="divide-y divide-[#e6dfd8]">
      {segments.map((segment, index) => {
        const isActive = index === activeIndex;
        const isEditing = editingId === segment._id;

        if (isEditing) {
          return (
            <div
              className={cn(
                "space-y-3 bg-cream-soft px-5 py-4 ring-1 ring-inset ring-coral",
                isActive && "bg-cream-soft",
              )}
              key={segment._id}
              ref={isActive ? activeRef : null}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-ink-muted">Sửa phụ đề</p>
                <span className="text-xs font-medium text-ink-muted">{formatTime(segment.startTime)}</span>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-coal">Tiếng Anh</span>
                <Textarea
                  autoFocus
                  className="min-h-16 resize-y bg-canvas"
                  disabled={isSaving}
                  onChange={(event) => setDraft((value) => ({ ...value, text: event.target.value }))}
                  rows={2}
                  value={draft.text}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-coal">Tiếng Việt</span>
                <Textarea
                  className="min-h-16 resize-y bg-canvas"
                  disabled={isSaving}
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, translationText: event.target.value }))
                  }
                  placeholder="Nhập bản dịch tiếng Việt"
                  rows={2}
                  value={draft.translationText}
                />
              </label>

              {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <Button disabled={isSaving} onClick={cancelEditing} size="sm" type="button" variant="ghost">
                  <X className="h-3.5 w-3.5" /> Hủy
                </Button>
                <Button disabled={isSaving} onClick={() => saveSegment(segment._id)} size="sm" type="button">
                  {isSaving ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {isSaving ? "Đang lưu" : "Lưu"}
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={segment._id}
            ref={isActive ? activeRef : null}
            className={cn(
              "group flex w-full items-start transition hover:bg-cream-soft",
              isActive && "bg-cream-soft ring-1 ring-inset ring-coral",
            )}
          >
            <button
              className="flex min-w-0 flex-1 gap-3 px-5 py-3 text-left"
              onClick={() => onSeek(segment.startTime)}
              type="button"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={cn(
                    "text-sm leading-relaxed text-coal",
                    isActive && "font-medium",
                  )}
                >
                  {segment.text}
                </p>
                {segment.translationText ? (
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {segment.translationText}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 self-start pt-0.5 text-xs font-medium text-ink-muted">
                {formatTime(segment.startTime)}
              </span>
            </button>

            {canEdit ? (
              <Button
                aria-label="Sửa phụ đề"
                className="mr-3 mt-2 shrink-0 opacity-70 group-hover:opacity-100"
                onClick={() => startEditing(segment)}
                size="icon"
                title="Sửa phụ đề"
                type="button"
                variant="ghost"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
