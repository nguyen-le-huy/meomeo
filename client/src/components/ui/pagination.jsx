import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "./button.jsx";

function Pagination({ currentPage, onPageChange, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-[#e6dfd8] pt-5">
      <Button className="justify-self-start" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} size="sm" type="button" variant="outline">
        <ArrowLeft size={15} />
        <span><span className="hidden sm:inline">Trang </span>trước</span>
      </Button>
      <p aria-live="polite" className="text-center text-xs font-semibold text-ink-muted">Trang {currentPage} / {totalPages}</p>
      <Button className="justify-self-end" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} size="sm" type="button" variant="outline">
        <span><span className="hidden sm:inline">Trang </span>sau</span>
        <ArrowRight size={15} />
      </Button>
    </nav>
  );
}

export { Pagination };
