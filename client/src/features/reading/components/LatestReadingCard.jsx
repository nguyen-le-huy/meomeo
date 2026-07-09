import { ArrowRight, BookOpenText, Clock3, Settings2 } from "lucide-react";

export default function LatestReadingCard({ lesson, onManage, onOpen }) {
  if (!lesson && !onManage) return null;

  return (
    <section className="border-b border-[#e6dfd8] py-6 sm:py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Luyện đọc hôm nay</p>
          <h2 className="mt-2 font-display text-2xl font-normal tracking-normal text-coal sm:text-3xl">
            Bài đọc mới nhất
          </h2>
        </div>
        {onManage ? (
          <button
            className="hidden h-10 items-center gap-2 rounded-lg border border-[#d8d0c6] px-3 text-sm font-semibold transition hover:bg-cream-soft sm:inline-flex"
            onClick={onManage}
            type="button"
          >
            <Settings2 size={16} /> Quản lý bài đọc
          </button>
        ) : null}
      </div>

      {!lesson ? (
        <div className="rounded-lg border border-dashed border-[#d8d0c6] bg-cream-soft p-5">
          <p className="text-sm font-semibold text-ink-muted">Chưa có bài đọc public trên home.</p>
          <button
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-[#d8d0c6] bg-canvas px-4 text-sm font-semibold transition hover:bg-white"
            onClick={onManage}
            type="button"
          >
            <Settings2 size={16} /> Quản lý bài đọc
          </button>
        </div>
      ) : (

        <div
          className="group grid w-full overflow-hidden rounded-lg border border-[#d8d0c6] bg-canvas text-left shadow-sm transition hover:border-coral/50 hover:shadow-md md:grid-cols-[minmax(260px,0.48fr)_1fr]"
          role="presentation"
        >
          <button className="relative aspect-[16/10] overflow-hidden bg-cream-soft text-left md:aspect-auto md:min-h-[220px]" onClick={onOpen} type="button">
            <img
              alt={lesson.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              src={lesson.imageUrl}
            />
          </button>

          <div className="flex min-w-0 flex-col p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
              <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-coal">
                <BookOpenText size={14} />
                {lesson.level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-coal">
                <Clock3 size={14} />
                {lesson.durationLabel}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-semibold leading-tight text-coal sm:text-3xl">
              {lesson.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-ink-body sm:text-base">
              {lesson.summary}
            </p>

            <div className="mt-5 border-t border-[#e6dfd8] pt-4">
              <button
                className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-coral px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-coral-dark sm:w-auto"
                onClick={onOpen}
                type="button"
              >
                Luyện đọc
                <ArrowRight size={16} />
              </button>
              {onManage ? (
                <button
                  className="mt-2 inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#d8d0c6] px-4 text-sm font-semibold transition hover:bg-cream-soft sm:hidden"
                  onClick={onManage}
                  type="button"
                >
                  Quản lý bài đọc
                  <Settings2 size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
