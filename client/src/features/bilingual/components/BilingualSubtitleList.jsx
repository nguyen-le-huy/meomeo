import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import { cn } from "../../../utils/cn.js";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BilingualSubtitleList({
  activeIndex,
  canEdit = false,
  onDeleteSegments,
  onSeek,
  onUpdateSegment,
  segments,
}) {
  const activeRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ text: "", translationText: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSegmentIds = useMemo(() => segments.map((segment) => segment._id), [segments]);
  const selectedSet = new Set(selectedIds);
  const isAllSelected = allSegmentIds.length > 0 && allSegmentIds.every((id) => selectedSet.has(id));

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => allSegmentIds.includes(id)));
  }, [allSegmentIds]);

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

  function toggleSelected(segmentId) {
    setSelectedIds((current) =>
      current.includes(segmentId) ? current.filter((id) => id !== segmentId) : [...current, segmentId],
    );
  }

  function toggleAllSelected() {
    setSelectedIds(isAllSelected ? [] : allSegmentIds);
  }

  async function deleteSegments(segmentIds) {
    if (!segmentIds.length || isDeleting) return;
    const ok = window.confirm(
      segmentIds.length === 1
        ? "Xoá transcript này? Các transcript khác sẽ được giữ nguyên."
        : `Xoá ${segmentIds.length} transcript đã chọn? Các transcript khác sẽ được giữ nguyên.`,
    );
    if (!ok) return;

    setIsDeleting(true);
    setError("");
    try {
      await onDeleteSegments?.(segmentIds);
      setSelectedIds((current) => current.filter((id) => !segmentIds.includes(id)));
      if (segmentIds.includes(editingId)) setEditingId(null);
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Không xoá được transcript.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="py-2">
      {canEdit ? (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e6dfd8] bg-canvas px-5 py-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <input
              checked={isAllSelected}
              disabled={!segments.length || isDeleting}
              onChange={toggleAllSelected}
              type="checkbox"
            />
            Chọn tất cả
          </label>
          <Button
            disabled={!selectedIds.length || isDeleting}
            onClick={() => deleteSegments(selectedIds)}
            size="sm"
            type="button"
            variant="outline"
          >
            {isDeleting ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
            Xoá {selectedIds.length || ""}
          </Button>
        </div>
      ) : null}
      {error && !editingId ? <p className="px-5 py-2 text-xs font-semibold text-red-600">{error}</p> : null}
      {segments.map((segment, index) => {
        const isActive = index === activeIndex;
        const isEditing = editingId === segment._id;
        const isSelected = selectedSet.has(segment._id);

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
                <div className="flex items-center gap-2">
                  <input
                    checked={isSelected}
                    disabled={isDeleting}
                    onChange={() => toggleSelected(segment._id)}
                    type="checkbox"
                  />
                  <p className="text-xs font-semibold text-ink-muted">Sửa phụ đề</p>
                </div>
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
                    <Spinner size="sm" />
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
              "group relative mx-2 flex w-[calc(100%-1rem)] items-start rounded-lg transition-colors hover:bg-cream-soft",
              isActive && "bg-[#f5e9e2]",
            )}
          >
            {isActive ? <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-coral" /> : null}
            {canEdit ? (
              <label className="flex self-stretch px-3 py-3">
                <input
                  checked={isSelected}
                  disabled={isDeleting}
                  onChange={() => toggleSelected(segment._id)}
                  type="checkbox"
                />
              </label>
            ) : null}
            <button
              className={cn("flex min-w-0 flex-1 gap-3 py-3.5 text-left", canEdit ? "pr-3" : "px-4")}
              onClick={() => onSeek(segment.startTime)}
              type="button"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={cn(
                    "text-sm font-medium leading-snug text-coal",
                    isActive && "text-[#9f4f37]",
                  )}
                >
                  {segment.text}
                </p>
                {segment.translationText ? (
                  <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                    {segment.translationText}
                  </p>
                ) : null}
              </div>
              <span className={cn(
                "shrink-0 self-start rounded-md bg-cream-soft px-2 py-1 text-[11px] font-semibold tabular-nums text-ink-muted",
                isActive && "bg-canvas text-coral",
              )}>
                {formatTime(segment.startTime)}
              </span>
            </button>

            {canEdit ? (
              <div className="mr-3 mt-2 flex shrink-0 items-center gap-1 opacity-70 group-hover:opacity-100">
                <Button
                  aria-label="Sửa phụ đề"
                  onClick={() => startEditing(segment)}
                  size="icon"
                  title="Sửa phụ đề"
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  aria-label="Xoá phụ đề"
                  disabled={isDeleting}
                  onClick={() => deleteSegments([segment._id])}
                  size="icon"
                  title="Xoá phụ đề"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
