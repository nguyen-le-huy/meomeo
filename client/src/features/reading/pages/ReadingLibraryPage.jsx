import { ArrowDown, BookOpenText, Clock3, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { useReadings } from "../hooks/useReadings.js";
import { normalizeReading } from "../utils/readingFormat.js";

const pageSize = 5;

function ReadingCard({ reading, onOpen }) {
  return (
    <Card className="overflow-hidden shadow-sm transition hover:border-coral/45">
      <CardContent className="grid gap-4 p-4 md:grid-cols-[220px_1fr] md:items-center">
        <button
          className="overflow-hidden rounded-lg bg-cream-soft text-left"
          onClick={() => onOpen(reading)}
          type="button"
        >
          <img
            alt={reading.title}
            className="aspect-[16/10] w-full object-cover transition duration-300 hover:scale-[1.03]"
            src={reading.imageUrl}
          />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-coal">
              <BookOpenText size={14} />
              {reading.level}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-coal">
              <Clock3 size={14} />
              {reading.durationLabel}
            </span>
            <span>{reading.displayDate}</span>
          </div>
          <button className="mt-3 text-left" onClick={() => onOpen(reading)} type="button">
            <h2 className="line-clamp-2 text-xl font-bold leading-snug text-coal transition hover:text-coral md:text-2xl">
              {reading.title}
            </h2>
          </button>
          <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-ink-body">{reading.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReadingLibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { data: readings = [], isLoading, isError, error } = useReadings({ includeUnpublished: isAdmin || undefined });
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const readingLessons = useMemo(() => readings.map(normalizeReading).filter(Boolean), [readings]);
  const visibleReadings = readingLessons.slice(0, visibleCount);
  const hasMore = visibleCount < readingLessons.length;

  return (
    <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e6dfd8] pb-6">
          <div>
            <p className="eyebrow">Luyện đọc</p>
            <h1 className="mt-2 font-display text-3xl font-normal tracking-tight sm:text-4xl">Tất cả bài đọc</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-muted">
              Chọn bài đọc, luyện hiểu nội dung và trả lời câu hỏi theo từng bài.
            </p>
          </div>
          {isAdmin ? (
            <Button onClick={() => navigate("/admin/readings")} type="button" variant="outline">
              <Settings2 size={16} /> Quản lý bài đọc
            </Button>
          ) : null}
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
          <div className="mt-8 grid gap-4">
            {visibleReadings.map((reading) => (
              <ReadingCard
                key={reading._id || reading.slug}
                onOpen={(selectedReading) => navigate(`/reading/${selectedReading.slug}`)}
                reading={reading}
              />
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <Button
              className="min-w-44"
              onClick={() => setVisibleCount((count) => Math.min(count + pageSize, readingLessons.length))}
              type="button"
              variant="outline"
            >
              Xem thêm <ArrowDown size={16} />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
