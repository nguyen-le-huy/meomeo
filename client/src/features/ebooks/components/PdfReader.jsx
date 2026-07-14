import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Button } from "../../../components/ui/button.jsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export default function PdfReader({ ebook, settings, progress, onProgress }) {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(progress?.page || 1);
  const [numPages, setNumPages] = useState(0);
  useEffect(() => { let active = true; pdfjsLib.getDocument(ebook.fileUrl).promise.then((document) => { if (active) { setPdf(document); setNumPages(document.numPages); } }); return () => { active = false; }; }, [ebook.fileUrl]);
  useEffect(() => { if (!pdf || !canvasRef.current) return; pdf.getPage(page).then((pdfPage) => { const viewport = pdfPage.getViewport({ scale: 1.35 }); const canvas = canvasRef.current; canvas.width = viewport.width; canvas.height = viewport.height; pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport }); }); onProgress({ page, progress: numPages ? page / numPages : 0 }); }, [pdf, page, numPages, onProgress]);
  return <div className={`grid justify-items-center gap-3 overflow-auto p-4 ${settings.theme === "dark" ? "bg-[#252320]" : settings.theme === "sepia" ? "bg-[#f4ead7]" : "bg-cream-soft"}`}><canvas className="max-w-full shadow-md" ref={canvasRef} /><div className="flex items-center gap-3"><Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} size="sm" type="button" variant="outline">Trước</Button><span className="text-sm font-semibold">{page} / {numPages || "..."}</span><Button disabled={page >= numPages} onClick={() => setPage((current) => current + 1)} size="sm" type="button" variant="outline">Sau</Button></div></div>;
}
