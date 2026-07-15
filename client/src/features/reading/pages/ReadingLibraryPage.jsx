import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import LatestReadingCard from "../components/LatestReadingCard.jsx";
import { useReadings } from "../hooks/useReadings.js";
import { normalizeReading } from "../utils/readingFormat.js";

const pageSize = 9;
const latestReadingCount = 4;

function ReadingCard({ reading, onOpen }) {
  const tags = [reading.level, reading.durationLabel].filter(Boolean);

  return (
    <article className="group flex min-w-0 flex-col">
      <button className="block w-full overflow-hidden bg-cream-soft text-left" onClick={() => onOpen(reading)} type="button">
        <img alt={reading.title} className="aspect-[3/2] w-full object-cover transition duration-300 group-hover:scale-[1.025]" src={reading.imageUrl} />
      </button>
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-ink-muted">
          <span className="truncate text-coal">{reading.author || "Meo Meo English"}</span>
          <span aria-hidden="true">•</span>
          <span>{reading.displayDate}</span>
          {!reading.isPublished ? <span className="ml-auto rounded-sm bg-coral px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Bản nháp</span> : null}
        </div>
        <button className="mt-2 text-left" onClick={() => onOpen(reading)} type="button">
          <h2 className="line-clamp-2 text-xl font-bold leading-[1.2] text-coal transition group-hover:text-coral">{reading.title}</h2>
        </button>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-ink-body">{reading.summary}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {tags.map((tag) => <span className="rounded-full border border-coal/65 px-2 py-0.5 text-[11px] font-semibold leading-4 text-coal" key={tag}>{tag}</span>)}
        </div>
      </div>
    </article>
  );
}

export default function ReadingLibraryPage() {
  const navigate = useNavigate();
  const listTopRef = useRef(null);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { data: readings = [], isLoading, isError, error } = useReadings({ includeUnpublished: isAdmin || undefined });
  const [currentPage, setCurrentPage] = useState(1);
  const readingLessons = useMemo(() => readings.map(normalizeReading).filter(Boolean), [readings]);
  const latestReadingLessons = readingLessons.slice(0, latestReadingCount);
  const remainingReadingLessons = readingLessons.slice(latestReadingCount);
  const totalPages = Math.max(1, Math.ceil(remainingReadingLessons.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleReadings = remainingReadingLessons.slice(pageStart, pageStart + pageSize);

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
      <div className="mx-auto max-w-[1440px]">
        {!isLoading && !isError && (readingLessons.length || isAdmin) ? (
          <LatestReadingCard
            lessons={latestReadingLessons}
            onManage={isAdmin ? () => navigate("/admin/readings") : undefined}
            onOpen={(readingLesson) => navigate(`/reading/${readingLesson.slug}`)}
          />
        ) : null}

        <div className="scroll-mt-16 flex flex-wrap items-end justify-between gap-4 pb-6 pt-8 md:scroll-mt-20" ref={listTopRef}>
          <div>
            <p className="eyebrow">Blog</p>
            <h1 className="mt-2 font-display text-3xl font-normal tracking-tight sm:text-4xl">Tất cả bài đọc</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-muted">
              Chọn bài đọc, luyện hiểu nội dung và trả lời câu hỏi theo từng bài.
            </p>
          </div>
        </div>

        {isLoading ? <LoadingState className="mt-8" label="Đang tải bài đọc..." /> : null}
        {isError ? (
          <p className="mt-8 text-sm font-semibold text-red-700">
            {error?.response?.data?.message || "Không tải được bài đọc."}
          </p>
        ) : null}

        {!isLoading && !isError && !readingLessons.length ? (
          <Card className="mt-8 border-dashed bg-cream-soft">
            <CardContent className="p-8 text-center text-sm font-semibold text-ink-muted">
              Chưa có bài đọc public.
            </CardContent>
          </Card>
        ) : null}

        {visibleReadings.length ? (
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
            {visibleReadings.map((reading) => (
              <ReadingCard
                key={reading._id || reading.slug}
                onOpen={(selectedReading) => navigate(`/reading/${selectedReading.slug}`)}
                reading={reading}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && readingLessons.length > 0 && !remainingReadingLessons.length ? (
          <Card className="mt-8 border-dashed bg-cream-soft">
            <CardContent className="p-8 text-center text-sm font-semibold text-ink-muted">
              Chưa có thêm bài đọc.
            </CardContent>
          </Card>
        ) : null}

        {remainingReadingLessons.length > pageSize ? (
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
