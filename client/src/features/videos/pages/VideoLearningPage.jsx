import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Keyboard,
  Merge,
  Mic,
  NotebookPen,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Zap,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import {
  useAnalyzeVideoTranscript,
  useCheckDictation,
  useMergeTranscriptSegment,
  useUpdateTranscriptSegment,
  useVideo,
  useVideoTranscripts,
} from "../hooks/useVideoLearning.js";

const difficulties = ["easy", "normal"];
const praiseMessages = [
  "Ôi giỏi thế!",
  "Kinh nhỉ!",
  "Ghê gớm đấy!",
  "Đỉnh thật sự!",
  "Chuẩn không cần chỉnh!",
  "Nghe tốt đấy!",
  "Quá bén!",
  "Xuất sắc luôn!",
];
let youtubeApiPromise;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  youtubeApiPromise ||= new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export default function VideoLearningPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "shadowing" ? "shadowing" : "dictation";
  const [mode, setMode] = useState(initialMode);
  const [difficulty, setDifficulty] = useState("normal");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedWordIndexes, setRevealedWordIndexes] = useState([]);
  const [answer, setAnswer] = useState("");
  const [editingSegmentId, setEditingSegmentId] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  const [isYoutubeReady, setIsYoutubeReady] = useState(false);
  const [correctPraise, setCorrectPraise] = useState("");
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { data: video, isLoading: isVideoLoading } = useVideo(id);
  const { data: segments = [], isLoading: isSegmentsLoading } = useVideoTranscripts(id);
  const checkMutation = useCheckDictation();
  const analyzeMutation = useAnalyzeVideoTranscript(id);
  const updateSegmentMutation = useUpdateTranscriptSegment(id);
  const mergeSegmentMutation = useMergeTranscriptSegment(id);
  const segment = segments[currentIndex];
  const playerRef = useRef(null);
  const lastCorrectKeyRef = useRef("");
  const progressPercent = segments.length ? Math.round((currentIndex / segments.length) * 100) : 0;
  const isAnswerCorrect = useMemo(() => {
    if (!segment?.text || !answer.trim()) return false;
    return normalizeDictationAnswer(answer) === normalizeDictationAnswer(segment.text);
  }, [answer, segment?.text]);

  function selectSegment(index) {
    setCurrentIndex(index);
    setAnswer("");
    setCorrectPraise("");
    lastCorrectKeyRef.current = "";
    setRevealedWordIndexes([]);
    checkMutation.reset();
  }

  function move(delta) {
    const next = Math.min(Math.max(currentIndex + delta, 0), Math.max(segments.length - 1, 0));
    selectSegment(next);
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

  useEffect(() => {
    if (!isAnswerCorrect || !segment?._id) return;

    const correctKey = `${segment._id}:${normalizeDictationAnswer(answer)}`;
    if (lastCorrectKeyRef.current === correctKey) return;

    lastCorrectKeyRef.current = correctKey;
    setCorrectPraise(praiseMessages[Math.floor(Math.random() * praiseMessages.length)]);
  }, [answer, isAnswerCorrect, segment?._id]);

  if (isVideoLoading || isSegmentsLoading) {
    return <section className="h-full overflow-auto bg-matcha p-6 font-bold">Đang tải bài học...</section>;
  }

  if (!video) {
    return <section className="h-full overflow-auto bg-matcha p-6 font-bold text-red-600">Không tìm thấy video.</section>;
  }

  return (
    <section className="h-full w-full max-w-full overflow-x-hidden overflow-y-auto bg-white pb-24 md:bg-[#eef4ee] md:p-4 md:pb-4">
      <div className="mx-auto grid w-full max-w-full min-w-0 gap-0 xl:max-w-[1500px] xl:grid-cols-[minmax(360px,0.9fr)_minmax(420px,0.78fr)_minmax(300px,0.56fr)] xl:gap-2">
        <section className="min-w-0 max-w-full overflow-hidden bg-white md:rounded-2xl md:border md:border-[#d9e2ec] md:p-4 md:shadow-sm xl:min-h-[calc(100vh-2rem)]">
          <div className="mb-4 hidden items-center justify-between gap-3 xl:flex">
            <h2 className="text-sm font-black uppercase tracking-wide text-coal">Video</h2>
            {video.duration ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#f3f6fb] px-3 py-1.5 text-sm font-black text-coal/75">
                <span className="h-2 w-2 rounded-full bg-coal/45" />
                {formatDuration(video.duration)}
              </span>
            ) : null}
          </div>
          <div className="space-y-4">
            <SegmentYoutubePlayer
              onPlayingChange={setIsPlayerPlaying}
              onReadyChange={setIsYoutubeReady}
              ref={playerRef}
              segment={segment}
              title={video.title}
              youtubeVideoId={video.youtubeVideoId}
            />
            <div className="hidden xl:block">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-coal/65">Điều khiển</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#292f68] px-4 text-base font-black uppercase text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!segment || !isYoutubeReady}
                  onClick={startFirstSegment}
                  type="button"
                >
                  <Play size={18} /> Bắt đầu
                </button>
                <button
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#3b99d8] px-4 text-base font-black uppercase text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!segment || !isYoutubeReady}
                  onClick={replayCurrentSegment}
                  type="button"
                >
                  <RefreshCw size={18} /> Phát lại
                </button>
              </div>
            </div>
            <div className="hidden border-t border-coal/10 pt-4 xl:block">
              <p className="text-sm font-black leading-tight text-coal">{video.title}</p>
              <p className="mt-1 text-sm font-bold text-coal/55">YouTube - {video.level}</p>
              {isAdmin ? (
                <button
                  className={`${inactiveButtonClass} mt-3`}
                  disabled={analyzeMutation.isPending}
                  onClick={() => analyzeMutation.mutate()}
                  type="button"
                >
                  <RefreshCw className={analyzeMutation.isPending ? "animate-spin" : ""} size={16} />
                  {analyzeMutation.isPending ? "Đang phân tích..." : "Phân tích transcript"}
                </button>
              ) : null}
              {video.transcriptStatus === "failed" && video.transcriptError ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {video.transcriptError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="min-w-0 max-w-full overflow-hidden bg-white p-2 md:rounded-2xl md:border md:border-[#d9e2ec] md:p-4 md:shadow-sm xl:min-h-[calc(100vh-2rem)]">
          {mode === "dictation" ? (
            <form className="space-y-3" onSubmit={submitDictation}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {difficulties.map((item) => (
                    <button
                      className={difficulty === item ? compactActiveButtonClass : compactButtonClass}
                      key={item}
                      onClick={() => {
                        setDifficulty(item);
                        setRevealedWordIndexes([]);
                      }}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button className={toolbarButtonClass} type="button">
                    <Settings size={17} />
                  </button>
                  <span className="inline-flex items-center gap-1 text-sm font-black text-coal">
                    <Zap size={16} /> 1x
                  </span>
                  <span className="rounded-lg border border-[#dbe4ee] bg-[#f9fbff] px-3 py-1.5 text-sm font-black text-coal">{progressPercent}%</span>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-[#dbe4ee] bg-[#eef3fb]">
                <div className="h-full rounded-full bg-[#292f68]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="hidden items-center justify-between rounded-2xl border border-[#dbe4ee] bg-[#f9fbff] px-4 py-3 xl:flex">
                <div className="flex items-center gap-3">
                  <button className={toolbarButtonClass} disabled={currentIndex === 0} onClick={() => move(-1)} type="button">
                    <ChevronLeft size={17} />
                  </button>
                  <button className={toolbarButtonClass} disabled={!segment || !isYoutubeReady} onClick={replayCurrentSegment} type="button">
                    <RotateCcw size={17} />
                  </button>
                  <button className={toolbarButtonClass} disabled={!segment || !isYoutubeReady} onClick={toggleCurrentSegmentPlayback} type="button">
                    {isPlayerPlaying ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <button className={toolbarButtonClass} disabled={currentIndex >= segments.length - 1 || !isYoutubeReady} onClick={() => moveAndPlay(1)} type="button">
                    <ChevronRight size={17} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-sm font-black text-coal">
                    <Zap size={16} /> 1x
                  </span>
                  <button className={toolbarButtonClass} type="button">
                    <Settings size={17} />
                  </button>
                  <button className={toolbarButtonClass} type="button">
                    <Keyboard size={17} />
                  </button>
                </div>
              </div>
              <div className="xl:hidden">
                <TranscriptScroller
                  currentIndex={currentIndex}
                  difficulty={difficulty}
                  editingSegmentId={editingSegmentId}
                  isAdmin={isAdmin}
                  mergeSegmentMutation={mergeSegmentMutation}
                  onEdit={setEditingSegmentId}
                  onSelect={selectSegment}
                  onUpdate={async (item, data) => {
                    await updateSegmentMutation.mutateAsync({ segmentId: item._id, data });
                    setEditingSegmentId("");
                  }}
                  segments={segments}
                  setEditingSegmentId={setEditingSegmentId}
                />
              </div>
              <p className="text-sm font-semibold text-coal/70 xl:hidden">Gợi ý: Bạn có thể nhấp vào khối từ để hiển thị từ đó</p>
              <div className="relative rounded-2xl border border-[#dbe4ee] bg-white p-4 shadow-sm">
                <label className="mb-3 hidden text-sm font-black uppercase tracking-wide text-coal/65 xl:block">Gõ những gì bạn nghe được:</label>
                <textarea
                  className="min-h-36 w-full resize-none rounded-xl border-0 bg-transparent text-base font-semibold text-coal outline-none placeholder:text-coal/55 xl:min-h-32 xl:text-lg"
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    if (!event.target.value.trim()) {
                      setCorrectPraise("");
                      lastCorrectKeyRef.current = "";
                    }
                  }}
                  placeholder="Gõ câu trả lời của bạn ở đây..."
                  value={answer}
                />
                <button
                  className="absolute bottom-[-14px] right-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe4ee] bg-white text-coal shadow-sm"
                  type="button"
                >
                  <Mic size={16} />
                </button>
              </div>
              {correctPraise ? (
                <div className="rounded-2xl border border-[#bfe9c9] bg-[#d7f8df] px-4 py-3 text-sm font-black text-[#0e7a3d]">
                  Chính xác. {correctPraise}
                </div>
              ) : null}
              {segment ? (
                <div className="hidden space-y-2 xl:block">
                  <MaskedWordChips
                    difficulty={difficulty}
                    onRevealWord={revealWord}
                    revealedWordIndexes={revealedWordIndexes}
                    text={segment.text}
                  />
                  <p className="text-sm font-semibold text-coal/65">Các từ được tiết lộ sẽ bị tính là lỗi và ảnh hưởng đến điểm số của bạn.</p>
                </div>
              ) : null}
              <button
                className="hidden h-12 w-full rounded-2xl border-2 border-[#ffc72c] bg-[#fffaf0] text-sm font-black uppercase text-[#bf5700] xl:block"
                onClick={revealAllWords}
                type="button"
              >
                <Eye className="mr-2 inline" size={17} />
                Hiện tất cả từ
              </button>
              <button
                className="hidden h-14 w-full rounded-2xl bg-[#292f68] text-base font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50 xl:block"
                disabled={!segment || currentIndex >= segments.length - 1 || !isYoutubeReady}
                onClick={() => moveAndPlay(1)}
                type="button"
              >
                Tiếp theo <ChevronRight className="inline" size={18} />
              </button>
              <button className="sr-only" disabled={!segment || checkMutation.isPending} type="submit">
                {checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"}
              </button>
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#dbe4ee] bg-white p-3 xl:hidden">
                {hasStarted ? (
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#292f68] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!segment || !isYoutubeReady}
                      onClick={toggleCurrentSegmentPlayback}
                      type="button"
                    >
                      {isPlayerPlaying ? <Pause size={19} /> : <Play size={19} />}
                    </button>
                    <button
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#dbe4ee] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!segment || !isYoutubeReady}
                      onClick={replayCurrentSegment}
                      type="button"
                    >
                      <RotateCcw size={19} />
                    </button>
                    <button
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#dbe4ee] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={currentIndex === 0 || !isYoutubeReady}
                      onClick={() => moveAndPlay(-1)}
                      type="button"
                    >
                      <ChevronLeft size={19} />
                    </button>
                    <button
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#dbe4ee] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={currentIndex >= segments.length - 1 || !isYoutubeReady}
                      onClick={() => moveAndPlay(1)}
                      type="button"
                    >
                      <ChevronRight size={19} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="h-14 w-full rounded-2xl bg-[#292f68] text-base font-black uppercase text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!segment || !isYoutubeReady}
                    onClick={startFirstSegment}
                    type="button"
                  >
                    <Play className="mr-2 inline" size={17} /> Bắt đầu
                  </button>
                )}
              </div>
              {checkMutation.data?.data?.data ? <DictationResult result={checkMutation.data.data.data} /> : null}
            </form>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-black">Shadowing</h2>
              <p className="text-sm font-semibold text-coal/65">
                Nghe segment hiện tại, đọc lại theo transcript rồi gửi audio để Azure Speech chấm điểm. Phần ghi âm browser sẽ triển khai ở bước kế tiếp.
              </p>
              <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white" type="button">
                Record
              </button>
            </div>
          )}
        </section>

        <TranscriptPanel
          currentIndex={currentIndex}
          difficulty={difficulty}
          editingSegmentId={editingSegmentId}
          isAdmin={isAdmin}
          mergeSegmentMutation={mergeSegmentMutation}
          onEdit={setEditingSegmentId}
          onSelect={selectSegment}
          onUpdate={async (item, data) => {
            await updateSegmentMutation.mutateAsync({ segmentId: item._id, data });
            setEditingSegmentId("");
          }}
          progressPercent={progressPercent}
          segments={segments}
          setEditingSegmentId={setEditingSegmentId}
        />
      </div>
    </section>
  );
}

const SegmentYoutubePlayer = forwardRef(function SegmentYoutubePlayer({ onPlayingChange, onReadyChange, segment, title, youtubeVideoId }, ref) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const boundaryTimerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopBoundaryTimer = useCallback(() => {
    if (boundaryTimerRef.current) {
      window.clearInterval(boundaryTimerRef.current);
      boundaryTimerRef.current = null;
    }
  }, []);

  const pauseVideo = useCallback(() => {
    stopBoundaryTimer();
    playerRef.current?.pauseVideo?.();
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange, stopBoundaryTimer]);

  const playSegment = useCallback((targetSegment = segment, options = {}) => {
    const player = playerRef.current;
    if (!player || !targetSegment) return;

    const startTime = Number(options.startTime ?? targetSegment.startTime ?? 0);
    const endTime = Number(targetSegment.endTime || startTime);

    stopBoundaryTimer();
    player.seekTo(startTime, true);
    player.playVideo();
    setIsPlaying(true);
    onPlayingChange?.(true);

    boundaryTimerRef.current = window.setInterval(() => {
      const currentTime = Number(player.getCurrentTime?.() || 0);

      if (currentTime >= endTime) {
        pauseVideo();
      }
    }, 120);
  }, [onPlayingChange, pauseVideo, segment, stopBoundaryTimer]);

  useEffect(() => {
    let isMounted = true;
    setIsPlayerReady(false);
    setIsPlaying(false);
    onReadyChange?.(false);
    onPlayingChange?.(false);
    stopBoundaryTimer();

    if (!youtubeVideoId || !hostRef.current) return undefined;

    loadYouTubeIframeApi().then((YT) => {
      if (!isMounted || !hostRef.current) return;

      playerRef.current?.destroy?.();
      playerRef.current = new YT.Player(hostRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (isMounted) {
              setIsPlayerReady(true);
              onReadyChange?.(true);
            }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onPlayingChange?.(false);
            }

            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              onPlayingChange?.(true);
            }
          },
        },
      });
    });

    return () => {
      isMounted = false;
      stopBoundaryTimer();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [onPlayingChange, onReadyChange, stopBoundaryTimer, youtubeVideoId]);

  useImperativeHandle(ref, () => ({ pauseVideo, playSegment }), [pauseVideo, playSegment]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-none border-b-[5px] border-[#2ea8e5] bg-black shadow-sm md:rounded-2xl md:border-8">
      <div
        className="h-[210px] w-full max-w-full min-w-0 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:max-w-full [&>iframe]:object-contain md:aspect-video md:h-auto"
        ref={hostRef}
        title={title}
      />
      <span className="sr-only">{isPlayerReady ? "Player ready" : "Player loading"} {isPlaying ? "playing" : "paused"}</span>
    </div>
  );
});

function TranscriptPanel({
  currentIndex,
  difficulty,
  editingSegmentId,
  isAdmin,
  mergeSegmentMutation,
  onEdit,
  onSelect,
  onUpdate,
  progressPercent,
  segments,
  setEditingSegmentId,
}) {
  return (
    <aside className="hidden max-h-[calc(100vh-2rem)] min-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-[#d9e2ec] bg-white p-4 shadow-sm xl:flex">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-coal">Bản chép</h2>
        <span className="rounded-lg border border-[#dbe4ee] bg-[#f9fbff] px-3 py-1 text-sm font-black text-coal">{progressPercent}%</span>
      </div>
      <div className="mb-4 h-3 overflow-hidden rounded-full border border-[#dbe4ee] bg-[#eef3fb]">
        <div className="h-full rounded-full bg-[#292f68]" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
        {segments.length ? (
          segments.map((item, index) => (
            <div
              className={[
                "rounded-2xl border p-4 text-sm shadow-sm transition",
                index === currentIndex ? "border-[#292f68] bg-[#eef2ff]" : "border-[#dbe4ee] bg-white",
              ].join(" ")}
              key={item._id}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  className="rounded-lg border border-[#dbe4ee] bg-[#f9fbff] px-3 py-1 text-sm font-black text-coal"
                  onClick={() => onSelect(index)}
                  type="button"
                >
                  #{item.index}
                </button>
                {isAdmin ? (
                  <div className="flex items-center gap-2 text-coal/70">
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-coal/5" onClick={() => onEdit(item._id)} type="button">
                      <NotebookPen size={16} />
                    </button>
                    <AlertTriangle size={16} />
                  </div>
                ) : (
                  <AlertTriangle className="text-coal/40" size={16} />
                )}
              </div>
              {editingSegmentId === item._id ? (
                <TranscriptEditForm
                  item={item}
                  onCancel={() => setEditingSegmentId("")}
                  onSave={(data) => onUpdate(item, data)}
                />
              ) : (
                <MaskedTranscriptText difficulty={difficulty} text={item.text} />
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#dbe4ee] bg-[#f9fbff] p-4 text-sm font-bold text-coal/60">
            Chưa có transcript. Admin bấm “Phân tích transcript” để lấy subtitle từ YouTube.
          </div>
        )}
      </div>
    </aside>
  );
}

function TranscriptScroller({
  currentIndex,
  difficulty,
  editingSegmentId,
  isAdmin,
  mergeSegmentMutation,
  onEdit,
  onSelect,
  onUpdate,
  segments,
  setEditingSegmentId,
}) {
  if (!segments.length) {
    return (
      <div className="rounded-xl border border-dashed border-coal/20 bg-white/75 p-4 text-sm font-bold text-coal/65">
        Chưa có transcript. Admin bấm “Phân tích transcript” để lấy subtitle từ YouTube.
      </div>
    );
  }

  const item = segments[currentIndex] || segments[0];

  return (
    <div className="w-full max-w-full pb-2" data-transcript-scroller>
      <div
        className="flex min-h-36 w-full max-w-full flex-col rounded-2xl border border-[#dbe4ee] bg-white p-3 text-sm shadow-sm"
        data-transcript-card
        key={item._id}
      >
        <button className="block w-full text-left font-black" onClick={() => onSelect(currentIndex)} type="button">
          #{item.index}
        </button>
        {editingSegmentId === item._id ? (
          <TranscriptEditForm
            item={item}
            onCancel={() => setEditingSegmentId("")}
            onSave={(data) => onUpdate(item, data)}
          />
        ) : (
          <MaskedTranscriptText difficulty={difficulty} text={item.text} />
        )}
        <div className="mt-auto flex justify-end gap-2 pt-3 text-coal/70">
          <Play size={15} />
          {isAdmin ? (
            <>
              <button className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold" onClick={() => onEdit(item._id)} type="button">
                <Pencil size={13} />
              </button>
              <button
                className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold"
                disabled={mergeSegmentMutation.isPending}
                onClick={() => {
                  if (window.confirm("Bạn có chắc muốn ghép segment này với segment tiếp theo không?")) {
                    mergeSegmentMutation.mutate(item._id);
                  }
                }}
                type="button"
              >
                <Merge size={13} />
              </button>
            </>
          ) : null}
          <AlertTriangle size={15} />
        </div>
      </div>
    </div>
  );
}

function getMaskedWords(difficulty, text) {
  const words = text.split(/\s+/).filter(Boolean);

  return words.map((word, index) => {
    if (difficulty === "easy") {
      return index % 4 === 1
        ? { original: word, value: maskWordKeepPunctuation(word), revealed: false }
        : { original: word, value: word, revealed: true };
    }

    return index % 2 === 0
      ? { original: word, value: maskWordKeepPunctuation(word), revealed: false }
      : { original: word, value: maskWordKeepPunctuation(word), revealed: false };
  });
}

function maskWordKeepPunctuation(word) {
  return String(word || "").replace(/[\p{L}\p{N}]/gu, "*");
}

function normalizeDictationAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function MaskedWordChips({ difficulty, onRevealWord, revealedWordIndexes, text }) {
  const maskedWords = getMaskedWords(difficulty, text);

  return (
    <div className="flex flex-wrap gap-2">
      {maskedWords.map((word, index) => (
        <span className="inline-flex flex-col items-center gap-1" key={`${word.original}-${index}`}>
          <button
            aria-label={`Hiện từ ${index + 1}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-coal hover:bg-[#eef3fb]"
            onClick={() => onRevealWord(index)}
            type="button"
          >
            <Eye size={14} />
          </button>
          <span
            className={[
              "rounded-md border px-3 py-2 text-sm font-black",
              word.revealed || revealedWordIndexes.includes(index)
                ? "border-[#bfe9c9] bg-[#d7f8df] text-[#0e7a3d]"
                : "border-[#dbe4ee] bg-[#f9fbff] text-coal",
            ].join(" ")}
          >
            {word.revealed || revealedWordIndexes.includes(index) ? word.original : word.value}
          </span>
        </span>
      ))}
    </div>
  );
}

function MaskedTranscriptText({ difficulty, text }) {
  return (
    <p className="text-sm font-black leading-7 text-coal">
      {getMaskedWords(difficulty, text)
        .map((word) => word.value)
        .join(" ")}
    </p>
  );
}

function DictationPrompt({ difficulty, text }) {
  const words = text.split(/\s+/).filter(Boolean);

  const masked = words.map((word, index) => {
    if (difficulty === "easy") return index % 4 === 1 ? maskWordKeepPunctuation(word) : word;
    return maskWordKeepPunctuation(word);
  });

  return <p className="rounded-lg bg-matcha/70 p-3 text-lg font-black">{masked.join(" ")}</p>;
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(Number(seconds || 0), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function DictationResult({ result }) {
  return (
    <div className="rounded-lg bg-matcha/70 p-3 text-sm font-bold">
      <p>Score: {result.score}</p>
      <p>{result.isCorrect ? "Đúng rồi." : "Chưa đúng."}</p>
      <p>Correct: {result.correctText}</p>
      {result.mistakes?.length ? <p>Mistakes: {result.mistakes.length}</p> : null}
    </div>
  );
}

function TranscriptEditForm({ item, onCancel, onSave }) {
  const [form, setForm] = useState({
    text: item.text,
    startTime: item.startTime,
    endTime: item.endTime,
    isPublished: item.isPublished,
  });

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
    >
      <textarea
        className="min-h-20 w-full rounded-md border border-coal/15 p-2 text-sm outline-none"
        onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
        value={form.text}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-9 rounded-md border border-coal/15 px-2 text-sm outline-none"
          onChange={(event) => setForm((current) => ({ ...current, startTime: Number(event.target.value) }))}
          step="0.1"
          type="number"
          value={form.startTime}
        />
        <input
          className="h-9 rounded-md border border-coal/15 px-2 text-sm outline-none"
          onChange={(event) => setForm((current) => ({ ...current, endTime: Number(event.target.value) }))}
          step="0.1"
          type="number"
          value={form.endTime}
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          checked={form.isPublished}
          onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
          type="checkbox"
        />
        Published
      </label>
      <div className="flex gap-2">
        <button className="rounded-md bg-black px-2 py-1 text-xs font-bold text-white" type="submit">
          <Save size={13} /> Save
        </button>
        <button className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}

const activeButtonClass = "inline-flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-sm font-bold text-white disabled:opacity-50";
const inactiveButtonClass = "inline-flex items-center gap-1 rounded-lg border border-coal/20 bg-white/70 px-3 py-2 text-sm font-bold disabled:opacity-50";
const compactActiveButtonClass = "rounded-lg bg-[#292f68] px-3 py-2 text-sm font-black text-white";
const compactButtonClass = "rounded-lg bg-[#f3f6fb] px-3 py-2 text-sm font-bold text-coal";
const toolbarButtonClass = "inline-flex h-8 w-8 items-center justify-center rounded-lg text-coal disabled:cursor-not-allowed disabled:opacity-40";
