import { NotebookPen, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "../../../components/ui/spinner.jsx";
import { getMaskedWords } from "../utils/dictationText.js";

export default function TranscriptPanel({
  currentIndex,
  difficulty,
  editingSegmentId,
  isAdmin,
  isCreating,
  isDeleting = false,
  onCreate,
  onDelete,
  onEdit,
  onSelect,
  onUpdate,
  progressPercent,
  segments,
  setEditingSegmentId,
  setShowAddTranscriptForm,
  showAddTranscriptForm,
}) {
  const lastSegment = segments[segments.length - 1];
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteError, setDeleteError] = useState("");
  const allSegmentIds = useMemo(() => segments.map((segment) => segment._id), [segments]);
  const selectedSet = new Set(selectedIds);
  const isAllSelected = allSegmentIds.length > 0 && allSegmentIds.every((id) => selectedSet.has(id));

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => allSegmentIds.includes(id)));
  }, [allSegmentIds]);

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

    setDeleteError("");
    try {
      await onDelete?.(segmentIds);
      setSelectedIds((current) => current.filter((id) => !segmentIds.includes(id)));
    } catch (error) {
      setDeleteError(error?.response?.data?.message || "Không xoá được transcript.");
    }
  }

  return (
    <aside className="hidden min-h-0 flex-col rounded-2xl border border-[#e6dfd8] bg-white p-4 shadow-[0_18px_45px_rgba(20,20,19,0.07)] xl:flex xl:h-full xl:max-h-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="eyebrow">Bản chép</h2>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#e6dfd8] bg-white px-3 text-xs font-black text-coal shadow-sm transition hover:bg-cream-soft"
              onClick={() => setShowAddTranscriptForm((current) => !current)}
              type="button"
            >
              <Plus size={14} /> Thêm card
            </button>
          ) : null}
          {isAdmin ? (
            <button
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#e6dfd8] bg-white px-3 text-xs font-black text-coal shadow-sm transition hover:bg-cream-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedIds.length || isDeleting}
              onClick={() => deleteSegments(selectedIds)}
              type="button"
            >
              {isDeleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
              Xoá {selectedIds.length || ""}
            </button>
          ) : null}
          <span className="rounded-full bg-coal px-3 py-1 text-xs font-semibold text-white">{progressPercent}%</span>
        </div>
      </div>
      {isAdmin ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-coal/65">
            <input
              checked={isAllSelected}
              disabled={!segments.length || isDeleting}
              onChange={toggleAllSelected}
              type="checkbox"
            />
            Chọn tất cả
          </label>
          {deleteError ? <p className="text-xs font-bold text-red-600">{deleteError}</p> : null}
        </div>
      ) : null}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-cream-soft">
        <div className="h-full rounded-full bg-coral" style={{ width: `${progressPercent}%` }} />
      </div>
      {isAdmin && showAddTranscriptForm ? (
        <TranscriptCreateForm
          className="mb-3"
          isSaving={isCreating}
          lastEndTime={lastSegment?.endTime || 0}
          onCancel={() => setShowAddTranscriptForm(false)}
          onSave={onCreate}
        />
      ) : null}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {segments.length ? (
          segments.map((item, index) => (
            <div
              className={[
                "rounded-2xl border p-4 text-sm shadow-sm transition",
                index === currentIndex ? "border-coral bg-coral/5 shadow-[0_10px_24px_rgba(204,120,92,0.10)]" : "border-[#e6dfd8] bg-white hover:bg-cream-soft/60",
              ].join(" ")}
              key={item._id}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <input
                      checked={selectedSet.has(item._id)}
                      disabled={isDeleting}
                      onChange={() => toggleSelected(item._id)}
                      type="checkbox"
                    />
                  ) : null}
                  <button
                    className="rounded-xl border border-[#e6dfd8] bg-cream-soft px-3 py-1 text-sm font-black text-coal"
                    onClick={() => onSelect(index)}
                    type="button"
                  >
                    #{item.index}
                  </button>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2 text-coal/70">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-coal/5"
                      onClick={() => onEdit(item._id)}
                      type="button"
                    >
                      <NotebookPen size={16} />
                    </button>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-coal/5 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isDeleting}
                      onClick={() => deleteSegments([item._id])}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : null}
              </div>
              {editingSegmentId === item._id ? (
                <TranscriptEditForm
                  item={item}
                  onCancel={() => setEditingSegmentId("")}
                  onSave={(data) => onUpdate(item, data)}
                />
              ) : (
                <MaskedTranscriptText difficulty={difficulty} text={item.text} />
              )}
            </div>
          ))
        ) : (
          <div className="space-y-3 rounded-2xl border border-dashed border-[#e6dfd8] bg-cream-soft p-4 text-sm font-bold text-coal/60">
            <p>Chưa có transcript. Admin bấm “Phân tích transcript” để lấy subtitle từ YouTube hoặc thêm thủ công.</p>
            {isAdmin && !showAddTranscriptForm ? (
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-coal px-3 text-sm font-black text-white"
                onClick={() => setShowAddTranscriptForm(true)}
                type="button"
              >
                <Plus size={16} /> Thêm transcript card
              </button>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}

function MaskedTranscriptText({ difficulty, text }) {
  return (
    <p className="text-sm font-black leading-7 text-coal">
      {getMaskedWords(difficulty, text)
        .map((word) => word.value)
        .join(" ")}
    </p>
  );
}

function TranscriptCreateForm({ className = "", isSaving, lastEndTime = 0, onCancel, onSave }) {
  const defaultStartTime = Number(lastEndTime || 0);
  const [form, setForm] = useState({
    text: "",
    startTime: defaultStartTime,
    endTime: defaultStartTime + 3,
    isPublished: true,
  });

  return (
    <form
      className={`${className} space-y-2 rounded-2xl border border-[#e6dfd8] bg-cream-soft p-3 text-sm shadow-sm`}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
    >
      <p className="text-xs font-black uppercase tracking-wide text-coal/65">Thêm transcript card</p>
      <textarea
        className="min-h-20 w-full resize-none rounded-lg border border-[#e6dfd8] bg-white p-2 text-sm font-semibold outline-none"
        onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
        placeholder="Nhập nội dung transcript..."
        required
        value={form.text}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs font-bold text-coal/65">
          Bắt đầu
          <input
            className="h-9 w-full rounded-lg border border-[#e6dfd8] bg-white px-2 text-sm font-bold text-coal outline-none"
            min="0"
            onChange={(event) => setForm((current) => ({ ...current, startTime: Number(event.target.value) }))}
            step="0.1"
            type="number"
            value={form.startTime}
          />
        </label>
        <label className="space-y-1 text-xs font-bold text-coal/65">
          Kết thúc
          <input
            className="h-9 w-full rounded-lg border border-[#e6dfd8] bg-white px-2 text-sm font-bold text-coal outline-none"
            min="0"
            onChange={(event) => setForm((current) => ({ ...current, endTime: Number(event.target.value) }))}
            step="0.1"
            type="number"
            value={form.endTime}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold text-coal/70">
        <input
          checked={form.isPublished}
          onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
          type="checkbox"
        />
        Hiển thị cho người học
      </label>
      <div className="flex gap-2">
        <button
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-coal text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? <Spinner size="sm" /> : <Save size={15} />}
          {isSaving ? "Đang lưu..." : "Lưu card"}
        </button>
        <button className="h-10 rounded-lg border border-[#e6dfd8] bg-white px-3 text-sm font-black text-coal" onClick={onCancel} type="button">
          Hủy
        </button>
      </div>
    </form>
  );
}

function TranscriptEditForm({ item, onCancel, onSave }) {
  const [form, setForm] = useState({
    text: item.text,
    startTime: item.startTime,
    endTime: item.endTime,
    isPublished: item.isPublished,
  });

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
    >
      <textarea
        className="min-h-20 w-full rounded-md border border-coal/15 p-2 text-sm outline-none"
        onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
        value={form.text}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-9 rounded-md border border-coal/15 px-2 text-sm outline-none"
          onChange={(event) => setForm((current) => ({ ...current, startTime: Number(event.target.value) }))}
          step="0.1"
          type="number"
          value={form.startTime}
        />
        <input
          className="h-9 rounded-md border border-coal/15 px-2 text-sm outline-none"
          onChange={(event) => setForm((current) => ({ ...current, endTime: Number(event.target.value) }))}
          step="0.1"
          type="number"
          value={form.endTime}
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          checked={form.isPublished}
          onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
          type="checkbox"
        />
        Published
      </label>
      <div className="flex gap-2">
        <button className="rounded-md bg-black px-2 py-1 text-xs font-bold text-white" type="submit">
          <Save size={13} /> Save
        </button>
        <button className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}
