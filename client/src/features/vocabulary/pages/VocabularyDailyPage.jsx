import { BookOpenText, CheckCircle2, ChevronRight, Layers3, Settings2 } from "lucide-react";
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
      className: "bg-[#eef9e8] text-[#2f7d12]",
      iconClassName: "bg-[#58cc02] text-white",
      barClassName: "bg-[#58cc02]",
    };
  }

  if (completion.completedCount > 0) {
    return {
      badge: "Đang học",
      className: "bg-[#fff3dc] text-[#9a5a00]",
      iconClassName: "bg-amber-100 text-amber-700",
      barClassName: "bg-amber-500",
    };
  }

  return {
    badge: "Chưa học",
    className: "bg-white/70 text-ink-muted",
    iconClassName: "bg-cream-soft text-coral",
    barClassName: "bg-coral",
  };
}

const lessonCardThemes = [
  {
    accent: "#f59e0b",
    soft: "linear-gradient(135deg, #fff8e8 0%, #ffe9bd 100%)",
    border: "#f3d79c",
    icon: "bg-[#fff4d5] text-[#b77900]",
    bar: "bg-[#f59e0b]",
  },
  {
    accent: "#14b8a6",
    soft: "linear-gradient(135deg, #effdfa 0%, #c7f3eb 100%)",
    border: "#a9e4da",
    icon: "bg-[#dcfbf5] text-[#0f766e]",
    bar: "bg-[#14b8a6]",
  },
  {
    accent: "#8b5cf6",
    soft: "linear-gradient(135deg, #f7f2ff 0%, #ded3ff 100%)",
    border: "#d2c3fb",
    icon: "bg-[#eee7ff] text-[#6d43d6]",
    bar: "bg-[#8b5cf6]",
  },
  {
    accent: "#ef6461",
    soft: "linear-gradient(135deg, #fff5f2 0%, #ffd6d2 100%)",
    border: "#f1bab4",
    icon: "bg-[#ffe6e4] text-[#c2413f]",
    bar: "bg-[#ef6461]",
  },
  {
    accent: "#1cb0f6",
    soft: "linear-gradient(135deg, #f0f9ff 0%, #cdeeff 100%)",
    border: "#b7e0f7",
    icon: "bg-[#e2f5ff] text-[#0b84c6]",
    bar: "bg-[#1cb0f6]",
  },
];

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
          {displayLessons.map((day, dayIndex) => {
            const completion = getDayCompletion(progress, day.id, lessonTypes);
            const meta = getCompletionMeta(completion);
            const theme = lessonCardThemes[dayIndex % lessonCardThemes.length];
            const completionPercent = Math.round((completion.completedCount / completion.totalCount) * 100);
            const iconClassName = completion.isCompleted ? meta.iconClassName : theme.icon;

            return (
              <button
                className="group w-full rounded-[1.35rem] border border-[#e8e1db] bg-white p-2 text-left shadow-[0_18px_44px_rgba(24,18,12,0.07)] transition hover:-translate-y-0.5 hover:border-[#ded4c9] hover:shadow-[0_22px_54px_rgba(24,18,12,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 sm:p-3"
                key={day.id}
                onClick={() => navigate(`/vocabulary/${day.id}`)}
                type="button"
              >
                <span className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <span className="flex min-h-[168px] min-w-0 gap-3 rounded-[1rem] bg-[#fffdf9] p-4 sm:min-h-44 sm:gap-4 sm:p-6">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-12 sm:w-12 ${iconClassName}`}>
                      {completion.isCompleted ? <CheckCircle2 size={23} /> : <BookOpenText size={22} />}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-display text-2xl font-semibold leading-tight text-coal sm:text-3xl">{day.title}</span>
                          <span className="mt-2 block max-w-xl text-sm font-medium leading-6 text-ink-muted sm:text-[15px]">{day.subtitle}</span>
                        </span>
                        <ChevronRight className="mt-1 shrink-0 text-ink-muted transition group-hover:translate-x-1" size={22} style={{ color: completion.completedCount > 0 ? theme.accent : undefined }} />
                      </span>

                      <span className="mt-auto block h-2 w-24 rounded-full" style={{ backgroundColor: theme.accent }} />
                    </span>
                  </span>

                  <span
                    className="relative grid min-h-[96px] grid-cols-3 items-center gap-2 overflow-hidden rounded-[1rem] border p-3 sm:min-h-32 sm:p-5 lg:grid-cols-1"
                    style={{ background: theme.soft, borderColor: theme.border }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/35"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/20"
                    />
                    <span className="relative flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl">
                        <CheckCircle2 size={20} style={{ color: completion.isCompleted ? "#2f7d12" : theme.accent }} />
                      </span>
                      <span>
                        <span className="block text-lg font-black leading-none text-coal sm:text-2xl">{completionPercent}%</span>
                        <span className="mt-1 block text-xs font-bold text-ink-muted">Tiến độ</span>
                      </span>
                    </span>
                    <span className="relative flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left lg:mt-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/75 shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl">
                        <Layers3 size={19} style={{ color: theme.accent }} />
                      </span>
                      <span>
                        <span className="block text-lg font-black leading-none text-coal sm:text-2xl">{completion.completedCount}/{completion.totalCount}</span>
                        <span className="mt-1 block text-xs font-bold text-ink-muted">Bài xong</span>
                      </span>
                    </span>
                    <span className={`relative inline-flex justify-center rounded-full px-2.5 py-1.5 text-center text-[11px] font-black sm:w-fit sm:px-3 sm:text-xs lg:mt-4 ${meta.className}`}>{meta.badge}</span>
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
