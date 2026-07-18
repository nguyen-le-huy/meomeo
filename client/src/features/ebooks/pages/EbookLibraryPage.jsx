import { ArrowLeft, ArrowRight, BookOpen, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { useEbooks } from "../hooks/useEbooks.js";

const pageSize = 12;

function EbookCard({ ebook }) {
  return (
    <Link
      aria-label={`Mở ebook ${ebook.title}`}
      className="group block min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 focus-visible:ring-offset-2"
      to={`/ebooks/${ebook.slug}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded border border-[#d8d0c6] bg-cream-soft shadow-[0_1px_2px_rgba(20,20,19,0.16)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_22px_rgba(20,20,19,0.16)]">
        {ebook.coverUrl ? (
          <img
            alt={`Bìa sách ${ebook.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            src={ebook.coverUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="text-coral" size={40} strokeWidth={1.5} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function EbookLibraryPage() {
  const navigate = useNavigate();
  const listTopRef = useRef(null);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: ebooks = [], isLoading, isError } = useEbooks({ includeUnpublished: isAdmin || undefined });
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
        <div className="scroll-mt-16 flex flex-wrap items-end justify-between gap-4 border-b border-[#e6dfd8] pb-6 md:scroll-mt-20" ref={listTopRef}>
          <div>
            <p className="eyebrow">Thư viện</p>
            <h1 className="mt-2 text-3xl font-normal sm:text-4xl">Đọc ebook online</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Đọc EPUB và PDF trực tiếp trên trình duyệt, lưu lại vị trí đang đọc.</p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && !isError ? (
              <span className="rounded-full bg-cream-soft px-3 py-1.5 text-xs font-semibold text-ink-muted">
                {ebooks.length} cuốn sách
              </span>
            ) : null}
            {isAdmin ? <Button onClick={() => navigate("/admin/ebooks")} type="button" variant="outline"><Settings2 size={16} /> Quản lý ebook</Button> : null}
          </div>
        </div>

        {isLoading ? <LoadingState className="mt-8" label="Đang tải thư viện..." /> : null}
        {isError ? <p className="mt-8 text-sm font-semibold text-red-700">Không tải được thư viện ebook.</p> : null}

        {visibleEbooks.length ? (
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 xl:grid-cols-6">
            {visibleEbooks.map((ebook) => (
              <EbookCard ebook={ebook} key={ebook._id} />
            ))}
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
