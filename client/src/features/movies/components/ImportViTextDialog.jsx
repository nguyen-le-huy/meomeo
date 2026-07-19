import { BookOpen, ChevronDown, ChevronUp, Copy, Download, Languages, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Build a template with EN lines as comments, empty lines for translation */
function buildTemplate(segments) {
  if (!segments?.length) return "";
  return segments
    .map((seg) => `# ${seg.index}. ${seg.text}\n`)
    .join("\n");
}

/** Count non-comment, non-empty lines (actual translation slots with content) */
function countTranslationLines(text) {
  return text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return t && !t.startsWith("#");
    }).length;
}

const GUIDE = `# === HƯỚNG DẪN FORMAT ===
#
# Mỗi dòng = 1 câu dịch tiếng Việt, theo đúng thứ tự câu EN.
# Dòng bắt đầu bằng "#" là comment → KHÔNG tính là 1 câu.
# Dòng TRẮNG → câu đó bỏ qua (không cập nhật bản dịch cũ).
#
# Ví dụ:
# 1. Once upon a time in a land called Kumandra...
Ngày xửa ngày xưa, ở vùng đất tên là Kumandra...
# 2. There was a dragon.
Có một con rồng.
# 3. (để trống → không dịch câu này)

# 4. The end.
Kết thúc.`;

export default function ImportViTextDialog({ movie, segments, mutation, onClose }) {
  const [content, setContent] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef(null);

  // Focus textarea on open
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const lineCount = countTranslationLines(content);
  const segmentCount = segments?.length || 0;

  function loadTemplate() {
    const tpl = buildTemplate(segments);
    setContent(tpl);
    setPreview(null);
    setConfirmed(false);
    setError("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function copyGuide() {
    navigator.clipboard.writeText(GUIDE).catch(() => {});
  }

  async function handlePreview() {
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung bản dịch.");
      return;
    }
    setBusy(true);
    setError("");
    setPreview(null);
    setConfirmed(false);
    try {
      const response = await mutation.mutateAsync({ id: movie._id, content, dryRun: true });
      setPreview(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xem trước bản dịch.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const response = await mutation.mutateAsync({ id: movie._id, content, dryRun: false });
      const result = response.data.data;
      setPreview(null);
      setConfirmed(true);
      setContent("");
      setTimeout(() => onClose(result), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Lưu bản dịch thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#171717] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Languages size={18} className="text-[#e06f50]" />
            <div>
              <h2 className="text-sm font-semibold text-white">Import VI — Văn bản thuần</h2>
              <p className="text-xs text-white/40">
                {movie.title} · {segmentCount} câu EN
              </p>
            </div>
          </div>
          <button
            className="rounded-md p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            disabled={busy}
            onClick={() => onClose()}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Guide toggle */}
        <div className="border-b border-white/10">
          <button
            className="flex w-full items-center gap-2 px-5 py-2.5 text-xs text-white/50 transition hover:text-white/75"
            onClick={() => setShowGuide((v) => !v)}
            type="button"
          >
            <BookOpen size={13} />
            <span>Hướng dẫn format</span>
            {showGuide ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
          </button>
          {showGuide && (
            <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-white/70">Quy tắc:</p>
                <button
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-white/40 transition hover:bg-white/10 hover:text-white/70"
                  onClick={copyGuide}
                  type="button"
                >
                  <Copy size={11} /> Sao chép mẫu
                </button>
              </div>
              <ul className="space-y-1 text-xs text-white/50">
                <li>
                  <span className="font-mono text-white/30">#</span> Dòng bắt đầu bằng <span className="font-mono text-white/30">#</span> → comment, <strong className="text-white/70">không chiếm slot</strong>
                </li>
                <li>
                  Dòng <strong className="text-white/70">trắng</strong> → slot không dịch (câu đó bỏ qua)
                </li>
                <li>
                  Dòng có nội dung → bản dịch của câu EN theo <strong className="text-white/70">thứ tự slot</strong>
                </li>
                <li>
                  Tổng slot (dòng trắng + dòng có nội dung) phải <strong className="text-white/70">≤ {segmentCount} câu EN</strong>
                </li>
              </ul>
              <div className="mt-3 rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/40">
                <span className="text-green-400/60"># 1. Once upon a time...</span>
                {"\n"}
                <span className="text-white/70">Ngày xửa ngày xưa...</span>
                {"\n"}
                <span className="text-green-400/60"># 2. There was a dragon.</span>
                {"\n"}
                <span className="text-white/70">Có một con rồng.</span>
                {"\n"}
                <span className="text-green-400/60"># 3. (bỏ qua)</span>
                {"\n"}
                <span className="text-white/30">(dòng trắng)</span>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-2.5">
          <button
            className="flex items-center gap-1.5 rounded border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:border-white/30 hover:text-white"
            disabled={busy || !segmentCount}
            onClick={loadTemplate}
            type="button"
          >
            <Download size={13} />
            Tải template từ EN sub
          </button>
          <span className="ml-auto text-xs text-white/30">
            {lineCount > 0 && (
              <span className={lineCount > segmentCount ? "text-red-400" : "text-white/50"}>
                {lineCount} dòng dịch
              </span>
            )}
            {lineCount > 0 && " / "}
            {segmentCount} câu EN
          </span>
        </div>

        {/* Textarea */}
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            className="h-full min-h-[220px] w-full resize-none bg-transparent px-5 py-4 font-mono text-sm text-white/80 placeholder-white/20 outline-none"
            disabled={busy}
            onChange={(e) => {
              setContent(e.target.value);
              setPreview(null);
              setConfirmed(false);
            }}
            placeholder={"# Paste bản dịch vào đây...\n# Hoặc bấm \"Tải template từ EN sub\" để bắt đầu.\n\nNgày xửa ngày xưa...\nCó một con rồng.\n..."}
            spellCheck={false}
            value={content}
          />
        </div>

        {/* Preview result */}
        {preview && (
          <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3">
            <p className="text-xs font-semibold text-white/70 mb-1">Xem trước kết quả:</p>
            <div className="flex flex-wrap gap-4 text-xs text-white/55">
              <span>
                <span className="text-green-400">{preview.nonEmptyLines}</span> câu sẽ được lưu
              </span>
              <span>
                <span className="text-white/40">{preview.totalLines - preview.nonEmptyLines}</span> câu bỏ qua (dòng trắng)
              </span>
              <span>
                Tổng EN: <span className="text-white/70">{preview.segmentCount}</span>
              </span>
            </div>
            {preview.warnings?.length > 0 && (
              <p className="mt-1.5 text-xs text-amber-400/70">
                ⚠ {preview.warnings[0]?.message}
                {preview.warnings.length > 1 && ` (+${preview.warnings.length - 1} cảnh báo khác)`}
              </p>
            )}
          </div>
        )}

        {/* Confirmed */}
        {confirmed && (
          <div className="border-t border-white/10 bg-green-500/10 px-5 py-3 text-xs text-green-400">
            ✓ Đã lưu bản dịch thành công!
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-5 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-3">
          <button
            className="rounded-md px-4 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
            disabled={busy}
            onClick={() => onClose()}
            type="button"
          >
            Đóng
          </button>
          {!preview ? (
            <button
              className="rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
              disabled={busy || !content.trim()}
              onClick={handlePreview}
              type="button"
            >
              {busy ? "Đang kiểm tra..." : "Xem trước →"}
            </button>
          ) : (
            <button
              className="rounded-md bg-[#e06f50] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#c95f43] disabled:opacity-40"
              disabled={busy}
              onClick={handleSave}
              type="button"
            >
              {busy ? "Đang lưu..." : `Lưu ${preview.nonEmptyLines} câu dịch`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
