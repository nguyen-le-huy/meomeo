import { AlertCircle, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import { getReaderTheme } from "../config/readerAppearance.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfReader({ ebook, settings, progress, zoom, onProgress, onPageChange, onBookmarkReady, onControlsReady }) {
  const canvasRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pageRef = useRef(Math.max(1, progress?.page || 1));
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(() => Math.max(1, progress?.page || 1));
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState("");
  const theme = getReaderTheme(settings.theme);

  const changePage = useCallback((nextPage) => {
    setPage(nextPage);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  pageRef.current = page;

  useEffect(() => {
    let active = true;
    let loadingTask;

    setPdf(null);
    setNumPages(0);
    setError("");

    if (!ebook.fileUrl) {
      setError("Ebook này chưa có đường dẫn PDF hợp lệ.");
      return () => {
        active = false;
      };
    }

    // pdfjs-dist v6 requires a DocumentInitParameters object. Passing the URL
    // string directly (supported by older versions) is treated as an empty
    // source and throws: expected either `data`, `range`, or `url` parameter.
    loadingTask = pdfjsLib.getDocument({ url: ebook.fileUrl });
    loadingTask.promise
      .then((document) => {
        if (!active) {
          document.destroy();
          return;
        }
        setPdf(document);
        setNumPages(document.numPages);
        setPage((current) => Math.min(Math.max(1, current), document.numPages));
      })
      .catch((loadError) => {
        if (!active) return;
        console.error("Could not load PDF", loadError);
        setError("Không thể tải file PDF. Vui lòng thử lại hoặc kiểm tra file đã tải lên.");
      });

    return () => {
      active = false;
      loadingTask?.destroy();
    };
  }, [ebook.fileUrl]);

  useEffect(() => {
    if (!progress?.page) return;
    setPage(Math.max(1, Math.min(progress.page, numPages || progress.page)));
  }, [numPages, progress?.page]);

  useEffect(() => {
    if (!pdf || !numPages) {
      onControlsReady(null);
      onBookmarkReady(null);
      return undefined;
    }

    onControlsReady({
      next: page < numPages ? () => changePage(page + 1) : null,
      prev: page > 1 ? () => changePage(page - 1) : null,
    });
    onBookmarkReady(() => `pdf-page:${pageRef.current}`);

    return () => {
      onControlsReady(null);
      onBookmarkReady(null);
    };
  }, [changePage, numPages, onBookmarkReady, onControlsReady, page, pdf]);

  useEffect(() => {
    const handleGoto = (event) => {
      const match = /^pdf-page:(\d+)$/.exec(String(event.detail || ""));
      if (!match) return;
      changePage(Math.max(1, Math.min(Number(match[1]), numPages || Number(match[1]))));
    };

    window.addEventListener("meomeo:ebook-goto", handleGoto);
    return () => window.removeEventListener("meomeo:ebook-goto", handleGoto);
  }, [changePage, numPages]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return undefined;

    let cancelled = false;
    let renderTask;

    pdf.getPage(page)
      .then((pdfPage) => {
        if (cancelled || !canvasRef.current) return;

        const viewport = pdfPage.getViewport({ scale: 1.35 * zoom });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `min(${viewport.width}px, ${zoom * 100}%)`;
        canvas.style.height = "auto";
        renderTask = pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport });
        renderTask.promise.catch((renderError) => {
          if (renderError?.name !== "RenderingCancelledException") {
            console.error("Could not render PDF page", renderError);
            setError("Không thể hiển thị trang PDF này.");
          }
        });
      })
      .catch((pageError) => {
        if (cancelled) return;
        console.error("Could not open PDF page", pageError);
        setError("Không thể mở trang PDF này.");
      });

    onProgress({ page, progress: numPages ? page / numPages : 0 });
    onPageChange?.({ current: page, total: numPages || null, estimated: false });

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [pdf, page, numPages, onProgress, onPageChange, zoom]);

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6" style={{ backgroundColor: theme.background, color: theme.foreground }}>
        <div className="max-w-md rounded-lg border p-5 text-center" style={{ backgroundColor: theme.surface, borderColor: theme.border }} role="alert">
          <AlertCircle className="mx-auto mb-3 text-red-700" size={24} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 p-6 text-sm font-medium" style={{ backgroundColor: theme.background, color: theme.muted }}>
        <LoaderCircle className="animate-spin" size={20} />
        Đang tải PDF...
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 w-full overflow-auto overscroll-contain pb-2" ref={scrollContainerRef} style={{ backgroundColor: theme.background, color: theme.foreground }}>
      <div className="grid min-h-full min-w-full justify-items-center p-4">
        <canvas className="max-w-none shadow-md" ref={canvasRef} />
      </div>
    </div>
  );
}
