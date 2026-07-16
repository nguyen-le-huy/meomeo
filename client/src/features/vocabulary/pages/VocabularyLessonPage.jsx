import { ArrowLeft, Check, RotateCcw, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { getLessonType, lessonTypes } from "../data/dailyVocabulary.js";
import { completeVocabularyLesson } from "../utils/vocabularyProgress.js";
import { useVocabularyCourseData } from "../hooks/useVocabularyPublic.js";
import { LoadingState } from "../../../components/ui/spinner.jsx";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function playLearningAudio(text, audioUrl) {
  if (!audioUrl) return speak(text);
  const audio = new Audio(audioUrl);
  audio.volume = 1;
  audio.play().catch(() => speak(text));
}

function getNextLesson(dayId, lessonId) {
  const index = lessonTypes.findIndex((lesson) => lesson.id === lessonId);
  return lessonTypes[index + 1] ? `/vocabulary/${dayId}/${lessonTypes[index + 1].id}` : "/vocabulary";
}

const MATCH_REPETITIONS = 3;
const MATCH_ROUND_SIZE = 3;
const CORRECT_SOUND_URL = "https://res.cloudinary.com/dq6rydlgi/video/upload/v1784197327/ElevenLabs_Gentle_ding_for_saved_settings_confirmation_kafunf.mp3";
const LESSON_CHARACTER_GIF_URL = "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2R4Y3lpaDA4OHlmMmw4MHJwYmExOGtndXF2NmJkajBxb2xndGNwcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/lfHhjolWxCtpHTWvIV/giphy.gif";

function playCorrectSound() {
  const audio = new Audio(CORRECT_SOUND_URL);
  audio.volume = 1;
  audio.play().catch(() => {});
}

function LessonCharacter() {
  return (
    <img
      alt=""
      className="h-16 w-16 shrink-0 object-contain"
      draggable="false"
      src={LESSON_CHARACTER_GIF_URL}
    />
  );
}

function AnswerFeedback({ correct, correctText = "Chính xác.", incorrectText }) {
  return (
    <div className={`lesson-answer-feedback mt-5 rounded-lg px-4 py-3 text-sm font-bold ${correct ? "is-correct bg-[#f0ffe9] text-[#2d7b00]" : "bg-red-50 text-red-700"}`}>
      {correct ? (
        <span aria-hidden="true" className="lesson-fireworks">
          {Array.from({ length: 12 }).map((_, index) => (
            <span className="lesson-firework-particle" key={index} />
          ))}
        </span>
      ) : null}
      <span className="relative z-[1]">{correct ? correctText : incorrectText}</span>
    </div>
  );
}

function normalizeSentence(value) {
  return normalize(value).replace(/[.,!?;:"]/g, "").replace(/\s+/g, " ");
}

function tokenizeSentence(value) {
  return String(value || "").replace(/[.,!?;:"]/g, "").split(/\s+/).filter(Boolean);
}

function isVietnameseText(value) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(value);
}

function buildRewriteOptions(targetText, index) {
  const distractors = isVietnameseText(targetText)
    ? ["rất", "đang", "của", "với", "mỗi", "ngày", "một", "này", "tôi", "bạn"]
    : ["I", "you", "my", "your", "the", "a", "today", "now", "every", "usually"];
  const targetTokens = tokenizeSentence(targetText);
  const normalizedTargetTokens = new Set(targetTokens.map((token) => normalizeSentence(token)));
  const extraTokens = distractors.filter((token) => !normalizedTargetTokens.has(normalizeSentence(token))).slice(index % 3, (index % 3) + 4);
  const targetIsVietnamese = isVietnameseText(targetText);
  const allTokens = [...targetTokens, ...extraTokens].filter((token) => !targetIsVietnamese || isVietnameseText(token) || normalizedTargetTokens.has(normalizeSentence(token)));

  return allTokens
    .map((token, tokenIndex) => ({ id: `${index}-${token}-${tokenIndex}`, token }))
    .sort((a, b) => a.token.localeCompare(b.token));
}

function LessonShell({ children, day, lesson, progressIndex, progressPercent }) {
  const navigate = useNavigate();

  return (
    <section className="min-h-full bg-canvas px-4 py-5 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <button
              aria-label="Quay lại lộ trình"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream-soft hover:text-coal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
              onClick={() => navigate(`/vocabulary/${day.id}`)}
              type="button"
            >
              <ArrowLeft size={21} />
            </button>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e7e2db]">
              <div className="h-full rounded-full bg-[#58cc02] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-black text-ink-muted">{progressPercent}%</span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function CompletionToast({ dayId, lessonId }) {
  const navigate = useNavigate();
  const nextPath = getNextLesson(dayId, lessonId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-coal/10 px-4 backdrop-blur-[1px]">
      <div className="flex w-full max-w-xl items-center gap-3 rounded-lg border border-[#b7e8a0] bg-[#f0ffe9]/95 p-3 text-left shadow-[0_22px_60px_rgba(20,20,19,0.22)] backdrop-blur sm:p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#58cc02] text-white shadow-sm">
          <Check size={24} strokeWidth={3} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-coal">Hoàn thành bài học</h2>
          <p className="mt-0.5 text-sm font-semibold text-ink-muted">Tiến độ đã được lưu trên máy này.</p>
        </div>
        <Button className="h-9 shrink-0 px-3 text-xs sm:px-4" onClick={() => navigate(nextPath)} type="button">
          {nextPath === "/vocabulary" ? "Về lộ trình" : "Bài tiếp theo"}
        </Button>
      </div>
    </div>
  );
}

function FlashcardsLesson({ day, lesson, onProgressChange }) {
  const cards = useMemo(() => day.words.map((word) => ({ id: `${word.word}-word`, type: "word", word })), [day.words]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const card = cards[index];
  const word = card.type === "word" ? card.word : card.sourceWord;
  const backMeaning = card.type === "collocation" ? card.meaning : word.meaning;
  const backExample = card.type === "collocation" ? card.example : word.example;
  const backTranslation = card.type === "collocation" ? card.translation : word.translation;
  const cardProgressPercent = Math.round(((index + 1) / cards.length) * 100);

  useEffect(() => {
    onProgressChange(cardProgressPercent);
  }, [cardProgressPercent, onProgressChange]);

  function flipCard() {
    setFlipped((current) => !current);
  }

  function handleCardKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    flipCard();
  }

  function next() {
    if (index === cards.length - 1) {
      completeVocabularyLesson(day.id, lesson.id);
      setDone(true);
      return;
    }
    setIndex((current) => current + 1);
    setFlipped(false);
  }

  function prev() {
    if (index === 0) return;
    setIndex((current) => current - 1);
    setFlipped(false);
  }

  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-black text-ink-muted">Flashcard {index + 1} / {cards.length}</p>
      <div
        aria-pressed={flipped}
        className="vocabulary-flip-card group h-[25rem] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
        onClick={flipCard}
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
      >
        <span className={`vocabulary-flip-card-inner ${flipped ? "is-flipped" : ""}`}>
          <span className="vocabulary-flip-card-face vocabulary-flip-card-front">
            <span className="absolute right-4 top-4 flex items-center gap-2">
              <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-coral">Lật thẻ</span>
            </span>
            <span className="block font-display text-5xl font-semibold tracking-normal text-coal sm:text-6xl">{card.type === "collocation" ? card.phrase : word.word}</span>
            {card.type === "collocation" ? (
              <button
                aria-label="Nghe collocation"
                className="mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white shadow-sm transition hover:bg-coral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
                onClick={(event) => {
                  event.stopPropagation();
                  speak(card.phrase);
                }}
                type="button"
              >
                <Volume2 size={18} />
              </button>
            ) : (
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e6dfd8] bg-canvas px-3 py-1.5 shadow-sm">
                <span className="font-mono text-lg font-semibold text-ink-muted">{word.phonetic}</span>
                <button
                  aria-label="Nghe phát âm"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white shadow-sm transition hover:bg-coral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
                  onClick={(event) => {
                    event.stopPropagation();
                    playLearningAudio(word.word, word.audioUrl);
                  }}
                  type="button"
                >
                  <Volume2 size={16} />
                </button>
              </span>
            )}
            <span className="mt-8 text-xs font-semibold text-ink-muted">Chạm vào thẻ để xem nghĩa và ví dụ</span>
          </span>

          <span className="vocabulary-flip-card-face vocabulary-flip-card-back">
            <button
              aria-label="Nghe từ"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-coral shadow-sm ring-1 ring-[#e6dfd8] transition hover:bg-cream-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
              onClick={(event) => {
                event.stopPropagation();
                playLearningAudio(card.type === "collocation" ? card.phrase : word.word, card.type === "word" ? word.audioUrl : "");
              }}
              type="button"
            >
              <Volume2 size={17} />
            </button>
            <span className="block font-display text-3xl font-semibold text-coal sm:text-4xl">{backMeaning}</span>
            <span className="mt-5 block w-full max-w-xl rounded-lg border border-[#e6dfd8] bg-canvas/75 p-4 text-left shadow-sm">
              <span className="block text-xs font-black uppercase tracking-wide text-coral">Ví dụ</span>
              <span className="mt-2 flex items-start gap-3 text-base font-semibold leading-7 text-ink-body">
                <span className="min-w-0 flex-1">{backExample}</span>
                <button
                  aria-label="Nghe câu ví dụ"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-sm transition hover:bg-coral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
                  onClick={(event) => {
                    event.stopPropagation();
                    playLearningAudio(backExample, card.type === "word" ? word.exampleAudioUrl : "");
                  }}
                  type="button"
                >
                  <Volume2 size={17} />
                </button>
              </span>
              <span className="mt-2 block text-sm font-medium leading-6 text-ink-muted">{backTranslation}</span>
            </span>
          </span>
        </span>
      </div>
      {done ? <CompletionToast dayId={day.id} lessonId={lesson.id} /> : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button className="h-11 rounded-lg text-sm" disabled={index === 0} onClick={prev} type="button" variant="outline">
            Thẻ trước
          </Button>
          <Button className="h-11 rounded-lg text-sm" onClick={next} type="button">
            {index === cards.length - 1 ? "Hoàn thành" : "Thẻ tiếp theo"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ChoiceLesson({ day, lesson, onProgressChange }) {
  const matchItems = useMemo(() => day.words.map((word) => ({
    id: `${word.word}-word`,
    text: word.word,
    meaning: word.meaning,
    audioUrl: word.audioUrl,
  })), [day.words]);
  const rounds = useMemo(() => {
    const repeatedItems = Array.from({ length: MATCH_REPETITIONS }).flatMap((_, repetitionIndex) => {
      const rotation = (repetitionIndex * MATCH_ROUND_SIZE) % matchItems.length;
      const rotatedItems = [...matchItems.slice(rotation), ...matchItems.slice(0, rotation)];
      return rotatedItems.map((item) => ({
        ...item,
        occurrenceId: `${repetitionIndex}-${item.id}`,
      }));
    });

    return Array.from({ length: Math.ceil(repeatedItems.length / MATCH_ROUND_SIZE) }, (_, roundIndex) => repeatedItems.slice(roundIndex * MATCH_ROUND_SIZE, roundIndex * MATCH_ROUND_SIZE + MATCH_ROUND_SIZE));
  }, [matchItems]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedWordId, setSelectedWordId] = useState("");
  const [selectedMeaningId, setSelectedMeaningId] = useState("");
  const [matchedOccurrences, setMatchedOccurrences] = useState(() => new Set());
  const [wrongPair, setWrongPair] = useState(null);
  const [done, setDone] = useState(false);
  const currentRound = rounds[roundIndex] || [];
  const englishOptions = useMemo(() => [...currentRound].sort((a, b) => a.text.localeCompare(b.text)), [currentRound]);
  const meaningOptions = useMemo(() => [...currentRound].sort((a, b) => b.meaning.localeCompare(a.meaning)), [currentRound]);
  const selectedWord = currentRound.find((item) => item.occurrenceId === selectedWordId);
  const selectedMeaning = currentRound.find((item) => item.occurrenceId === selectedMeaningId);
  const matchedCount = matchedOccurrences.size;
  const completedBeforeThisRound = rounds.slice(0, roundIndex).reduce((total, round) => total + round.length, 0);
  const completedCount = completedBeforeThisRound + matchedCount;
  const totalCount = rounds.reduce((total, round) => total + round.length, 0);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isRoundComplete = currentRound.length > 0 && matchedCount === currentRound.length;

  useEffect(() => {
    onProgressChange(progressPercent);
  }, [progressPercent, onProgressChange]);

  function resetRoundSelection() {
    setSelectedWordId("");
    setSelectedMeaningId("");
    setWrongPair(null);
  }

  function resolvePair(nextWord, nextMeaning) {
    if (!nextWord || !nextMeaning) return;
    const isCorrect = nextWord.occurrenceId === nextMeaning.occurrenceId;

    if (isCorrect) {
      playCorrectSound();
      const nextMatchedOccurrences = new Set(matchedOccurrences);
      nextMatchedOccurrences.add(nextWord.occurrenceId);
      setMatchedOccurrences(nextMatchedOccurrences);
      setSelectedWordId("");
      setSelectedMeaningId("");
      setWrongPair(null);

      if (roundIndex === rounds.length - 1 && nextMatchedOccurrences.size === currentRound.length) {
        completeVocabularyLesson(day.id, lesson.id);
        setDone(true);
      }
      return;
    }

    setWrongPair({ wordId: nextWord.occurrenceId, meaningId: nextMeaning.occurrenceId });
    window.setTimeout(() => {
      resetRoundSelection();
    }, 650);
  }

  function selectWord(item) {
    if (matchedOccurrences.has(item.occurrenceId)) return;
    playLearningAudio(item.text, item.audioUrl);
    setSelectedWordId(item.occurrenceId);
    resolvePair(item, selectedMeaning);
  }

  function selectMeaning(item) {
    if (matchedOccurrences.has(item.occurrenceId)) return;
    setSelectedMeaningId(item.occurrenceId);
    resolvePair(selectedWord, item);
  }

  function nextRound() {
    if (!isRoundComplete || roundIndex === rounds.length - 1) return;
    setRoundIndex((current) => current + 1);
    setMatchedOccurrences(new Set());
    resetRoundSelection();
  }

  function getWordState(item) {
    if (matchedOccurrences.has(item.occurrenceId)) return "matched";
    if (selectedWordId === item.occurrenceId && wrongPair?.wordId === item.occurrenceId) return "wrong";
    if (selectedWordId === item.occurrenceId) return "selected";
    return "idle";
  }

  function getMeaningState(item) {
    if (matchedOccurrences.has(item.occurrenceId)) return "matched";
    if (selectedMeaningId === item.occurrenceId && wrongPair?.meaningId === item.occurrenceId) return "wrong";
    if (selectedMeaningId === item.occurrenceId) return "selected";
    return "idle";
  }

  function pairButtonClass(state) {
    const base = "group flex min-h-[4.35rem] items-start gap-2 rounded-lg border px-2.5 py-3 text-left transition sm:min-h-[4.15rem] sm:items-center sm:gap-3 sm:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 disabled:cursor-default";
    if (state === "matched") return `${base} border-[#95dc7b] bg-[#f0ffe9] text-[#2d7b00] shadow-[0_2px_0_#95dc7b]`;
    if (state === "wrong") return `${base} border-red-300 bg-red-50 text-red-700`;
    if (state === "selected") return `${base} border-coral bg-[#fff4eb] text-coal shadow-[0_2px_0_#d6795d] ring-1 ring-coral/20`;
    return `${base} border-[#e2ddd6] bg-white text-coal shadow-[0_2px_0_#e2ddd6] hover:border-coral/50 hover:bg-cream-soft`;
  }

  return (
    <div className="mt-6 sm:mt-8">
      <p className="mb-3 text-sm font-black text-ink-muted">Câu {roundIndex + 1} / {rounds.length}</p>
      <div className="rounded-lg border border-[#e6dfd8] bg-[#fffdf9] p-3 shadow-sm sm:p-5">
        <p className="mb-4 text-base font-black leading-6 text-coal sm:text-lg">Chọn các cặp tương ứng</p>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="grid gap-3">
            {englishOptions.map((option, optionIndex) => {
              const state = getWordState(option);
              return (
                <button
                  className={pairButtonClass(state)}
                  disabled={state === "matched"}
                  key={option.occurrenceId}
                  onClick={() => selectWord(option)}
                  type="button"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/15 bg-white/60 text-[11px] font-black sm:h-8 sm:w-8 sm:text-xs">{optionIndex + 1}</span>
                  <span className="min-w-0 flex-1 break-words text-sm font-black leading-5 sm:text-base">{option.text}</span>
                  {state === "matched" ? <Check className="shrink-0" size={17} strokeWidth={3} /> : null}
                  {state === "wrong" ? <X className="shrink-0" size={17} strokeWidth={3} /> : null}
                  {state === "idle" || state === "selected" ? <Volume2 className="mt-0.5 shrink-0 text-coral/80" size={15} /> : null}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3">
            {meaningOptions.map((option, optionIndex) => {
              const state = getMeaningState(option);
              return (
                <button
                  className={pairButtonClass(state)}
                  disabled={state === "matched"}
                  key={option.occurrenceId}
                  onClick={() => selectMeaning(option)}
                  type="button"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/15 bg-white/60 text-[11px] font-black sm:h-8 sm:w-8 sm:text-xs">{optionIndex + 1 + englishOptions.length}</span>
                  <span className="min-w-0 flex-1 break-words text-sm font-bold leading-5 sm:text-base">{option.meaning}</span>
                  {state === "matched" ? <Check className="shrink-0" size={17} strokeWidth={3} /> : null}
                  {state === "wrong" ? <X className="shrink-0" size={17} strokeWidth={3} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {!done && isRoundComplete ? (
        <Button className="mt-5 w-full" onClick={nextRound} type="button">
          Câu tiếp theo
        </Button>
      ) : null}
      {done ? <CompletionToast dayId={day.id} lessonId={lesson.id} /> : null}
    </div>
  );
}

function ListeningFillLesson({ day, lesson, onProgressChange }) {
  const [index, setIndex] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const word = day.words[index];
  const writeEnglish = index % 2 === 0;
  const promptText = writeEnglish ? word.translation : word.example;
  const targetText = writeEnglish ? word.example : word.translation;
  const options = useMemo(() => buildRewriteOptions(targetText, index), [targetText, index]);
  const selectedAnswer = selectedTokens.map((item) => item.token).join(" ");
  const isCorrect = normalizeSentence(selectedAnswer) === normalizeSentence(targetText);
  const progressPercent = Math.round(((index + (checked && isCorrect ? 1 : 0)) / day.words.length) * 100);

  useEffect(() => {
    onProgressChange(progressPercent);
  }, [progressPercent, onProgressChange]);

  function selectToken(option) {
    if (checked || selectedTokens.some((item) => item.id === option.id)) return;
    setSelectedTokens((current) => [...current, option]);
  }

  function removeToken(option) {
    if (checked) return;
    setSelectedTokens((current) => current.filter((item) => item.id !== option.id));
  }

  function submit() {
    if (!checked) {
      if (isCorrect) playCorrectSound();
      setChecked(true);
      return;
    }
    if (index === day.words.length - 1) {
      completeVocabularyLesson(day.id, lesson.id);
      setDone(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelectedTokens([]);
    setChecked(false);
  }

  return (
    <div className="mt-6 sm:mt-8">
      <p className="mb-4 text-sm font-black text-ink-muted">Câu {index + 1} / {day.words.length}</p>
      <h2 className="text-2xl font-black leading-tight text-coal">{writeEnglish ? "Viết lại bằng tiếng Anh" : "Viết lại bằng tiếng Việt"}</h2>

      <div className="mt-6 flex items-start gap-3">
        <LessonCharacter />
        <div className="relative flex-1 rounded-lg border border-[#e2ddd6] bg-white px-4 py-3 text-base font-semibold leading-7 text-ink-body shadow-[0_2px_0_#e2ddd6]">
          <span>{promptText}</span>
        </div>
      </div>

      <div className="mt-6 min-h-[8.5rem] border-y border-[#e2ddd6] py-4">
        <div className="flex min-h-12 flex-wrap items-start gap-2">
          {selectedTokens.map((option) => (
            <button
              className="rounded-lg border border-[#d8d2cb] bg-white px-3 py-2 text-sm font-bold text-coal shadow-[0_2px_0_#d8d2cb] transition hover:bg-cream-soft disabled:opacity-70"
              disabled={checked}
              key={option.id}
              onClick={() => removeToken(option)}
              type="button"
            >
              {option.token}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {options.map((option) => {
          const selected = selectedTokens.some((item) => item.id === option.id);
          return (
            <button
              className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${selected ? "invisible" : "border-[#d8d2cb] bg-white text-ink-body shadow-[0_2px_0_#d8d2cb] hover:bg-cream-soft"}`}
              disabled={checked || selected}
              key={option.id}
              onClick={() => selectToken(option)}
              type="button"
            >
              {option.token}
            </button>
          );
        })}
      </div>

      {checked ? (
        <AnswerFeedback correct={isCorrect} incorrectText={`Đáp án đúng: ${targetText}`} />
      ) : null}
      {done ? <CompletionToast dayId={day.id} lessonId={lesson.id} /> : <Button className="mt-6 w-full" disabled={selectedTokens.length === 0} onClick={submit} type="button">{checked ? "Tiếp tục" : "Kiểm tra"}</Button>}
    </div>
  );
}

function ClozeQuizLesson({ day, lesson, onProgressChange }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const word = day.words[index];
  const sentenceParts = word.example.split(new RegExp(`\\b${word.word}\\b`, "i"));
  const isCorrect = normalize(answer) === normalize(word.word);
  const progressPercent = Math.round(((index + (checked && isCorrect ? 1 : 0)) / day.words.length) * 100);

  useEffect(() => {
    const timer = window.setTimeout(() => playLearningAudio(word.example, word.exampleAudioUrl || word.audioUrl), 300);
    return () => window.clearTimeout(timer);
  }, [word.audioUrl, word.example, word.exampleAudioUrl]);

  useEffect(() => {
    onProgressChange(progressPercent);
  }, [progressPercent, onProgressChange]);

  function submit() {
    if (!checked) {
      if (isCorrect) playCorrectSound();
      setChecked(true);
      return;
    }
    if (index === day.words.length - 1) {
      completeVocabularyLesson(day.id, lesson.id);
      setDone(true);
      return;
    }
    setIndex((current) => current + 1);
    setAnswer("");
    setChecked(false);
  }

  return (
    <div className="mt-6 sm:mt-8">
      <p className="mb-4 text-sm font-black text-ink-muted">Câu {index + 1} / {day.words.length}</p>
      <h2 className="text-2xl font-black leading-tight text-coal">Nhập từ còn thiếu</h2>

      <div className="mt-6 flex items-center gap-3">
        <LessonCharacter />
        <div className="inline-flex overflow-hidden rounded-lg border border-[#e2ddd6] bg-white shadow-[0_2px_0_#e2ddd6]">
          <button
            aria-label="Nghe câu"
            className="flex h-12 w-14 items-center justify-center border-r border-[#e2ddd6] text-[#1cb0f6] transition hover:bg-[#eef9ff]"
            onClick={() => playLearningAudio(word.example, word.exampleAudioUrl || word.audioUrl)}
            type="button"
          >
            <Volume2 size={22} />
          </button>
          <button
            aria-label="Nghe chậm"
            className="flex h-12 w-14 items-center justify-center text-[#1cb0f6] transition hover:bg-[#eef9ff]"
            onClick={() => {
              if (word.exampleAudioUrl || word.audioUrl) {
                playLearningAudio(word.example, word.exampleAudioUrl || word.audioUrl);
                return;
              }
              if (!("speechSynthesis" in window)) return;
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(word.example);
              utterance.lang = "en-US";
              utterance.rate = 0.62;
              utterance.volume = 1;
              window.speechSynthesis.speak(utterance);
            }}
            type="button"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#e2ddd6] bg-white p-4 text-lg font-semibold leading-9 text-ink-body shadow-[0_2px_0_#e2ddd6]">
        <span>{sentenceParts[0]}</span>
        <input
          aria-label="Từ còn thiếu"
          autoCapitalize="none"
          autoComplete="off"
          className={`mx-1 inline-block w-28 border-b-2 bg-transparent px-1 text-center font-black outline-none ${checked && isCorrect ? "border-[#58cc02] text-[#2d7b00]" : checked ? "border-red-400 text-red-700" : "border-[#1cb0f6] text-coal"}`}
          disabled={checked}
          onChange={(event) => setAnswer(event.target.value)}
          value={answer}
        />
        <span>{sentenceParts.slice(1).join(word.word)}</span>
      </div>

      <p className="mt-3 text-sm font-semibold text-ink-muted">{word.translation}</p>

      {checked ? (
        <AnswerFeedback correct={isCorrect} incorrectText={`Đáp án đúng: ${word.word}`} />
      ) : null}
      {done ? <CompletionToast dayId={day.id} lessonId={lesson.id} /> : <Button className="mt-6 w-full" disabled={!answer.trim()} onClick={submit} type="button">{checked ? "Tiếp tục" : "Kiểm tra"}</Button>}
    </div>
  );
}

export default function VocabularyLessonPage() {
  const { dayId, lessonId } = useParams();
  const { day, isLoading } = useVocabularyCourseData(dayId, lessonId);
  const lesson = getLessonType(lessonId);
  const progressIndex = lessonTypes.findIndex((item) => item.id === lessonId);
  const [lessonProgressPercent, setLessonProgressPercent] = useState(0);

  if (isLoading) return <LoadingState className="min-h-[60vh]" label="Đang tải nội dung bài học..." />;
  if (!day || !lesson) return <Navigate to="/vocabulary" replace />;
  if (!day.words.length) return <div className="mx-auto mt-12 max-w-xl rounded-xl border border-dashed border-[#d8d0c6] bg-cream-soft/30 px-6 py-12 text-center"><h1 className="text-xl font-black">Bài này chưa có nội dung</h1><p className="mt-2 text-sm text-ink-muted">Admin cần thêm flashcard hoặc tạo câu hỏi trước khi học.</p><Button className="mt-5" onClick={() => window.history.back()} type="button" variant="outline"><ArrowLeft size={16} /> Quay lại</Button></div>;

  return (
    <LessonShell day={day} lesson={lesson} progressIndex={progressIndex} progressPercent={lessonProgressPercent}>
      {lesson.id === "flashcards" ? <FlashcardsLesson day={day} lesson={lesson} onProgressChange={setLessonProgressPercent} /> : null}
      {lesson.id === "match-meaning" ? <ChoiceLesson day={day} lesson={lesson} onProgressChange={setLessonProgressPercent} /> : null}
      {lesson.id === "listening-fill" ? <ListeningFillLesson day={day} lesson={lesson} onProgressChange={setLessonProgressPercent} /> : null}
      {lesson.id === "cloze-quiz" ? <ClozeQuizLesson day={day} lesson={lesson} onProgressChange={setLessonProgressPercent} /> : null}
      <Button className="mt-6" onClick={() => window.location.reload()} size="sm" type="button" variant="ghost">
        <RotateCcw size={15} /> Làm lại bài này
      </Button>
    </LessonShell>
  );
}
