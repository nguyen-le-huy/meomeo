import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import DictationPractice from "../components/DictationPractice.jsx";
import ShadowingPractice from "../components/ShadowingPractice.jsx";
import TranscriptPanel from "../components/TranscriptPanel.jsx";
import VideoColumn from "../components/VideoColumn.jsx";
import {
  correctSoundUrls,
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
  const mode = searchParams.get("mode") === "shadowing" ? "shadowing" : "dictation";
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

  function stopCorrectSound() {
    if (!correctSoundRef.current) return;

    correctSoundRef.current.pause();
    correctSoundRef.current.currentTime = 0;
  }

  function resetDictationFeedback() {
    stopCorrectSound();
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

  function resumeShadowingSegment(index) {
    setCurrentIndex(index);
    setHasStarted(false);
    resetDictationState();
  }

  function playSegmentAt(index, options = {}) {
    const targetSegment = segments[index];
    if (!targetSegment) return;

    stopCorrectSound();
    setHasStarted(true);
    selectSegment(index);
    playerRef.current?.playSegment(targetSegment, options);
  }

  function startFirstSegment() {
    const firstSegment = segments[0];
    if (!firstSegment) return;

    stopCorrectSound();
    setHasStarted(true);
    selectSegment(0);
    playerRef.current?.playSegment(firstSegment, { startTime: 0 });
  }

  function replayCurrentSegment() {
    if (!segment) return;

    stopCorrectSound();
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
    stopCorrectSound();
    const next = Math.min(Math.max(currentIndex + delta, 0), Math.max(segments.length - 1, 0));
    const nextOptions =
      delta > 0 && segment
        ? { startTime: Math.min(Math.floor(Number(segment.endTime || 0)) + 1, Number(segments[next]?.endTime || 0)) }
        : {};

    playSegmentAt(next, nextOptions);
  }

  function playNextOrContinueToEnd() {
    if (!segment) return;

    stopCorrectSound();
    if (currentIndex >= segments.length - 1) {
      setHasStarted(true);
      playerRef.current?.playFrom(Number(segment.endTime || segment.startTime || 0));
      return;
    }

    moveAndPlay(1);
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
    stopCorrectSound();
    const randomSoundUrl = correctSoundUrls[Math.floor(Math.random() * correctSoundUrls.length)];
    correctSoundRef.current = new Audio(randomSoundUrl);
    correctSoundRef.current.preload = "auto";
    correctSoundRef.current.play().catch(() => {});
    setCorrectPraise(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
    setCorrectStickerUrl(correctStickerUrls[Math.floor(Math.random() * correctStickerUrls.length)]);
  }, [answer, isAnswerCorrect, segment?._id]);

  useEffect(() => {
    correctSoundUrls.forEach((url) => {
      const audio = new Audio(url);
      audio.preload = "auto";
    });

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
    return <section className="h-full overflow-auto bg-canvas p-6 text-sm text-ink-muted">Đang tải bài học...</section>;
  }

  if (!video) {
    return <section className="h-full overflow-auto bg-canvas p-6 text-sm text-red-600">Không tìm thấy video.</section>;
  }

  if (mode === "shadowing") {
    return (
      <ShadowingPractice
        currentIndex={currentIndex}
        hasStarted={hasStarted}
        isPlayerPlaying={isPlayerPlaying}
        isYoutubeReady={isYoutubeReady}
        onMoveAndPlay={moveAndPlay}
        onNext={playNextOrContinueToEnd}
        onPlayingChange={setIsPlayerPlaying}
        onReadyChange={setIsYoutubeReady}
        onReplayCurrentSegment={replayCurrentSegment}
        onResumeSegment={resumeShadowingSegment}
        onSelectSegment={selectSegment}
        onStartFirstSegment={startFirstSegment}
        onToggleCurrentSegmentPlayback={toggleCurrentSegmentPlayback}
        playerRef={playerRef}
        progressPercent={progressPercent}
        segment={segment}
        segments={segments}
        video={video}
      />
    );
  }

  return (
    <section className="h-full w-full max-w-full overflow-x-hidden overflow-y-auto bg-cream-soft pb-24 md:p-4 md:pb-4">
      <div className="mx-auto grid w-full max-w-full min-w-0 gap-3 xl:max-w-[1440px] xl:grid-cols-[minmax(360px,0.9fr)_minmax(420px,0.78fr)_minmax(300px,0.56fr)]">
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

        <section className="min-w-0 max-w-full overflow-hidden bg-canvas p-3 md:rounded-xl md:border md:border-[#e6dfd8] md:p-4 xl:min-h-[calc(100vh-6rem)]">
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
            onNext={playNextOrContinueToEnd}
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
