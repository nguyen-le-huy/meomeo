import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  FilePenLine,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { cn } from "../../../utils/cn.js";
import {
  useAssessShadowing,
  useSaveShadowingSessionProgress,
  useMyShadowingSession,
  useSubmitShadowingSession,
  useShadowingSessions,
  useDeleteShadowingSession,
} from "../hooks/useVideoLearning.js";
import { formatDuration } from "../utils/dictationText.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import SegmentYoutubePlayer from "./SegmentYoutubePlayer.jsx";

const passingScore = 60;
const actionButtonMotionClass = "transition-all duration-200 ease-out active:scale-[0.98] disabled:active:scale-100";
const recordingButtonClass = "animate-pulse shadow-[0_0_0_4px_rgba(204,120,92,0.18),0_10px_26px_rgba(204,120,92,0.28)]";

function getSupportedRecordingMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  if (!window.MediaRecorder?.isTypeSupported) return "";
  return candidates.find((item) => window.MediaRecorder.isTypeSupported(item)) || "";
}

function scoreMapFromSegments(segments = []) {
  return new Map(
    segments.map((item) => [
      String(item.segmentId),
      {
        segmentId: String(item.segmentId),
        bestPronunciationScore: item.bestPronunciationScore,
        bestAccuracyScore: item.bestAccuracyScore,
        bestFluencyScore: item.bestFluencyScore,
        bestCompletenessScore: item.bestCompletenessScore,
        attempts: item.attempts || 1,
      },
    ]),
  );
}

function serializeScores(scores) {
  return Array.from(scores.values()).map((score) => ({
    segmentId: score.segmentId,
    bestPronunciationScore: score.bestPronunciationScore,
    bestAccuracyScore: score.bestAccuracyScore,
    bestFluencyScore: score.bestFluencyScore,
    bestCompletenessScore: score.bestCompletenessScore,
    attempts: score.attempts,
  }));
}

function getFirstUnpassedIndex(segments, scores) {
  const index = segments.findIndex((item) => {
    const score = scores.get(item._id);
    return !score || score.bestPronunciationScore < passingScore;
  });

  return index === -1 ? Math.max(segments.length - 1, 0) : index;
}

export default function ShadowingPractice({
  currentIndex,
  hasStarted,
  isPlayerPlaying,
  isYoutubeReady,
  onMoveAndPlay,
  onNext,
  onPlayingChange,
  onReadyChange,
  onReplayCurrentSegment,
  onResumeSegment,
  onSelectSegment,
  onStartFirstSegment,
  onToggleCurrentSegmentPlayback,
  playerRef,
  progressPercent,
  segment,
  segments,
  video,
}) {
  const sessionId = getGuestSessionId();

  const storageKey = video?._id ? `shadowing-progress-${video._id}-${sessionId}` : null;

  function loadSavedScores() {
    if (!storageKey) return new Map();
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Map();
      const parsed = JSON.parse(raw);
      return new Map(Object.entries(parsed).map(([key, val]) => [key, { ...val, attempts: val.attempts || 1 }]));
    } catch {
      return new Map();
    }
  }

  function saveScores(scores) {
    if (!storageKey) return;
    try {
      const obj = Object.fromEntries(scores.entries());
      localStorage.setItem(storageKey, JSON.stringify(obj));
    } catch {
      // storage full or unavailable
    }
  }

  function clearScores() {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [recordingError, setRecordingError] = useState("");
  const [segmentScores, setSegmentScores] = useState(() => loadSavedScores());
  const [submittedSession, setSubmittedSession] = useState(null);
  const [deletedSessionId, setDeletedSessionId] = useState("");
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const assessMutation = useAssessShadowing();
  const saveProgressMutation = useSaveShadowingSessionProgress();
  const submitMutation = useSubmitShadowingSession();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const { data: existingSession } = useMyShadowingSession(video?._id, sessionId, { enabled: Boolean(video?._id) });
  const { data: allSessions, isLoading: sessionsLoading } = useShadowingSessions(isAdmin ? video?._id : null);
  const deleteMutation = useDeleteShadowingSession();

  const effectiveSession = submittedSession || (existingSession?._id === deletedSessionId ? null : existingSession);
  const locked = effectiveSession?.status === "completed";
  const canDeleteProgress = isAdmin && (Boolean(effectiveSession?._id) || segmentScores.size > 0);

  useEffect(() => {
    if (locked && storageKey) clearScores();
  }, [locked, storageKey]);

  useEffect(() => {
    if (segmentScores.size > 0 && !locked) saveScores(segmentScores);
  }, [segmentScores, locked, storageKey]);

  useEffect(() => {
    setSubmittedSession(null);
    setHasRestoredSession(false);
    setSegmentScores(loadSavedScores());
  }, [storageKey]);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingSegmentRef = useRef(null);
  const skipSubmitRef = useRef(false);
  const canUseSegment = Boolean(segment && isYoutubeReady && !locked);
  const activeSegment = segment || segments[0];

  function getBestScore(segId) {
    return segmentScores.get(segId);
  }

  function setBestScoreIfBetter(segId, result) {
    setSegmentScores((prev) => {
      const existing = prev.get(segId);
      const attempts = (existing?.attempts || 0) + 1;
      if (!existing || result.pronunciationScore > existing.bestPronunciationScore) {
        const updated = new Map(prev);
        updated.set(segId, {
          segmentId: segId,
          bestPronunciationScore: result.pronunciationScore,
          bestAccuracyScore: result.accuracyScore,
          bestFluencyScore: result.fluencyScore,
          bestCompletenessScore: result.completenessScore,
          attempts,
        });
        return updated;
      }
      const updated = new Map(prev);
      updated.set(segId, { ...existing, attempts: Math.max(existing.attempts, attempts) });
      return updated;
    });
  }

  const completedSegmentScores = segments
    .map((item) => getBestScore(item._id))
    .filter((score) => score?.bestPronunciationScore >= passingScore);
  const completedCount = completedSegmentScores.length;
  const allCompleted = segments.length > 0 && completedCount >= segments.length;
  const unlockedUntilIndex = getFirstUnpassedIndex(segments, segmentScores);
  const currentBestScore = segment?._id ? getBestScore(segment._id)?.bestPronunciationScore : undefined;
  const hasCurrentAttempt = currentBestScore !== undefined;
  const showResultActions = hasCurrentAttempt && !isRecording && !assessMutation.isPending;
  const isCurrentSegmentPassed = (() => {
    const score = segment?._id ? getBestScore(segment._id) : null;
    return score ? score.bestPronunciationScore >= passingScore : false;
  })();

  useEffect(() => {
    if (hasRestoredSession || !existingSession || !segments.length) return;

    setSegmentScores((current) => {
      const serverScores = scoreMapFromSegments(existingSession.segments);
      const merged = new Map(current);

      serverScores.forEach((serverScore, segmentId) => {
        const localScore = merged.get(segmentId);
        if (!localScore || serverScore.bestPronunciationScore >= localScore.bestPronunciationScore) {
          merged.set(segmentId, {
            ...serverScore,
            attempts: Math.max(serverScore.attempts || 1, localScore?.attempts || 0),
          });
        }
      });

      const resumeIndex = getFirstUnpassedIndex(segments, merged);
      onResumeSegment?.(resumeIndex, (existingSession.segments?.length || current.size) > 0);
      return merged;
    });
    setHasRestoredSession(true);
  }, [existingSession, hasRestoredSession, onResumeSegment, segments]);

  useEffect(() => {
    if (locked || !video?._id || segmentScores.size === 0) return undefined;

    const timer = window.setTimeout(() => {
      saveProgressMutation.mutate({
        sessionId,
        videoId: video._id,
        segments: serializeScores(segmentScores),
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [locked, segmentScores, sessionId, video?._id]);

  async function handleSubmit() {
    if (locked || !allCompleted || !video?._id) return;
    try {
      const result = await submitMutation.mutateAsync({
        sessionId,
        videoId: video._id,
        segments: serializeScores(segmentScores),
      });
      setSubmittedSession(result.data.data.shadowingSession);
    } catch {
      // handled by mutation state
    }
  }

  async function deleteProgress(sessionToDelete = effectiveSession, { resetCurrentProgress = true } = {}) {
    if (!window.confirm("Xoá tiến độ shadowing của bài này?")) return;

    if (sessionToDelete?._id) {
      await deleteMutation.mutateAsync(sessionToDelete._id);
    }

    if (!resetCurrentProgress) return;

    stopRecording({ skipSubmit: true });
    if (sessionToDelete?._id) setDeletedSessionId(sessionToDelete._id);
    clearScores();
    setSegmentScores(new Map());
    setSubmittedSession(null);
    setAssessmentResult(null);
    setRecordingError("");
    setHasRestoredSession(true);
    onResumeSegment?.(0);
  }

  function handlePrimaryAction() {
    if (locked) return;
    if (allCompleted) {
      handleSubmit();
      return;
    }

    if (!hasStarted) {
      onReplayCurrentSegment();
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  }

  function handleContinueAction() {
    if (allCompleted) {
      handleSubmit();
      return;
    }

    onNext();
  }

  function handleRetryAction() {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  }

  async function submitRecording(audioBlob, targetSegment) {
    if (!targetSegment?._id) return;

    const formData = new FormData();
    const extension = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
    formData.append("sessionId", getGuestSessionId());
    formData.append("segmentId", targetSegment._id);
    formData.append("audio", audioBlob, `shadowing-${targetSegment._id}.${extension}`);

    const response = await assessMutation.mutateAsync(formData);
    const result = response.data.data;
    setAssessmentResult(result);
    setBestScoreIfBetter(targetSegment._id, result);
  }

  async function startRecording() {
    if (!activeSegment?._id || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordingError("Trình duyệt chưa hỗ trợ ghi âm.");
      return;
    }

    try {
      setRecordingError("");
      setAssessmentResult(null);
      assessMutation.reset();
      audioChunksRef.current = [];
      skipSubmitRef.current = false;
      recordingSegmentRef.current = activeSegment;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = getSupportedRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setRecordingError("Không thể ghi âm. Hãy thử lại.");
        setIsRecording(false);
      };

      recorder.onstop = async () => {
        const shouldSkipSubmit = skipSubmitRef.current;
        const chunks = audioChunksRef.current;
        const targetSegment = recordingSegmentRef.current;
        audioChunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);

        if (shouldSkipSubmit || !chunks.length) return;

        try {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          await submitRecording(audioBlob, targetSegment);
        } catch (error) {
          setRecordingError(error.response?.data?.message || "Không chấm được ghi âm. Hãy thử lại.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setRecordingError(error.name === "NotAllowedError" ? "Bạn cần cấp quyền microphone để ghi âm." : "Không mở được microphone.");
      setIsRecording(false);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }

  function stopRecording({ skipSubmit = false } = {}) {
    skipSubmitRef.current = skipSubmit;

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      return;
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
  }

  useEffect(() => {
    setAssessmentResult(null);
    setRecordingError("");
    assessMutation.reset();

    if (isRecording) {
      stopRecording({ skipSubmit: true });
    }
  }, [activeSegment?._id]);

  useEffect(() => () => stopRecording({ skipSubmit: true }), []);

  return (
    <section className="h-full w-full max-w-full overflow-hidden bg-cream-soft pb-20 text-coal md:overflow-y-auto md:p-4 md:pb-4">
      <div className="mx-auto grid w-full max-w-[1500px] gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="min-w-0 overflow-hidden bg-canvas md:rounded-xl md:border md:border-[#e6dfd8] md:p-4">
          <div className="hidden items-center gap-3 pb-4 xl:flex">
            <div className="h-1.5 w-36 rounded-full bg-coral" />
            <p className="min-w-0 flex-1 truncate text-sm font-black text-ink-body">{video.title}</p>
            <Badge className="bg-coral text-white">{video.level || "A2"}</Badge>
          </div>

          <SegmentYoutubePlayer
            onPlayingChange={onPlayingChange}
            onReadyChange={onReadyChange}
            ref={playerRef}
            segment={segment}
            title={video.title}
            youtubeVideoId={video.youtubeVideoId}
          />

          <div className="space-y-3 px-3 py-4 md:px-0 xl:overflow-visible">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-2">
                <Button
                  className="h-10 w-10 rounded-full border-[#e6dfd8] bg-white shadow-sm"
                  disabled={currentIndex === 0 || !isYoutubeReady || locked}
                  onClick={() => onMoveAndPlay(-1)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  className="h-10 w-10 rounded-full border-[#e6dfd8] bg-white shadow-sm"
                  disabled={!canUseSegment}
                  onClick={onReplayCurrentSegment}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw size={18} />
                </Button>
                <Button
                  className="h-10 w-10 rounded-full border-[#e6dfd8] bg-white shadow-sm"
                  disabled={!canUseSegment}
                  onClick={onToggleCurrentSegmentPlayback}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  {isPlayerPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
	                <Button
	                  className="h-10 w-10 rounded-full border-[#e6dfd8] bg-white shadow-sm"
	                  disabled={!isYoutubeReady || locked || !isCurrentSegmentPassed}
	                  onClick={onNext}
	                  size="icon"
	                  type="button"
                  variant="outline"
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
              <Button
                className={cn(
                  "justify-self-end gap-2 text-sm font-bold xl:hidden",
                  isTranscriptVisible ? "text-coal" : "text-ink-muted",
                )}
                onClick={() => setIsTranscriptVisible((current) => !current)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <EyeOff size={16} /> Trans
              </Button>
            </div>

            {!hasStarted ? (
              <div className="hidden justify-center xl:flex">
                <Button
                  className={cn("h-12 min-w-52 bg-coral text-base text-white hover:bg-coral-dark", actionButtonMotionClass)}
                  disabled={!canUseSegment}
                  onClick={onReplayCurrentSegment}
                  type="button"
                >
                  <Play size={17} /> Bắt đầu
                </Button>
              </div>
            ) : null}

            {canDeleteProgress ? (
              <div className="flex justify-end">
                <Button
                  className="h-9 gap-2 border-red-200 bg-white text-xs font-black text-red-600 hover:bg-red-50"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteProgress()}
                  type="button"
                  variant="outline"
                >
                  <Trash2 size={14} /> Xoá tiến độ
                </Button>
              </div>
            ) : null}

            <div className="max-h-[calc(100dvh-430px)] min-h-[210px] space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1 xl:max-h-none xl:min-h-0 xl:overflow-visible xl:pr-0">
              <CurrentTurnCard
                assessmentResult={assessmentResult}
                bestScore={currentBestScore}
                currentIndex={currentIndex}
                isAssessing={assessMutation.isPending}
                isCurrentPassed={isCurrentSegmentPassed}
                isLocked={locked}
                isRecording={isRecording}
                isTranscriptVisible={isTranscriptVisible}
                recordingError={recordingError}
                segment={activeSegment}
              />
	              <MobileTranscriptFeed
	                currentIndex={currentIndex}
	                maxSelectableIndex={unlockedUntilIndex}
	                isTranscriptVisible={isTranscriptVisible}
	                onSelectSegment={onSelectSegment}
	                segments={segments}
              />
            </div>

            <div className="hidden items-center justify-center gap-3 xl:flex">
              {showResultActions ? (
                isCurrentSegmentPassed ? (
                  <>
                    <Button
                      className={cn("h-12 min-w-44 rounded-2xl border-[#e6dfd8] bg-white text-sm font-black uppercase text-ink-muted shadow-sm", actionButtonMotionClass)}
                      disabled={!canUseSegment || assessMutation.isPending || locked}
                      onClick={handleRetryAction}
                      type="button"
                      variant="outline"
                    >
                      <Mic size={16} /> Thử lại
                    </Button>
                    <Button
                      className={cn("h-12 min-w-48 bg-coral text-sm text-white hover:bg-coral-dark", actionButtonMotionClass)}
                      disabled={!isYoutubeReady || submitMutation.isPending || locked}
                      onClick={handleContinueAction}
                      type="button"
                    >
                      {submitMutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : allCompleted ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
                      {allCompleted ? (submitMutation.isPending ? "Đang hoàn thành..." : "Hoàn thành") : "Tiếp tục"}
                    </Button>
                  </>
                ) : (
                  <Button
                    className={cn("h-12 min-w-48 bg-coral text-sm text-white hover:bg-coral-dark", actionButtonMotionClass)}
                    disabled={!canUseSegment || assessMutation.isPending || locked}
                    onClick={handleRetryAction}
                    type="button"
                  >
                    <Mic size={16} /> Nói lại
                  </Button>
                )
              ) : (
                <>
                  <Button
                    className={cn("h-12 min-w-44 rounded-2xl border-[#e6dfd8] bg-white text-sm font-black uppercase text-ink-muted shadow-sm", actionButtonMotionClass)}
                    disabled={!hasStarted}
                    onClick={onReplayCurrentSegment}
                    type="button"
                    variant="outline"
                  >
                    <Play size={16} /> Phát lại ghi âm
                  </Button>
                  <Button
                    className={cn(
                      "h-12 min-w-48 bg-coral text-sm text-white hover:bg-coral-dark",
                      actionButtonMotionClass,
                      isRecording && recordingButtonClass,
                    )}
                    disabled={!canUseSegment || !hasStarted || assessMutation.isPending || locked}
                    onClick={isRecording ? stopRecording : startRecording}
                    type="button"
                  >
                    {assessMutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Mic className={cn(isRecording && "animate-bounce")} size={16} />}
                    {assessMutation.isPending ? "Đang chấm..." : isRecording ? "Dừng ghi âm" : "Ghi âm"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden max-h-[calc(100vh-6rem)] min-h-[calc(100vh-6rem)] flex-col rounded-xl border border-[#e6dfd8] bg-canvas p-4 xl:flex">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="eyebrow">Bản chép</h2>
            <span className="rounded-lg border border-[#e6dfd8] bg-cream-soft px-3 py-1 text-sm font-black text-coal">
              {progressPercent}%
            </span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-cream">
            <div className="h-full rounded-full bg-coral" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {segments.length ? (
              segments.map((item, index) => {
	                const score = getBestScore(item._id);
	                const bestScore = score?.bestPronunciationScore;
	                const passed = bestScore !== undefined && bestScore >= passingScore;
	                const isSelectable = locked || index <= unlockedUntilIndex;
	                return (
	                  <TranscriptCard
	                    bestScore={bestScore}
	                    index={index}
	                    isActive={index === currentIndex}
	                    isSelectable={isSelectable}
	                    isLocked={locked}
	                    item={item}
	                    key={item._id}
                    onSelectSegment={onSelectSegment}
                    passed={passed}
                  />
                );
              })
            ) : (
              <Card className="rounded-2xl border-dashed border-[#e6dfd8] bg-cream-soft">
                <CardContent className="p-4 text-sm font-bold text-ink-muted">Chưa có bản chép cho video này.</CardContent>
              </Card>
            )}
          </div>

          {allCompleted && !locked ? (
            <div className="mt-4 border-t border-[#e6dfd8] pt-4">
              <div className="flex items-center justify-between text-sm font-semibold text-ink-muted">
                <span>Điểm TB</span>
	                <span className="text-lg font-black text-coal">
	                  {Math.round(completedSegmentScores.reduce((s, x) => s + x.bestPronunciationScore, 0) / completedSegmentScores.length)}
	                </span>
              </div>
              <Button
                className={cn("mt-3 h-12 w-full bg-coral text-sm text-white hover:bg-coral-dark", actionButtonMotionClass)}
                disabled={submitMutation.isPending}
                onClick={handleSubmit}
                type="button"
              >
                {submitMutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
              </Button>
              {submitMutation.isError ? (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {submitMutation.error?.response?.data?.message || "Không thể nộp bài."}
                </p>
              ) : null}
            </div>
          ) : null}

          {locked ? (
            <div className="mt-4 border-t border-[#e6dfd8] pt-4">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={16} />
                Đã nộp — TB {effectiveSession?.averageScore || 0}đ
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="mt-4 border-t border-[#e6dfd8] pt-4">
              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                Admin ({sessionsLoading ? "..." : (allSessions?.length || 0)})
              </h3>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {(allSessions || []).map((s) => (
                  <div className="rounded-lg border border-[#e6dfd8] bg-cream-soft p-2 text-xs" key={s._id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-ink-muted">{s.sessionId.slice(0, 12)}…</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-coal">{s.averageScore}đ</span>
                        <button
                          className="text-red-500 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            deleteProgress(s, { resetCurrentProgress: s._id === effectiveSession?._id });
                          }}
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
	                    <p className="mt-1 text-ink-muted">
	                      {s.status === "completed" ? "Done" : "Đang học"} · {s.averageScore || 0}đ TB ·{" "}
	                      {s.completedSegments || 0}/{s.totalSegments || s.segments.length} đoạn
	                      {s.submittedAt ? ` · ${new Date(s.submittedAt).toLocaleString("vi-VN")}` : ""}
	                    </p>
                  </div>
                ))}
                {!sessionsLoading && allSessions?.length === 0 ? (
                  <p className="text-ink-muted">Chưa có ai nộp.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e6dfd8] bg-canvas p-3 xl:hidden">
        {hasStarted && showResultActions && isCurrentSegmentPassed ? (
          <div className="grid grid-cols-[0.85fr_1fr] gap-2">
            <Button
              className={cn("h-14 border-[#e6dfd8] bg-white text-base font-black text-ink-muted shadow-sm", actionButtonMotionClass)}
              disabled={!activeSegment || !isYoutubeReady || assessMutation.isPending || locked}
              onClick={handleRetryAction}
              type="button"
              variant="outline"
            >
              <Mic size={17} /> Thử lại
            </Button>
            <Button
              className={cn("h-14 bg-coral text-base text-white shadow-lg hover:bg-coral-dark", actionButtonMotionClass)}
              disabled={!activeSegment || !isYoutubeReady || locked || submitMutation.isPending}
              onClick={handleContinueAction}
              type="button"
            >
              {submitMutation.isPending ? <LoaderCircle className="animate-spin" size={17} /> : allCompleted ? <CheckCircle2 size={17} /> : <ChevronRight size={17} />}
              {allCompleted ? (submitMutation.isPending ? "Đang hoàn thành..." : "Hoàn thành") : "Tiếp tục"}
            </Button>
          </div>
        ) : (
          <Button
            className={cn(
              "h-14 w-full bg-coral text-base text-white shadow-lg hover:bg-coral-dark",
              actionButtonMotionClass,
              isRecording && recordingButtonClass,
            )}
            disabled={!activeSegment || !isYoutubeReady || assessMutation.isPending || locked || submitMutation.isPending}
            onClick={hasStarted && showResultActions && !isCurrentSegmentPassed ? handleRetryAction : handlePrimaryAction}
            type="button"
          >
            {assessMutation.isPending || submitMutation.isPending ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : hasStarted ? (
              <Mic className={cn(isRecording && "animate-bounce")} size={17} />
            ) : (
              <Play size={17} />
            )}
            {hasStarted
              ? (submitMutation.isPending ? "Đang nộp..." : assessMutation.isPending ? "Đang chấm..." : isRecording ? "Dừng ghi âm" : showResultActions ? "Nói lại" : "Ghi âm")
              : "Bắt đầu"}
          </Button>
        )}
      </div>
    </section>
  );
}

function CurrentTurnCard({
  assessmentResult,
  bestScore,
  currentIndex,
  isAssessing,
  isCurrentPassed,
  isLocked,
  isRecording,
  isTranscriptVisible,
  recordingError,
  segment,
}) {
  if (!segment) {
    return (
      <Card className="rounded-2xl border-dashed border-[#e6dfd8] bg-cream-soft shadow-sm">
        <CardContent className="p-5 text-sm font-bold text-ink-muted">Chưa có transcript để luyện shadowing.</CardContent>
      </Card>
    );
  }

  const latestScore = assessmentResult?.pronunciationScore;
  const showAttempted = bestScore !== undefined && !isLocked;

  return (
    <Card className="rounded-2xl border-2 border-coral bg-cream-soft shadow-[0_3px_0_#d9e2ec]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-cream px-2 text-xs font-black text-ink-muted">
              {segment.index || currentIndex + 1}
            </span>
            <span className="text-xs font-black uppercase tracking-wide text-ink-muted">Lượt của bạn</span>
          </div>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Badge className="rounded-full bg-emerald-100 text-emerald-800">Đã nộp</Badge>
            ) : latestScore !== undefined ? (
              <Badge className={cn("rounded-full", getScoreBadgeClass(latestScore))}>
                {latestScore}
              </Badge>
            ) : isAssessing ? (
              <Badge className="rounded-full bg-cream text-ink-muted">Đang chấm</Badge>
            ) : isRecording ? (
              <Badge className="rounded-full bg-[#ffe2e2] text-[#e9414f]">Đang ghi</Badge>
            ) : null}
            <FilePenLine className="text-coal/65" size={16} />
            <AlertTriangle className="text-coal/65" size={16} />
          </div>
        </div>

        {showAttempted && !isCurrentPassed ? (
          <p className="text-sm font-bold text-[#e9414f]">
            Điểm {bestScore} — cần ≥ {passingScore} để qua đoạn này
          </p>
        ) : null}

        {isTranscriptVisible ? (
          <div className="space-y-2">
            <WordLine assessmentWords={assessmentResult?.words} text={segment.text} />
            <TranslationLine text={segment.translationText} />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#e6dfd8] bg-white/55 px-3 py-4 text-center text-sm font-bold text-ink-muted">
            Transcript đang ẩn
          </p>
        )}
        {recordingError ? <p className="text-sm font-bold text-[#e9414f]">{recordingError}</p> : null}
      </CardContent>
    </Card>
  );
}

function TranscriptCard({ bestScore, index, isActive, isLocked, isSelectable, item, onSelectSegment, passed }) {
  const scoreClass = bestScore !== undefined
    ? (passed ? "bg-emerald-100 text-emerald-800" : "bg-[#ffe2e2] text-[#e9414f]")
    : "bg-cream-soft text-ink-body";
  return (
    <Card
      className={cn(
        "rounded-2xl border bg-white shadow-sm transition",
        isActive ? "border-2 border-coral bg-cream" : "border-[#e6dfd8]",
        !isSelectable && "opacity-60",
      )}
    >
      <CardContent className="p-3">
        <Button
          className="h-auto w-full justify-start p-0 text-left hover:bg-transparent"
          disabled={!isSelectable}
          onClick={() => onSelectSegment(index)}
          type="button"
          variant="ghost"
        >
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[#e6dfd8] bg-cream-soft px-2 text-xs font-black text-ink-body">
                #{item.index || index + 1}
              </span>
              <div className="flex items-center gap-2">
                {bestScore !== undefined ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-black", scoreClass)}>
                    {bestScore}
                  </span>
                ) : null}
                {isLocked ? (
                  <span className="text-xs text-emerald-600 font-semibold">✓</span>
                ) : null}
                <span className="text-xs font-black text-ink-muted">{formatDuration(Number(item.endTime || 0))}</span>
              </div>
            </div>
            <p className="whitespace-normal text-sm font-black leading-6 text-coal">{item.text}</p>
            <TranslationLine text={item.translationText} />
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}

function MobileTranscriptFeed({ currentIndex, isTranscriptVisible, maxSelectableIndex, onSelectSegment, segments }) {
  const upcomingSegments = segments.slice(currentIndex + 1);
  if (!upcomingSegments.length) return null;

  return (
    <div className="space-y-2 pb-2 xl:hidden">
      {upcomingSegments.map((item, offset) => {
        const index = currentIndex + offset + 1;
        const isSelectable = index <= maxSelectableIndex;

        return (
        <Card
          className={cn("rounded-2xl border border-[#e6dfd8] bg-white shadow-sm", isSelectable ? "opacity-70" : "opacity-45")}
          key={item._id}
        >
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-cream px-2 text-xs font-black text-ink-muted">
                  {item.index || index + 1}
                </span>
                <span className="text-xs font-black uppercase tracking-wide text-[#a3acba]">Tiếp theo</span>
              </div>
              <Button
                className="h-8 px-2 text-ink-muted"
                disabled={!isSelectable}
                onClick={() => onSelectSegment(index)}
                type="button"
                variant="ghost"
              >
                <FilePenLine size={16} />
              </Button>
            </div>
            {isTranscriptVisible ? (
              <div className="space-y-2">
                <WordLine isMuted={index !== currentIndex} text={item.text} />
                <TranslationLine isMuted={index !== currentIndex} text={item.translationText} />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[#e6dfd8] bg-cream-soft px-3 py-4 text-center text-sm font-bold text-[#a3acba]">
                Transcript đang ẩn
              </p>
            )}
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}

function getScoreBadgeClass(score) {
  if (score >= 85) return "bg-[#d7f8df] text-[#0e7a3d]";
  if (score >= 60) return "bg-[#fff2c7] text-[#9a6500]";
  return "bg-[#ffe2e2] text-[#e9414f]";
}

function getWordColorClass(color) {
  if (color === "green") return "text-[#159447]";
  if (color === "yellow") return "text-[#c37a00]";
  if (color === "red") return "text-[#e9414f]";
  return "";
}

function WordLine({ assessmentWords, isMuted = false, text }) {
  const words = String(text || "").split(/\s+/).filter(Boolean);

  return (
    <div className={cn("flex flex-wrap gap-x-1.5 gap-y-1 text-base font-semibold leading-6", isMuted ? "text-[#687386]" : "text-coal")}>
      {words.map((word, index) => (
        <span
          className={cn(
            assessmentWords && !isMuted && getWordColorClass(assessmentWords[index]?.color),
          )}
          key={`${word}-${index}`}
          title={assessmentWords?.[index] ? `Score: ${assessmentWords[index].accuracyScore}` : undefined}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

function TranslationLine({ isMuted = false, text }) {
  if (!text) return null;

  return (
    <p className={cn("whitespace-normal text-sm font-normal leading-6", isMuted ? "text-[#8b95a6]" : "text-coral-dark")}>
      {text}
    </p>
  );
}

export { MobileTranscriptFeed };
