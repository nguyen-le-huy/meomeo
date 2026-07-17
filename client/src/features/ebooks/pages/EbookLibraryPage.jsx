import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Settings2 } from "lucide-react";
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
      className="group block h-full min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 focus-visible:ring-offset-2"
      to={`/ebooks/${ebook.slug}`}
    >
      <Card className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border-[#e6dfd8] bg-canvas transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#d2c9be] group-hover:shadow-[0_12px_28px_rgba(20,20,19,0.09)]">
        <div className="relative flex aspect-[3/4] shrink-0 items-center justify-center overflow-hidden border-b border-[#e6dfd8] bg-cream-soft/60">
          {ebook.coverUrl ? (
            <img
              alt={`Bìa sách ${ebook.title}`}
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.015]"
              loading="lazy"
              src={ebook.coverUrl}
            />
          ) : (
            <BookOpen className="text-coral" size={40} strokeWidth={1.5} />
          )}
        </div>

        <CardContent className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          <h2 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-[1.45] text-coal sm:min-h-[46px] sm:text-base">
            {ebook.title}
          </h2>
          <p className="mt-1.5 line-clamp-1 text-xs text-ink-muted sm:text-sm">
            {ebook.author || "Chưa nhập tác giả"}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="rounded-md bg-cream-soft px-2 py-1 text-[10px] font-semibold uppercase text-ink-muted sm:text-xs">
                {ebook.format || "ebook"}
              </span>
              {ebook.level ? (
                <span className="rounded-md bg-coral/10 px-2 py-1 text-[10px] font-semibold text-coral-dark sm:text-xs">
                  {ebook.level}
                </span>
              ) : null}
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition group-hover:bg-coral group-hover:text-white">
              <ArrowUpRight size={16} />
            </span>
          </div>
        </CardContent>
      </Card>
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
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
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
