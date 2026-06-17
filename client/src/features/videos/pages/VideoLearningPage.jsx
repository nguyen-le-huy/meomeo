import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import DictationPractice from "../components/DictationPractice.jsx";
import ShadowingPlaceholder from "../components/ShadowingPlaceholder.jsx";
import TranscriptPanel from "../components/TranscriptPanel.jsx";
import VideoColumn from "../components/VideoColumn.jsx";
import {
  correctSoundUrl,
  correctStickerUrls,
  praiseMessages,
} from "../constants/videoLearning.constants.js";
import {
  buildInlineAnswer,
  normalizeDictationAnswer,
} from "../utils/dictationText.js";
import {
  useAnalyzeVideoTranscript,
  useCheckDictation,
  useCreateTranscriptSegment,
  useUpdateTranscriptSegment,
  useVideo,
  useVideoTranscripts,
} from "../hooks/useVideoLearning.js";

export default function VideoLearningPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "shadowing" ? "shadowing" : "dictation";
  const [mode] = useState(initialMode);
  const [difficulty, setDifficulty] = useState("normal");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedWordIndexes, setRevealedWordIndexes] = useState([]);
  const [inlineWordAnswers, setInlineWordAnswers] = useState({});
  const [answer, setAnswer] = useState("");
  const [editingSegmentId, setEditingSegmentId] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  const [isYoutubeReady, setIsYoutubeReady] = useState(false);
  const [correctPraise, setCorrectPraise] = useState("");
  const [correctStickerUrl, setCorrectStickerUrl] = useState("");
  const [showAddTranscriptForm, setShowAddTranscriptForm] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { data: video, isLoading: isVideoLoading } = useVideo(id);
  const { data: segments = [], isLoading: isSegmentsLoading } = useVideoTranscripts(id);
  const checkMutation = useCheckDictation();
  const analyzeMutation = useAnalyzeVideoTranscript(id);
  const createSegmentMutation = useCreateTranscriptSegment(id);
  const updateSegmentMutation = useUpdateTranscriptSegment(id);
  const segment = segments[currentIndex];

  const playerRef = useRef(null);
  const correctSoundRef = useRef(null);
  const lastCorrectKeyRef = useRef("");

  const progressPercent = segments.length ? Math.round((currentIndex / segments.length) * 100) : 0;
  const isAnswerCorrect = useMemo(() => {
    if (!segment?.text || !answer.trim()) return false;
    return normalizeDictationAnswer(answer) === normalizeDictationAnswer(segment.text);
  }, [answer, segment?.text]);

  function resetDictationFeedback() {
    setCorrectPraise("");
    setCorrectStickerUrl("");
    lastCorrectKeyRef.current = "";
  }

  function resetDictationState() {
    setInlineWordAnswers({});
    setAnswer("");
    resetDictationFeedback();
    setRevealedWordIndexes([]);
    checkMutation.reset();
  }

  function selectSegment(index) {
    setCurrentIndex(index);
    resetDictationState();
  }

  function playSegmentAt(index, options = {}) {
    const targetSegment = segments[index];
    if (!targetSegment) return;

    setHasStarted(true);
    selectSegment(index);
    playerRef.current?.playSegment(targetSegment, options);
  }

  function startFirstSegment() {
    const firstSegment = segments[0];
    if (!firstSegment) return;

    setHasStarted(true);
    selectSegment(0);
    playerRef.current?.playSegment(firstSegment, { startTime: 0 });
  }

  function replayCurrentSegment() {
    if (!segment) return;

    setHasStarted(true);
    playerRef.current?.playSegment(segment);
  }

  function toggleCurrentSegmentPlayback() {
    if (!segment) return;

    setHasStarted(true);
    if (isPlayerPlaying) {
      playerRef.current?.pauseVideo();
      return;
    }

    playerRef.current?.playSegment(segment);
  }

  function moveAndPlay(delta) {
    const next = Math.min(Math.max(currentIndex + delta, 0), Math.max(segments.length - 1, 0));
    const nextOptions =
      delta > 0 && segment
        ? { startTime: Math.min(Math.floor(Number(segment.endTime || 0)) + 1, Number(segments[next]?.endTime || 0)) }
        : {};

    playSegmentAt(next, nextOptions);
  }

  function revealAllWords() {
    if (!segment?.text) return;
    const wordIndexes = segment.text.split(/\s+/).filter(Boolean).map((_, index) => index);
    setRevealedWordIndexes(wordIndexes);
  }

  function revealWord(index) {
    setRevealedWordIndexes((current) => (current.includes(index) ? current : [...current, index]));
  }

  function revealInlineWord(index) {
    setRevealedWordIndexes((current) => {
      const next = current.includes(index) ? current : [...current, index];
      if (segment?.text) {
        setAnswer(buildInlineAnswer(segment.text, difficulty, inlineWordAnswers, next));
      }
      return next;
    });
  }

  function updateInlineWordAnswer(index, value) {
    if (!segment?.text) return;

    setInlineWordAnswers((current) => {
      const next = { ...current, [index]: value };
      setAnswer(buildInlineAnswer(segment.text, difficulty, next, revealedWordIndexes));
      return next;
    });
  }

  function handleAnswerChange(value) {
    setAnswer(value);
    if (!value.trim()) {
      resetDictationFeedback();
    }
  }

  function handleDifficultyChange(nextDifficulty) {
    setDifficulty(nextDifficulty);
    resetDictationState();
  }

  async function submitDictation(event) {
    event.preventDefault();
    if (!segment) return;
    await checkMutation.mutateAsync({
      sessionId: getGuestSessionId(),
      segmentId: segment._id,
      difficulty,
      userAnswer: answer,
    });
  }

  async function createSegment(data) {
    const response = await createSegmentMutation.mutateAsync({ ...data, videoId: id });
    const createdSegment = response.data?.data?.segment;
    setShowAddTranscriptForm(false);
    if (createdSegment) {
      selectSegment(segments.length);
    }
  }

  async function updateSegment(item, data) {
    await updateSegmentMutation.mutateAsync({ segmentId: item._id, data });
    setEditingSegmentId("");
  }

  useEffect(() => {
    if (!isAnswerCorrect || !segment?._id) return;

    const correctKey = `${segment._id}:${normalizeDictationAnswer(answer)}`;
    if (lastCorrectKeyRef.current === correctKey) return;

    lastCorrectKeyRef.current = correctKey;
    if (correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0;
      correctSoundRef.current.play().catch(() => {});
    }
    setCorrectPraise(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
    setCorrectStickerUrl(correctStickerUrls[Math.floor(Math.random() * correctStickerUrls.length)]);
  }, [answer, isAnswerCorrect, segment?._id]);

  useEffect(() => {
    correctSoundRef.current = new Audio(correctSoundUrl);
    correctSoundRef.current.preload = "auto";

    return () => {
      correctSoundRef.current?.pause();
      correctSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isAnswerCorrect) {
      setCorrectPraise("");
      setCorrectStickerUrl("");
    }
  }, [isAnswerCorrect]);

  if (isVideoLoading || isSegmentsLoading) {
    return <section className="h-full overflow-auto bg-matcha p-6 font-bold">Đang tải bài học...</section>;
  }

  if (!video) {
    return <section className="h-full overflow-auto bg-matcha p-6 font-bold text-red-600">Không tìm thấy video.</section>;
  }

  return (
    <section className="h-full w-full max-w-full overflow-x-hidden overflow-y-auto bg-white pb-24 md:bg-[#eef4ee] md:p-4 md:pb-4">
      <div className="mx-auto grid w-full max-w-full min-w-0 gap-0 xl:max-w-[1500px] xl:grid-cols-[minmax(360px,0.9fr)_minmax(420px,0.78fr)_minmax(300px,0.56fr)] xl:gap-2">
        <VideoColumn
          analyzeMutation={analyzeMutation}
          isAdmin={isAdmin}
          isYoutubeReady={isYoutubeReady}
          onPlayingChange={setIsPlayerPlaying}
          onReadyChange={setIsYoutubeReady}
          onReplayCurrentSegment={replayCurrentSegment}
          onStartFirstSegment={startFirstSegment}
          playerRef={playerRef}
          segment={segment}
          video={video}
        />

        <section className="min-w-0 max-w-full overflow-hidden bg-white p-2 md:rounded-2xl md:border md:border-[#d9e2ec] md:p-4 md:shadow-sm xl:min-h-[calc(100vh-2rem)]">
          {mode === "dictation" ? (
            <DictationPractice
              answer={answer}
              checkMutation={checkMutation}
              correctPraise={correctPraise}
              correctStickerUrl={correctStickerUrl}
              currentIndex={currentIndex}
              difficulty={difficulty}
              hasStarted={hasStarted}
              inlineWordAnswers={inlineWordAnswers}
              isPlayerPlaying={isPlayerPlaying}
              isYoutubeReady={isYoutubeReady}
              onChangeAnswer={handleAnswerChange}
              onChangeDifficulty={handleDifficultyChange}
              onChangeInlineWord={updateInlineWordAnswer}
              onMoveAndPlay={moveAndPlay}
              onRevealAllWords={revealAllWords}
              onRevealInlineWord={revealInlineWord}
              onRevealWord={revealWord}
              onReplayCurrentSegment={replayCurrentSegment}
              onStartFirstSegment={startFirstSegment}
              onSubmit={submitDictation}
              onToggleCurrentSegmentPlayback={toggleCurrentSegmentPlayback}
              progressPercent={progressPercent}
              revealedWordIndexes={revealedWordIndexes}
              segment={segment}
              segmentsCount={segments.length}
            />
          ) : (
            <ShadowingPlaceholder />
          )}
        </section>

        <TranscriptPanel
          currentIndex={currentIndex}
          difficulty={difficulty}
          editingSegmentId={editingSegmentId}
          isAdmin={isAdmin}
          isCreating={createSegmentMutation.isPending}
          onCreate={createSegment}
          onEdit={setEditingSegmentId}
          onSelect={selectSegment}
          onUpdate={updateSegment}
          progressPercent={progressPercent}
          segments={segments}
          setEditingSegmentId={setEditingSegmentId}
          setShowAddTranscriptForm={setShowAddTranscriptForm}
          showAddTranscriptForm={showAddTranscriptForm}
        />
      </div>
    </section>
  );
}
