import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Button } from "../../../components/ui/button.jsx";
import { getReaderTheme } from "../config/readerAppearance.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfReader({ ebook, settings, progress, onProgress, onPageChange }) {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(() => Math.max(1, progress?.page || 1));
  const [numPages, setNumPages] = useState(0);
  const theme = getReaderTheme(settings.theme);

  useEffect(() => {
    let active = true;

    setPdf(null);
    setNumPages(0);
    setPage(Math.max(1, progress?.page || 1));

    pdfjsLib.getDocument(ebook.fileUrl).promise.then((document) => {
      if (!active) return;
      setPdf(document);
      setNumPages(document.numPages);
      setPage((current) => Math.min(Math.max(1, current), document.numPages));
    });

    return () => {
      active = false;
    };
  }, [ebook.fileUrl, progress?.page]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return undefined;

    let cancelled = false;
    let renderTask;

    pdf.getPage(page).then((pdfPage) => {
      if (cancelled || !canvasRef.current) return;

      const viewport = pdfPage.getViewport({ scale: 1.35 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      renderTask = pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport });
      renderTask.promise.catch(() => {});
    });

    onProgress({ page, progress: numPages ? page / numPages : 0 });
    onPageChange?.({ current: page, total: numPages || null, estimated: false });

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [pdf, page, numPages, onProgress, onPageChange]);

  return (
    <div className="grid min-h-0 flex-1 justify-items-center gap-3 overflow-auto p-4" style={{ backgroundColor: theme.background, color: theme.foreground }}>
      <canvas className="max-w-full shadow-md" ref={canvasRef} />
      <div className="flex items-center gap-3">
        <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" type="button" variant="outline">
          Trước
        </Button>
        <span className="text-sm font-semibold">Trang {page} / {numPages || "..."}</span>
        <Button disabled={!numPages || page >= numPages} onClick={() => setPage((current) => Math.min(numPages, current + 1))} size="sm" type="button" variant="outline">
          Sau
        </Button>
      </div>
    </div>
  );
}
