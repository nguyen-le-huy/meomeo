import { ArrowLeft, BookOpenText, Check, ChevronRight, Circle, Headphones, Layers3, PencilLine, Play, Trophy } from "lucide-react";
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
    ? "bg-[#eef9e8] text-[#2f7d12]"
    : isCurrent
      ? "bg-coral text-white"
      : "bg-cream-soft text-ink-muted";
  const iconClassName = isCompleted
    ? "border-[#44a900] bg-[#58cc02] text-white shadow-[0_5px_0_#44a900]"
    : isCurrent
      ? "border-[#d86b42] bg-coral text-white shadow-[0_5px_0_#a9583e]"
      : "border-[#e6dfd8] bg-canvas text-ink-muted";

  return (
    <button
      className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-[#e6dfd8] bg-canvas p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-coral/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 sm:p-5"
      onClick={() => navigate(`/vocabulary/${day.id}/${lesson.id}`)}
      type="button"
    >
      <span className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 ${iconClassName}`}>
        {isCompleted ? <Check size={25} strokeWidth={3.2} /> : isCurrent ? <Play size={21} fill="currentColor" /> : <Icon size={22} strokeWidth={2.4} />}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wide text-coral">Bài {index + 1}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClassName}`}>{statusLabel}</span>
        </span>
        <span className="mt-2 block font-display text-xl font-semibold leading-tight text-coal">{lesson.title}</span>
        <span className="mt-1 block text-sm font-medium leading-5 text-ink-muted">{lesson.description}</span>
      </span>

      <ChevronRight className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-coral" size={20} />
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
        <div className="rounded-lg border border-[#e6dfd8] bg-canvas p-4 shadow-sm sm:p-6">
          <Button className="mb-3 px-0" onClick={() => navigate("/vocabulary")} size="sm" type="button" variant="ghost">
            <ArrowLeft size={16} /> Danh sách bài học
          </Button>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold text-coal sm:text-4xl">{day.title}</h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-ink-muted">{day.subtitle}</p>
            </div>
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${completion.isCompleted ? "bg-[#58cc02] text-white" : "bg-cream-soft text-coral"}`}>
              {completion.isCompleted ? <Trophy size={27} /> : <span className="text-base font-black">{completion.completedCount}/{completion.totalCount}</span>}
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-ink-muted">
              <span>Tiến độ bài học</span>
              <span>{completionPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-cream-soft">
              <div className={`h-full rounded-full ${completion.isCompleted ? "bg-[#58cc02]" : "bg-coral"}`} style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-3xl gap-4 pb-12 pt-8">
          <div className="absolute bottom-16 left-7 top-14 hidden w-px bg-[#e6dfd8] sm:block" />
          {lessonTypes.map((lesson, index) => (
            <LessonNode day={day} index={index} key={`${day.id}-${lesson.id}`} lesson={lesson} progress={progress} />
          ))}
          {completion.isCompleted ? (
            <div className="rounded-lg border border-[#b7e8a0] bg-[#f0ffe9] p-4 text-sm font-bold text-[#2d7b00] sm:ml-[4.5rem]">
              <Check className="mr-2 inline" size={15} strokeWidth={3} />
              Bài học đã hoàn thành.
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#e6dfd8] bg-cream-soft p-4 text-sm font-semibold text-ink-muted sm:ml-[4.5rem]">
              <Circle className="mr-2 inline text-coral" size={12} fill="currentColor" />
              Hoàn thành đủ 4 bài để đánh dấu bài học này là hoàn thành.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
