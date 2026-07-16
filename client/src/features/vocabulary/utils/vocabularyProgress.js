const progressKey = "meomeo:vocabulary-progress";

const defaultProgress = {
  completedLessons: {},
  streak: 0,
  lastCompletedDate: "",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function readVocabularyProgress() {
  try {
    const raw = window.localStorage.getItem(progressKey);
    if (!raw) return defaultProgress;
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
}

export function writeVocabularyProgress(progress) {
  window.localStorage.setItem(progressKey, JSON.stringify(progress));
  return progress;
}

export function isVocabularyLessonCompleted(progress, dayId, lessonId) {
  return Boolean(progress.completedLessons?.[dayId]?.[lessonId]);
}

export function completeVocabularyLesson(dayId, lessonId) {
  const current = readVocabularyProgress();
  const today = todayKey();
  const next = {
    ...current,
    completedLessons: {
      ...current.completedLessons,
      [dayId]: {
        ...(current.completedLessons?.[dayId] || {}),
        [lessonId]: true,
      },
    },
    streak: current.lastCompletedDate === today ? current.streak : current.streak + 1,
    lastCompletedDate: today,
  };

  return writeVocabularyProgress(next);
}

export function getDayCompletion(progress, dayId, lessonTypes) {
  const completedCount = lessonTypes.filter((lesson) => isVocabularyLessonCompleted(progress, dayId, lesson.id)).length;
  return {
    completedCount,
    totalCount: lessonTypes.length,
    isCompleted: completedCount === lessonTypes.length,
  };
}
