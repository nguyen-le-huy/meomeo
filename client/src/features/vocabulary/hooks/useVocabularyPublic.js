import { useQuery } from "@tanstack/react-query";
import { getVocabularyDay } from "../data/dailyVocabulary.js";
import * as api from "../services/vocabularyPublicApi.js";

function stripReconstructionInstruction(value) {
  const text = String(value || "").trim();
  const match = text.match(/^reconstruct the sentence:\s*(.+?)(?:\s*\(.*?\))?\.?$/i);
  return match ? match[1].trim() : text;
}

function isLikelySingleTerm(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length <= 3;
}

export function usePublishedVocabularyCourses() {
  return useQuery({
    queryKey: ["published-vocabulary-courses"],
    queryFn: async () => (await api.getPublishedVocabularyCourses()).data.data.items,
    retry: false,
  });
}

export function useVocabularyCourseData(courseId, lessonId) {
  const staticDay = getVocabularyDay(courseId);
  const query = useQuery({
    enabled: Boolean(courseId && !staticDay),
    queryKey: ["published-vocabulary-course", courseId],
    queryFn: async () => {
      const [courseResponse, itemsResponse, exercisesResponse] = await Promise.all([
        api.getPublishedVocabularyCourse(courseId),
        api.getPublishedVocabularyItems(courseId),
        api.getPublishedVocabularyExercises(courseId),
      ]);
      return {
        course: courseResponse.data.data.course,
        items: itemsResponse.data.data.items,
        exercises: exercisesResponse.data.data.exercises,
      };
    },
    retry: false,
  });

  if (staticDay) return { day: staticDay, isLoading: false, isError: false };
  if (!query.data) return { day: null, isLoading: query.isLoading, isError: query.isError };

  const { course, items, exercises } = query.data;
  const exercise = exercises.find((item) => item.lessonKey === lessonId);
  let words = items.map((item) => ({
    word: item.word,
    meaning: item.meaningVi,
    phonetic: item.phonetic,
    example: item.example,
    translation: item.exampleMeaningVi,
    collocations: item.collocations || [],
    audioUrl: item.audioUrl,
    exampleAudioUrl: item.exampleAudioUrl,
  }));

  if (exercise?.questions?.length && lessonId === "listening-fill") {
    words = exercise.questions.slice(0, items.length).map((question, index) => {
      const cleanPrompt = stripReconstructionInstruction(question.prompt);
      const sourceItem = items[index];
      const shouldUseExampleSentence = sourceItem?.example && sourceItem?.exampleMeaningVi && (isLikelySingleTerm(cleanPrompt) || isLikelySingleTerm(question.answer));

      if (shouldUseExampleSentence) {
        return index % 2 === 0
          ? { word: sourceItem.word, meaning: "", phonetic: "", example: sourceItem.example, translation: sourceItem.exampleMeaningVi, collocations: [], audioUrl: "", exampleAudioUrl: "" }
          : { word: sourceItem.word, meaning: "", phonetic: "", example: sourceItem.exampleMeaningVi, translation: sourceItem.example, collocations: [], audioUrl: "", exampleAudioUrl: "" };
      }

      return index % 2 === 0
        ? { word: question.answer, meaning: "", phonetic: "", example: question.answer, translation: cleanPrompt, collocations: [], audioUrl: "", exampleAudioUrl: "" }
        : { word: question.answer, meaning: "", phonetic: "", example: cleanPrompt, translation: question.answer, collocations: [], audioUrl: "", exampleAudioUrl: "" };
    });
  }
  if (exercise?.questions?.length && lessonId === "cloze-quiz") {
    words = exercise.questions.slice(0, items.length).map((question) => ({ word: question.answer, meaning: "", phonetic: "", example: question.prompt, translation: question.translation, collocations: [], audioUrl: question.audioUrl || "", exampleAudioUrl: question.audioUrl || "" }));
  }

  return {
    day: { id: course._id, title: course.title, subtitle: course.description, words, lessons: course.lessons },
    isLoading: false,
    isError: false,
  };
}
