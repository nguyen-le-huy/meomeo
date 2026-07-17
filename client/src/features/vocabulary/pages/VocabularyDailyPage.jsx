import { BookOpenText, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lessonTypes, vocabularyDays } from "../data/dailyVocabulary.js";
import { getDayCompletion, readVocabularyProgress } from "../utils/vocabularyProgress.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { Button } from "../../../components/ui/button.jsx";
import { usePublishedVocabularyCourses } from "../hooks/useVocabularyPublic.js";

function getCompletionMeta(completion) {
  if (completion.isCompleted) {
    return {
      badge: "Hoàn thành",
      badgeClassName: "bg-emerald-50 text-emerald-700",
      iconClassName: "bg-emerald-600 text-white",
      barClassName: "bg-emerald-600",
    };
  }

  if (completion.completedCount > 0) {
    return {
      badge: "Đang học",
      badgeClassName: "bg-amber-50 text-amber-700",
      iconClassName: "bg-amber-100 text-amber-700",
      barClassName: "bg-amber-500",
    };
  }

  return {
    badge: "Chưa học",
    badgeClassName: "bg-cream-soft text-ink-muted",
    iconClassName: "bg-cream-soft text-coral",
    barClassName: "bg-coral",
  };
}

export default function VocabularyDailyPage() {
  const [progress, setProgress] = useState(() => readVocabularyProgress());
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: publishedCourses = [] } = usePublishedVocabularyCourses();
  const displayLessons = publishedCourses.length
    ? publishedCourses.map((course) => ({ id: course._id, title: course.title, subtitle: course.description || "Bài học từ vựng", words: [] }))
    : vocabularyDays;

  useEffect(() => {
    const handleProgressRefresh = () => setProgress(readVocabularyProgress());
    const handleVisibilityChange = () => {
      if (!document.hidden) handleProgressRefresh();
    };

    handleProgressRefresh();
    window.addEventListener("storage", handleProgressRefresh);
    window.addEventListener("focus", handleProgressRefresh);
    window.addEventListener("pageshow", handleProgressRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleProgressRefresh);
      window.removeEventListener("focus", handleProgressRefresh);
      window.removeEventListener("pageshow", handleProgressRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e6dfd8] pb-6">
          <div>
            <h1 className="mt-2 font-display text-3xl font-normal tracking-normal sm:text-4xl">Từ vựng mỗi ngày</h1>
          </div>
          {user?.role === "admin" ? <Button onClick={() => navigate("/admin/vocabulary")} type="button" variant="outline"><Settings2 size={16} /> Quản lý bài học</Button> : null}
        </div>

        <div className="mt-8 grid gap-5">
          {displayLessons.map((day) => {
            const completion = getDayCompletion(progress, day.id, lessonTypes);
            const meta = getCompletionMeta(completion);
            const completionPercent = Math.round((completion.completedCount / completion.totalCount) * 100);

            return (
              <button
                className="group w-full rounded-lg border border-[#e6dfd8] bg-canvas p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#d2c9be] hover:shadow-[0_12px_30px_rgba(20,20,19,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 sm:p-6"
                key={day.id}
                onClick={() => navigate(`/vocabulary/${day.id}`)}
                type="button"
              >
                <span className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${meta.iconClassName}`}>
                    {completion.isCompleted ? <CheckCircle2 size={22} /> : <BookOpenText size={21} />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-xl font-semibold leading-tight text-coal sm:text-2xl">{day.title}</span>
                        <span className="mt-1.5 block max-w-2xl text-sm leading-5 text-ink-muted sm:text-[15px] sm:leading-6">{day.subtitle}</span>
                      </span>

                      <span className="hidden shrink-0 items-center gap-8 sm:flex">
                        <span>
                          <span className="block text-lg font-semibold leading-none text-coal">{completionPercent}%</span>
                          <span className="mt-1.5 block text-xs text-ink-muted">Tiến độ</span>
                        </span>
                        <span>
                          <span className="block text-lg font-semibold leading-none text-coal">{completion.completedCount}/{completion.totalCount}</span>
                          <span className="mt-1.5 block text-xs text-ink-muted">Bài hoàn thành</span>
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dfd8] text-ink-muted transition group-hover:border-coral/30 group-hover:bg-coral group-hover:text-white">
                          <ChevronRight size={18} />
                        </span>
                      </span>
                    </span>

                    <span className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${meta.badgeClassName}`}>
                        {meta.badge}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted sm:hidden">
                        {completion.completedCount}/{completion.totalCount} bài · {completionPercent}%
                      </span>
                    </span>

                    <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-cream-soft">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-500 ${meta.barClassName}`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
