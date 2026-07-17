import { ArrowLeft, BookOpenText, Check, ChevronRight, Headphones, Layers3, PencilLine } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { lessonTypes } from "../data/dailyVocabulary.js";
import { getDayCompletion, isVocabularyLessonCompleted, readVocabularyProgress } from "../utils/vocabularyProgress.js";
import { useVocabularyCourseData } from "../hooks/useVocabularyPublic.js";
import { LoadingState } from "../../../components/ui/spinner.jsx";

const lessonIconMap = {
  flashcards: Layers3,
  "match-meaning": BookOpenText,
  "listening-fill": Headphones,
  "cloze-quiz": PencilLine,
};

function LessonNode({ day, index, lesson, progress }) {
  const navigate = useNavigate();
  const Icon = lessonIconMap[lesson.id] || BookOpenText;
  const isCompleted = isVocabularyLessonCompleted(progress, day.id, lesson.id);
  const previousLessons = lessonTypes.slice(0, index);
  const isCurrent = !isCompleted && previousLessons.every((item) => isVocabularyLessonCompleted(progress, day.id, item.id));
  const statusLabel = isCompleted ? "Hoàn thành" : isCurrent ? "Đang học" : "Chưa học";
  const statusClassName = isCompleted
    ? "bg-emerald-50 text-emerald-700"
    : isCurrent
      ? "bg-coral/10 text-coral-dark"
      : "bg-cream-soft text-ink-muted";
  const iconClassName = isCompleted
    ? "bg-emerald-600 text-white"
    : isCurrent
      ? "bg-coral text-white"
      : "bg-cream-soft text-ink-muted";

  return (
    <button
      className={`group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(20,20,19,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 sm:gap-4 sm:p-5 ${isCurrent ? "border-coral/35 bg-coral/5 hover:border-coral/55" : "border-[#e6dfd8] bg-canvas hover:border-[#d2c9be]"}`}
      onClick={() => navigate(`/vocabulary/${day.id}/${lesson.id}`)}
      type="button"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${iconClassName}`}>
        {isCompleted ? <Check size={22} strokeWidth={2.8} /> : <Icon size={21} strokeWidth={2.2} />}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted sm:text-xs">Bài {index + 1}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${statusClassName}`}>{statusLabel}</span>
        </span>
        <span className="mt-1.5 block text-base font-semibold leading-tight text-coal sm:text-lg">{lesson.title}</span>
        <span className="mt-1 hidden text-sm leading-5 text-ink-muted sm:block">{lesson.description}</span>
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e6dfd8] text-ink-muted transition group-hover:border-coral/30 group-hover:bg-coral group-hover:text-white">
        <ChevronRight size={18} />
      </span>
    </button>
  );
}

export default function VocabularyDayPathPage() {
  const { dayId } = useParams();
  const { day, isLoading } = useVocabularyCourseData(dayId);
  const [progress, setProgress] = useState(() => readVocabularyProgress());
  const navigate = useNavigate();

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

  if (isLoading) return <LoadingState className="min-h-[60vh]" label="Đang tải bài học..." />;
  if (!day) return <Navigate to="/vocabulary" replace />;

  const completion = getDayCompletion(progress, day.id, lessonTypes);
  const completionPercent = Math.round((completion.completedCount / completion.totalCount) * 100);

  return (
    <section className="min-h-full bg-canvas px-4 py-6 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="border-b border-[#e6dfd8] pb-6 sm:pb-8">
          <Button className="mb-4 px-0 text-ink-muted hover:bg-transparent hover:text-coal" onClick={() => navigate("/vocabulary")} size="sm" type="button" variant="ghost">
            <ArrowLeft size={16} /> Danh sách bài học
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-coal sm:text-4xl">{day.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted sm:text-[15px]">{day.subtitle}</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${completion.isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-cream-soft text-ink-body"}`}>
              {completion.completedCount}/{completion.totalCount} bài
            </span>
          </div>
          <div className="mt-6 sm:mt-8">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-muted">
              <span>Tiến độ</span>
              <span>{completionPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-cream-soft">
              <div className={`h-full rounded-full transition-[width] duration-500 ${completion.isCompleted ? "bg-emerald-600" : "bg-coral"}`} style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-3xl gap-3 pb-12 pt-6 sm:pt-8">
          {lessonTypes.map((lesson, index) => (
            <LessonNode day={day} index={index} key={`${day.id}-${lesson.id}`} lesson={lesson} progress={progress} />
          ))}
          {completion.isCompleted ? (
            <div className="mt-1 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <Check className="mr-2 inline" size={15} strokeWidth={2.8} />
              Bài học đã hoàn thành.
            </div>
          ) : (
            <p className="mt-2 text-center text-xs leading-5 text-ink-muted sm:text-sm">
              Hoàn thành đủ 4 bài để đánh dấu bài học này là hoàn thành.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
