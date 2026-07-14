import { ArrowLeft, ArrowRight, BookOpen, FileText, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { useEbookProgresses, useEbooks } from "../hooks/useEbooks.js";

const pageSize = 9;

export default function EbookLibraryPage() {
  const navigate = useNavigate();
  const listTopRef = useRef(null);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [sessionId] = useState(() => getGuestSessionId());
  const [currentPage, setCurrentPage] = useState(1);
  const { data: ebooks = [], isLoading, isError } = useEbooks({ includeUnpublished: isAdmin || undefined });
  const { data: progresses = [] } = useEbookProgresses(sessionId);
  const progressMap = new Map(progresses.map((progress) => [progress.ebookId, progress]));
  const totalPages = Math.max(1, Math.ceil(ebooks.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleEbooks = ebooks.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="scroll-mt-16 flex flex-wrap items-end justify-between gap-4 border-b pb-6 md:scroll-mt-20" ref={listTopRef}>
          <div>
            <p className="eyebrow">Thư viện</p>
            <h1 className="mt-2 font-display text-3xl font-normal sm:text-4xl">Đọc ebook online</h1>
            <p className="mt-2 text-sm font-medium text-ink-muted">Đọc EPUB và PDF trực tiếp trên trình duyệt, lưu lại vị trí đang đọc.</p>
          </div>
          {isAdmin ? <Button onClick={() => navigate("/admin/ebooks")} type="button" variant="outline"><Settings2 size={16} /> Quản lý ebook</Button> : null}
        </div>

        {isLoading ? <LoadingState className="mt-8" label="Đang tải thư viện..." /> : null}
        {isError ? <p className="mt-8 text-sm font-semibold text-red-700">Không tải được thư viện ebook.</p> : null}

        {visibleEbooks.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {visibleEbooks.map((ebook) => {
              const progress = progressMap.get(ebook._id);
              const progressPercent = Math.max(0, Math.min(100, Math.round((progress?.progress || 0) * 100)));
              return (
                <Link aria-label={`Mở ebook ${ebook.title}`} className="block h-full min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 focus-visible:ring-offset-2" key={ebook._id} to={`/ebooks/${ebook.slug}`}>
                  <Card className="flex h-full min-w-0 flex-col overflow-hidden shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex aspect-[3/4] shrink-0 items-center justify-center bg-cream-soft">{ebook.coverUrl ? <img alt={ebook.title} className="h-full w-full object-cover" src={ebook.coverUrl} /> : <BookOpen className="text-coral" size={40} />}</div>
                    <CardContent className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                      <div className="flex min-w-0 items-center justify-between gap-1 text-[10px] font-semibold text-ink-muted sm:gap-2 sm:text-xs"><span className="inline-flex shrink-0 items-center gap-1"><FileText size={12} /> {ebook.format.toUpperCase()}</span><span className="truncate">{ebook.level || "Ebook"}</span></div>
                      <h2 className="mt-2 min-h-11 line-clamp-2 text-base font-bold leading-snug sm:mt-3 sm:min-h-14 sm:text-xl">{ebook.title}</h2>
                      <div className="mt-auto pt-3"><div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-ink-muted sm:text-xs"><span>{progressPercent > 0 ? "Tiến độ đọc" : "Chưa bắt đầu"}</span><span>{progressPercent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8dfd4]"><div className="h-full rounded-full bg-coral transition-[width] duration-300" style={{ width: `${progressPercent}%` }} /></div></div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : null}

        {!isLoading && !ebooks.length ? <Card className="mt-8 border-dashed"><CardContent className="p-8 text-center text-sm font-semibold text-ink-muted">Chưa có ebook được xuất bản.</CardContent></Card> : null}

        {ebooks.length > pageSize ? (
          <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-[#e6dfd8] pt-5">
            <Button className="justify-self-start" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} size="sm" type="button" variant="outline"><ArrowLeft size={15} /><span><span className="hidden sm:inline">Trang </span>trước</span></Button>
            <p className="text-center text-xs font-semibold text-ink-muted">Trang {currentPage} / {totalPages}</p>
            <Button className="justify-self-end" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} size="sm" type="button" variant="outline"><span><span className="hidden sm:inline">Trang </span>sau</span><ArrowRight size={15} /></Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
