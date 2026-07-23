import { Captions, Copy, Languages, LoaderCircle, RefreshCw, Send, Sparkles, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { Toast } from "../../../components/ui/toast.jsx";
import ImportViTextDialog from "./ImportViTextDialog.jsx";

const TRANSLATION_MODELS = [
  { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", hint: "Rẻ nhất" },
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", hint: "Chất lượng cao" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini", hint: "Chất lượng cao" },
  { id: "gpt-5-mini", label: "GPT-5 mini", hint: "Cân bằng" },
];

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to execCommand for browsers that expose but block Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error("Clipboard copy failed");
}

export default function MoviePlayerAdminTools({ eligibility, movie, mutations, segmentCount, segments, translationCount }) {
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [showViTextDialog, setShowViTextDialog] = useState(false);
  const [translationModel, setTranslationModel] = useState("deepseek-v4-pro");
  const [toast, setToast] = useState(null);
  const toastIdRef = useRef(0);
  const toastTimerRef = useRef(null);
  const busy = Boolean(busyAction);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  function dismissToast() {
    window.clearTimeout(toastTimerRef.current);
    setToast(null);
  }

  function showToast(messageText, variant = "success") {
    window.clearTimeout(toastTimerRef.current);
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message: messageText, variant });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  }

  async function importSubtitle(language, file) {
    if (!file) return;
    setBusyAction(`import-${language}`);
    setMessage("");
    try {
      const previewResponse = await mutations.importSubtitle.mutateAsync({ id: movie._id, language, file, dryRun: true });
      const preview = previewResponse.data.data;
      const summary = language === "en"
        ? `${preview.count} câu, ${preview.warnings?.length || 0} cảnh báo`
        : `${preview.matchedCount} câu khớp, ${preview.unmatchedCount} câu chưa khớp`;
      if (!window.confirm(`Preview ${language.toUpperCase()}: ${summary}. Xác nhận lưu?`)) return;
      await mutations.importSubtitle.mutateAsync({ id: movie._id, language, file, dryRun: false });
      setMessage(`Đã import phụ đề ${language.toUpperCase()}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Import phụ đề thất bại");
    } finally {
      setBusyAction("");
    }
  }

  async function createVietsub() {
    const selectedModel = TRANSLATION_MODELS.find((item) => item.id === translationModel);
    const force = segmentCount > 0 && translationCount === segmentCount;
    const prompt = force
      ? `Phim đã có đủ ${translationCount} câu Vietsub. Tạo lại toàn bộ bằng ${selectedModel?.label || translationModel}?`
      : `Dùng ${selectedModel?.label || translationModel} để dịch ${Math.max(0, segmentCount - translationCount)} câu chưa có Vietsub?`;
    if (!window.confirm(prompt)) return;
    setBusyAction("vietsub");
    setMessage(`${selectedModel?.label || translationModel} đang dịch ${force ? segmentCount : Math.max(0, segmentCount - translationCount)} câu. Không đóng trang này...`);
    try {
      const response = await mutations.generateVietsub.mutateAsync({ id: movie._id, force, model: translationModel });
      const result = response.data.data;
      setMessage(`${selectedModel?.label || result.model} đã dịch ${result.translatedCount} câu. Hãy kiểm tra lại trước khi publish.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Không thể tạo Vietsub");
    } finally {
      setBusyAction("");
    }
  }

  async function syncBunny() {
    setBusyAction("sync");
    setMessage("Đang đồng bộ video và 3 track phụ đề với Bunny...");
    try {
      await mutations.sync.mutateAsync(movie._id);
      setMessage("Đã đồng bộ video và phụ đề Song ngữ / English / Tiếng Việt với Bunny.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Không thể đồng bộ với Bunny");
    } finally {
      setBusyAction("");
    }
  }

  function handleViTextClose(result) {
    setShowViTextDialog(false);
    if (result) {
      setMessage(`Đã lưu ${result.savedCount} câu dịch tiếng Việt.`);
    }
  }

  async function copyEnglishSubtitles() {
    const englishLines = segments
      .map((segment) => String(segment.text || "").trim())
      .filter(Boolean);
    const englishSubtitles = englishLines.join("\n");

    if (!englishSubtitles) {
      showToast("Chưa có phụ đề EN để sao chép.", "error");
      return;
    }

    try {
      await copyToClipboard(englishSubtitles);
      showToast(`Đã sao chép ${englishLines.length.toLocaleString("vi-VN")} câu EN.`);
    } catch {
      showToast("Không thể sao chép. Trình duyệt đang chặn clipboard.", "error");
    }
  }

  return (
    <div className="shrink-0 border-b border-white/10 bg-[#171717] p-2.5 sm:p-3">
      {toast ? <Toast key={toast.id} message={toast.message} onClose={dismissToast} variant={toast.variant} /> : null}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded border border-white/15 px-2 text-[11px] font-medium disabled:opacity-40 sm:h-9 sm:w-auto sm:px-3 sm:text-xs" disabled={busy} onClick={syncBunny} type="button"><RefreshCw className={busyAction === "sync" ? "animate-spin" : ""} size={14} /> Đồng bộ Bunny</button>
        <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-white/15 px-2 text-[11px] font-medium sm:h-9 sm:w-auto sm:px-3 sm:text-xs"><Captions size={14} /> Import EN<input accept=".srt,.vtt" className="sr-only" disabled={busy} onChange={(event) => importSubtitle("en", event.target.files?.[0])} type="file" /></label>
        <button
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded border border-white/15 px-2 text-[11px] font-medium disabled:opacity-40 sm:h-9 sm:w-auto sm:px-3 sm:text-xs"
          disabled={busy || !segmentCount}
          onClick={copyEnglishSubtitles}
          title="Copy toàn bộ phụ đề tiếng Anh, mỗi câu một dòng"
          type="button"
        >
          <Copy size={14} /> Copy EN Sub
        </button>
        <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-white/15 px-2 text-[11px] font-medium sm:h-9 sm:w-auto sm:px-3 sm:text-xs"><Languages size={14} /> Import VI (.srt)<input accept=".srt,.vtt" className="sr-only" disabled={busy} onChange={(event) => importSubtitle("vi", event.target.files?.[0])} type="file" /></label>
        <button
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-[#e06f50]/40 bg-[#e06f50]/10 px-2 text-[11px] font-medium text-[#f3a38d] disabled:opacity-40 sm:h-9 sm:w-auto sm:px-3 sm:text-xs"
          disabled={busy || !segmentCount}
          onClick={() => setShowViTextDialog(true)}
          title="Import bản dịch tiếng Việt dạng văn bản thuần theo thứ tự câu"
          type="button"
        >
          <Type size={14} /> Import VI văn bản
        </button>
        <Select disabled={busy} onValueChange={setTranslationModel} value={translationModel}>
          <SelectTrigger
            aria-label="Chọn model dịch phụ đề"
            className="h-10 border-white/15 bg-white/[0.04] px-2 text-[11px] font-medium text-white focus:border-[#e06f50] focus:ring-[#e06f50]/20 sm:h-9 sm:w-52 sm:px-3 sm:text-xs"
            title="Chọn model dùng để tạo Vietsub"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-64 border-white/15 bg-[#222] text-white" position="item-aligned">
            {TRANSLATION_MODELS.map((model) => (
              <SelectItem className="focus:bg-white/10" key={model.id} value={model.id}>
                {model.label} · {model.hint}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded border border-[#e06f50]/55 bg-[#e06f50]/10 px-2 text-[11px] font-semibold text-[#f3a38d] disabled:opacity-40 sm:h-9 sm:w-auto sm:px-3 sm:text-xs"
          disabled={busy || segmentCount < 1}
          onClick={createVietsub}
          title="Dịch phụ đề English sang tiếng Việt bằng AI"
          type="button"
        >
          {busyAction === "vietsub" ? <LoaderCircle className="animate-spin" size={14} /> : <Sparkles size={14} />}
          {busyAction === "vietsub" ? "AI đang dịch..." : "Tạo Vietsub bằng AI"}
        </button>
        <button
          className={`col-span-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded px-3 text-[11px] font-semibold sm:h-9 sm:w-auto sm:text-xs ${movie.isPublished ? "bg-white/10 text-white" : "bg-[#e06f50] text-white"}`}
          disabled={busy || (!movie.isPublished && !eligibility?.eligible)}
          onClick={() => mutations.publish.mutate({ id: movie._id, isPublished: !movie.isPublished })}
          type="button"
        >
          <Send size={14} /> {movie.isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>
      {!movie.isPublished && eligibility?.reasons?.length ? <p className="mt-2 text-xs text-amber-300/75">{eligibility.reasons.map((reason) => reason.message).join(" · ")}</p> : null}
      {message ? <p className="mt-2 text-xs text-white/55">{message}</p> : null}

      {showViTextDialog && (
        <ImportViTextDialog
          movie={movie}
          mutation={mutations.importViText}
          onClose={handleViTextClose}
          segments={segments}
        />
      )}
    </div>
  );
}
