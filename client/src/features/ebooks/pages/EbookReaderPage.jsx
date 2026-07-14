import { ArrowLeft, BookmarkPlus, LoaderCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useEbook } from "../hooks/useEbooks.js";
import { useEbookReader } from "../hooks/useEbookReader.js";
import EbookToolbar, { EbookBookmarksPanel, EbookSettingsPanel } from "../components/EbookToolbar.jsx";
import EpubReader from "../components/EpubReader.jsx";
import PdfReader from "../components/PdfReader.jsx";

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

  if (isLoading) return <LoadingState className="p-8" label="Đang mở ebook..." />;

  if (isError || !ebook) {
    return (
      <div className="p-8">
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

  const pageThemeClass = reader.settings.theme === "dark"
    ? "bg-[#252320] text-[#f6f0e5]"
    : reader.settings.theme === "sepia"
      ? "bg-[#f4ead7] text-[#453b2b]"
      : "bg-canvas text-coal";
  const metaThemeClass = reader.settings.theme === "dark"
    ? "text-[#d7ccbc]"
    : reader.settings.theme === "sepia"
      ? "text-[#7a6650]"
      : "text-ink-muted";
  const pageBadgeClass = reader.settings.theme === "dark"
    ? "border-white/15 bg-white/10 text-[#f6f0e5]"
    : reader.settings.theme === "sepia"
      ? "border-[#c7b595] bg-[#eadcc3] text-[#453b2b]"
      : "border-[#e6dfd8] bg-cream-soft text-coal";
  const pageLabel = pageInfo?.current
    ? `Trang ${pageInfo.current}${pageInfo.total ? ` / ${pageInfo.total}` : ""}${pageInfo.estimated ? " (ước tính)" : ""}`
    : "";

  return (
    <section className={`min-h-full ${pageThemeClass}`}>
      <EbookToolbar
        onBack={() => navigate("/ebooks")}
        onBookmark={() => setBookmarksOpen(true)}
        onNext={readerControls?.next}
        onPrev={readerControls?.prev}
        onSettings={(patch) => (patch.panel ? setSettingsOpen((current) => !current) : reader.updateSettings(patch))}
        settings={reader.settings}
      />
      <div className="h-12 md:h-16" />

      {bookmarkStatus ? (
        <div className={`fixed right-3 top-28 z-40 rounded-md px-3 py-2 text-sm font-semibold shadow-lg md:top-36 ${bookmarkStatus.type === "success" ? "bg-green-700 text-white" : "bg-red-700 text-white"}`} role="status">
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

      <div className={`mx-auto max-w-6xl px-3 ${pageThemeClass}`}>
        <div className={`sticky top-12 z-20 -mx-3 mb-3 flex items-start gap-3 border-b px-3 py-3 backdrop-blur md:top-16 ${reader.settings.theme === "dark" ? "border-white/10 bg-[#252320]/95" : reader.settings.theme === "sepia" ? "border-[#d9cbb4] bg-[#f4ead7]/95" : "border-[#e6dfd8] bg-canvas/95"}`}>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{ebook.title}</h1>
            <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${metaThemeClass}`}>
              <span className="min-w-0 truncate">{ebook.author || ebook.originalFilename}</span>
              {pageLabel ? <span className={`shrink-0 rounded-full border px-2 py-0.5 font-bold ${pageBadgeClass}`}>{pageLabel}</span> : null}
            </div>
          </div>
          {reader.isLoading ? <LoaderCircle className="mt-1 animate-spin" size={16} /> : null}
          <Button aria-label="Lưu bookmark tại vị trí hiện tại" className="shrink-0 shadow-sm" disabled={!bookmarkGetter} onClick={onBookmark} size="icon" type="button" variant="outline">
            <BookmarkPlus size={16} />
          </Button>
        </div>

        {ebook.format === "epub" ? (
          <EpubReader
            ebook={ebook}
            onBookmarkReady={(getter) => setBookmarkGetter(() => getter)}
            onControlsReady={setReaderControls}
            onProgress={saveProgress}
            progress={reader.progress}
            settings={reader.settings}
          />
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
