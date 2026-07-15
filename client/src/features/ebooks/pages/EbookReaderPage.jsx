import { ArrowLeft, BookmarkPlus, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useEbook } from "../hooks/useEbooks.js";
import { useEbookReader } from "../hooks/useEbookReader.js";
import EbookToolbar, { EbookBookmarksPanel, EbookSettingsPanel } from "../components/EbookToolbar.jsx";
import EpubReader from "../components/EpubReader.jsx";
import PdfReader from "../components/PdfReader.jsx";
import { getReaderTheme } from "../config/readerAppearance.js";

export default function EbookReaderPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: ebook, isLoading, isError } = useEbook(slug);
  const reader = useEbookReader(ebook?._id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarkGetter, setBookmarkGetter] = useState(null);
  const [readerControls, setReaderControls] = useState(null);
  const [bookmarkStatus, setBookmarkStatus] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);

  const saveProgress = useCallback((data) => {
    if (ebook?._id) reader.saveProgress(data);
  }, [ebook?._id, reader.saveProgress]);

  const updatePageInfo = useCallback((nextPageInfo) => {
    setPageInfo((current) => {
      if (
        current?.current === nextPageInfo?.current &&
        current?.total === nextPageInfo?.total &&
        current?.estimated === nextPageInfo?.estimated
      ) {
        return current;
      }

      return nextPageInfo;
    });
  }, []);

  if (isLoading) return <LoadingState className="h-full p-8" label="Đang mở ebook..." />;

  if (isError || !ebook) {
    return (
      <div className="h-full p-8">
        <p className="font-semibold text-red-700">Không tìm thấy ebook.</p>
        <Button className="mt-4" onClick={() => navigate("/ebooks")} type="button" variant="outline">
          <ArrowLeft size={16} /> Thư viện
        </Button>
      </div>
    );
  }

  const showBookmarkStatus = (type, message) => {
    setBookmarkStatus({ type, message });
    window.setTimeout(() => setBookmarkStatus(null), 2500);
  };

  const onBookmark = async () => {
    const cfi = bookmarkGetter?.();
    if (!cfi) {
      showBookmarkStatus("error", "Chưa xác định được vị trí đọc.");
      return;
    }

    try {
      await reader.addBookmark({
        cfi,
        label: `Vị trí ${new Date().toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        })}`,
      });
      showBookmarkStatus("success", "Đã lưu bookmark.");
    } catch (error) {
      showBookmarkStatus("error", error?.response?.data?.message || "Không lưu được bookmark.");
    }
  };

  const onBookmarkClick = (bookmark) => {
    window.dispatchEvent(new CustomEvent("meomeo:ebook-goto", { detail: bookmark.cfi }));
  };

  const onBookmarkRemove = async (bookmark) => {
    try {
      await reader.removeBookmark(bookmark._id);
      showBookmarkStatus("success", "Đã xoá bookmark.");
    } catch (error) {
      showBookmarkStatus("error", error?.response?.data?.message || "Không xoá được bookmark.");
    }
  };

  const onSaveSettings = async () => {
    try {
      await reader.saveSettings();
      showBookmarkStatus("success", "Đã lưu cài đặt đọc.");
    } catch (error) {
      showBookmarkStatus("error", error?.response?.data?.message || "Không lưu được cài đặt đọc.");
    }
  };

  const readerTheme = getReaderTheme(reader.settings.theme);
  const readingProgress = Math.max(0, Math.min(1, Number(reader.progress?.progress) || 0));
  const pageLabel = pageInfo?.current
    ? `Trang ${pageInfo.current}${pageInfo.total ? ` / ${pageInfo.total}` : ""}${pageInfo.estimated ? " (ước tính)" : ""}`
    : "";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden" style={{ backgroundColor: readerTheme.background, color: readerTheme.foreground }}>
      <EbookToolbar
        bookmarkCount={reader.bookmarks.length}
        onBack={() => navigate("/ebooks")}
        onBookmark={() => setBookmarksOpen(true)}
        onNext={readerControls?.next}
        onPrev={readerControls?.prev}
        onSettings={(patch) => (patch.panel ? setSettingsOpen((current) => !current) : reader.updateSettings(patch))}
        pageLabel={pageLabel}
        progress={readingProgress}
        settings={reader.settings}
      />
      <div className="h-14 shrink-0" />

      {bookmarkStatus ? (
        <div className={`fixed right-3 top-28 z-[70] rounded-md px-3 py-2 text-sm font-semibold shadow-lg md:top-36 ${bookmarkStatus.type === "success" ? "bg-green-700 text-white" : "bg-red-700 text-white"}`} role="status">
          {bookmarkStatus.message}
        </div>
      ) : null}

      {settingsOpen ? (
        <EbookSettingsPanel
          hasUnsavedSettings={reader.hasUnsavedSettings}
          isSaving={reader.isSavingSettings}
          onClose={() => setSettingsOpen(false)}
          onSave={onSaveSettings}
          onSettings={reader.updateSettings}
          settings={reader.settings}
        />
      ) : null}

      {bookmarksOpen ? (
        <EbookBookmarksPanel
          bookmarks={reader.bookmarks}
          onBookmarkClick={onBookmarkClick}
          onBookmarkRemove={onBookmarkRemove}
          onClose={() => setBookmarksOpen(false)}
        />
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3" style={{ backgroundColor: readerTheme.background, color: readerTheme.foreground }}>
        <div className="z-20 -mx-3 mb-3 shrink-0 border-b px-3 pb-3 pt-3 sm:pb-4 sm:pt-4" style={{ backgroundColor: readerTheme.background, borderColor: readerTheme.border }}>
          <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-tight sm:text-lg">{ebook.title}</h1>
            <div className="mt-1 flex min-w-0 items-center text-[11px] sm:text-xs" style={{ color: readerTheme.muted }}>
              <span className="min-w-0 truncate">{ebook.author || ebook.originalFilename}</span>
            </div>
          </div>
          {reader.isLoading ? <LoaderCircle className="mt-1 animate-spin" size={16} /> : null}
          <Button
            aria-label="Lưu bookmark tại vị trí hiện tại"
            className="h-9 w-9 shrink-0 border px-0 shadow-sm sm:w-auto sm:px-3"
            disabled={!bookmarkGetter}
            onClick={onBookmark}
            style={{ backgroundColor: readerTheme.surface, borderColor: readerTheme.border, color: readerTheme.foreground }}
            title="Lưu trang đang đọc"
            type="button"
            variant="ghost"
          >
            <BookmarkPlus size={16} />
            <span className="hidden text-xs sm:inline">Lưu trang</span>
          </Button>
          </div>
        </div>

        {ebook.format === "epub" ? (
          <>
            <EpubReader
              ebook={ebook}
              onBookmarkReady={(getter) => setBookmarkGetter(() => getter)}
              onControlsReady={setReaderControls}
              onProgress={saveProgress}
              progress={reader.progress}
              settings={reader.settings}
            />
            <div className="-mx-3 shrink-0 px-3 pb-3 pt-2" style={{ backgroundColor: readerTheme.background }}>
              <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-lg border p-2 shadow-sm" style={{ backgroundColor: readerTheme.surface, borderColor: readerTheme.border }}>
                <Button
                  className="min-w-0 flex-1 justify-center gap-2"
                  disabled={!readerControls?.prev}
                  onClick={readerControls?.prev}
                  style={{ color: readerTheme.foreground }}
                  type="button"
                  variant="ghost"
                >
                  <ChevronLeft size={16} />
                  <span>Trang trước</span>
                </Button>
                <div className="h-7 w-px shrink-0" style={{ backgroundColor: readerTheme.border }} />
                <Button
                  className="min-w-0 flex-1 justify-center gap-2"
                  disabled={!readerControls?.next}
                  onClick={readerControls?.next}
                  style={{ color: readerTheme.foreground }}
                  type="button"
                  variant="ghost"
                >
                  <span>Trang sau</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <PdfReader
            ebook={ebook}
            onPageChange={updatePageInfo}
            onProgress={saveProgress}
            progress={reader.progress}
            settings={reader.settings}
          />
        )}
      </div>
    </section>
  );
}
