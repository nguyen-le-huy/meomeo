import { ArrowUpRight, BookOpenText, Clock3, Settings2 } from "lucide-react";

function ReadingMeta({ lesson }) {
  return (
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
  );
}

function ReadingTags({ lesson }) {
  const tags = [lesson.level, lesson.durationLabel].filter(Boolean);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-full border border-coal/70 px-2.5 py-0.5 text-xs font-semibold leading-5 text-coal"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export default function LatestReadingCard({ lesson, lessons = [], onManage, onOpen }) {
  const readingItems = (lessons.length > 0 ? lessons : lesson ? [lesson] : []).filter(Boolean);
  const primaryLesson = readingItems[0] || null;
  const secondaryLessons = readingItems.slice(1, 4);

  if (!primaryLesson && !onManage) return null;

  function openLesson(selectedLesson) {
    if (!selectedLesson) return;
    onOpen?.(selectedLesson);
  }

  return (
    <section className="border-b border-[#e6dfd8] py-8 sm:py-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Blog hôm nay</p>
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
            <Settings2 size={16} /> Quản lý blog
          </button>
        ) : null}
      </div>

      {!primaryLesson ? (
        <div className="rounded-lg border border-dashed border-[#d8d0c6] bg-cream-soft p-5">
          <p className="text-sm font-semibold text-ink-muted">Chưa có bài viết nào được xuất bản.</p>
          <button
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-[#d8d0c6] bg-canvas px-4 text-sm font-semibold transition hover:bg-white"
            onClick={onManage}
            type="button"
          >
            <Settings2 size={16} /> Quản lý blog
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(220px,0.55fr)_minmax(250px,0.68fr)] lg:grid-rows-3 lg:gap-x-6 lg:gap-y-5">
          <article className="group min-w-0 lg:row-span-3">
            <button
              className="block w-full overflow-hidden rounded-lg bg-cream-soft text-left shadow-sm"
              onClick={() => openLesson(primaryLesson)}
              type="button"
            >
              <img
                alt={primaryLesson.title}
                className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.03] lg:aspect-[16/11]"
                src={primaryLesson.imageUrl}
              />
            </button>

            <div className="mt-4 lg:mt-5">
              <p className="text-xs font-semibold text-coal">
                {primaryLesson.author || "Meo Meo English"} • {primaryLesson.displayDate}
              </p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <button className="text-left" onClick={() => openLesson(primaryLesson)} type="button">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-coal transition group-hover:text-coral lg:line-clamp-none lg:text-2xl lg:leading-tight xl:text-3xl">
                    {primaryLesson.title}
                  </h3>
                </button>
                <button
                  aria-label={`Mở bài đọc ${primaryLesson.title}`}
                  className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-coal transition hover:bg-cream lg:inline-flex"
                  onClick={() => openLesson(primaryLesson)}
                  type="button"
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm font-medium leading-6 text-ink-body lg:mt-3">
                {primaryLesson.summary}
              </p>
              <ReadingTags lesson={primaryLesson} />
            </div>
          </article>

          {secondaryLessons.length > 0 ? (
            secondaryLessons.map((item) => (
              <article className="group grid gap-4 md:grid-cols-[220px_1fr] lg:contents" key={item._id || item.slug}>
                <button
                  className="block overflow-hidden rounded-lg bg-cream-soft text-left shadow-sm lg:col-start-2"
                  onClick={() => openLesson(item)}
                  type="button"
                >
                  <img
                    alt={item.title}
                    className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.03] lg:h-full lg:min-h-[145px]"
                    src={item.imageUrl}
                  />
                </button>
                <div className="min-w-0 self-start lg:col-start-3">
                  <p className="text-xs font-semibold text-coal">
                    {item.author || "Meo Meo English"} • {item.displayDate}
                  </p>
                  <button className="mt-2 text-left" onClick={() => openLesson(item)} type="button">
                    <h3 className="line-clamp-2 text-lg font-bold leading-snug text-coal transition group-hover:text-coral">
                      {item.title}
                    </h3>
                  </button>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-ink-body">
                    {item.summary}
                  </p>
                  <ReadingTags lesson={item} />
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-lg border border-dashed border-[#d8d0c6] bg-cream-soft p-5 lg:col-span-2 lg:row-span-3">
              <ReadingMeta lesson={primaryLesson} />
              <p className="mt-4 text-sm font-semibold leading-6 text-ink-muted">
                Xuất bản thêm bài viết để hiển thị đầy đủ danh sách mới nhất.
              </p>
            </article>
          )}

          {onManage ? (
            <button
              className="inline-flex h-10 items-center justify-between gap-2 rounded-lg border border-[#d8d0c6] px-4 text-sm font-semibold transition hover:bg-cream-soft sm:hidden"
              onClick={onManage}
              type="button"
            >
              Quản lý blog
              <Settings2 size={16} />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
