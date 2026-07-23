import { Captions, Languages, LoaderCircle, RefreshCw, Send, Sparkles, Type } from "lucide-react";
import { useState } from "react";
import ImportViTextDialog from "./ImportViTextDialog.jsx";

export default function MoviePlayerAdminTools({ eligibility, movie, mutations, segmentCount, segments, translationCount }) {
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [showViTextDialog, setShowViTextDialog] = useState(false);
  const busy = Boolean(busyAction);

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
    const force = segmentCount > 0 && translationCount === segmentCount;
    const prompt = force
      ? `Phim đã có đủ ${translationCount} câu Vietsub. Tạo lại toàn bộ bằng AI?`
      : `Dùng AI để dịch ${Math.max(0, segmentCount - translationCount)} câu chưa có Vietsub?`;
    if (!window.confirm(prompt)) return;
    setBusyAction("vietsub");
    setMessage(`AI đang dịch ${force ? segmentCount : Math.max(0, segmentCount - translationCount)} câu. Không đóng trang này...`);
    try {
      const response = await mutations.generateVietsub.mutateAsync({ id: movie._id, force });
      const result = response.data.data;
      setMessage(`AI đã dịch ${result.translatedCount} câu. Hãy kiểm tra lại trước khi publish.`);
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

  return (
    <div className="shrink-0 border-b border-white/10 bg-[#171717] p-2.5 sm:p-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded border border-white/15 px-2 text-[11px] font-medium disabled:opacity-40 sm:h-9 sm:w-auto sm:px-3 sm:text-xs" disabled={busy} onClick={syncBunny} type="button"><RefreshCw className={busyAction === "sync" ? "animate-spin" : ""} size={14} /> Đồng bộ Bunny</button>
        <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-white/15 px-2 text-[11px] font-medium sm:h-9 sm:w-auto sm:px-3 sm:text-xs"><Captions size={14} /> Import EN<input accept=".srt,.vtt" className="sr-only" disabled={busy} onChange={(event) => importSubtitle("en", event.target.files?.[0])} type="file" /></label>
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
