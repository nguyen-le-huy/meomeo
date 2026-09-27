import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  FilePenLine,
  GraduationCap,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { cn } from "../../../utils/cn.js";
import {
  useAssessShadowing,
  useSaveShadowingSessionProgress,
  useMyShadowingSession,
  useSubmitShadowingSession,
  useShadowingSessions,
  useDeleteShadowingSession,
  useUpdateVideo,
} from "../hooks/useVideoLearning.js";
import { formatDuration } from "../utils/dictationText.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import SegmentYoutubePlayer from "./SegmentYoutubePlayer.jsx";

const passingScore = 60;
const actionButtonMotionClass = "transition-all duration-200 ease-out active:scale-[0.98] disabled:active:scale-100";
const recordingButtonClass = "animate-pulse shadow-[0_0_0_5px_rgba(204,120,92,0.18),0_14px_32px_rgba(204,120,92,0.28)]";

function getExamGrade(score) {
  if (score >= 85) {
    return {
      title: "Xuất sắc (Excellent)",
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      message: "Khả năng phát âm, ngữ điệu và độ lưu loát rất tự nhiên chuẩn bản xứ!",
    };
  }
  if (score >= 70) {
    return {
      title: "Giỏi (Very Good)",
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
      colorClass: "text-blue-600 dark:text-blue-400",
      message: "Bắt chước ngữ điệu tốt, phát âm chuẩn xác và rõ ràng.",
    };
  }
  if (score >= 60) {
    return {
      title: "Đạt chuẩn (Passed)",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      colorClass: "text-amber-600 dark:text-amber-400",
      message: "Đạt chuẩn bài thi! Bạn có thể luyện thêm các từ khó để nâng cao điểm số.",
    };
  }
  return {
    title: "Cần cải thiện (Needs Practice)",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    colorClass: "text-red-600 dark:text-red-400",
    message: "Hãy nghe lại video kỹ hơn và nhại theo từng cụm nhỏ để cải thiện.",
  };
}

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
  const updateVideoMutation = useUpdateVideo();
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

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSubMode = searchParams.get("type") || searchParams.get("subMode");
  const [shadowingMode, setShadowingMode] = useState(() => {
    if (urlSubMode === "exam" || urlSubMode === "practice") return urlSubMode;
    try {
      return localStorage.getItem("shadowing-preferred-mode") || "practice";
    } catch {
      return "practice";
    }
  });

  function handleSubModeChange(nextMode) {
    setShadowingMode(nextMode);
    try {
      localStorage.setItem("shadowing-preferred-mode", nextMode);
    } catch {}
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("type", nextMode);
    setSearchParams(nextParams, { replace: true });
  }

  function handleSelectSegment(index) {
    if (isRecording) {
      stopRecording({ skipSubmit: true });
    }
    onSelectSegment?.(index);
    const targetSegment = segments[index];
    if (targetSegment && playerRef?.current?.playSegment) {
      playerRef.current.playSegment(targetSegment);
    }
  }

  const completedSegmentScores = segments
    .map((item) => getBestScore(item._id))
    .filter((score) => score && score.bestPronunciationScore >= passingScore);
  const completedCount = completedSegmentScores.length;
  const allCompleted = segments.length > 0 && completedCount >= segments.length;
  const unlockedUntilIndex = getFirstUnpassedIndex(segments, segmentScores);
  const currentBestScore = segment?._id ? getBestScore(segment._id)?.bestPronunciationScore : undefined;
  const hasCurrentAttempt = currentBestScore !== undefined;
  const showResultActions = hasCurrentAttempt && !isRecording && !assessMutation.isPending;
  const isCurrentSegmentPassed = Boolean(
    segment?._id && getBestScore(segment._id)?.bestPronunciationScore >= passingScore,
  );

  const avgPronunciation = completedSegmentScores.length
    ? Math.round(completedSegmentScores.reduce((s, x) => s + (x.bestPronunciationScore || 0), 0) / completedSegmentScores.length)
    : 0;
  const avgAccuracy = completedSegmentScores.length
    ? Math.round(completedSegmentScores.reduce((s, x) => s + (x.bestAccuracyScore || 0), 0) / completedSegmentScores.length)
    : 0;
  const avgFluency = completedSegmentScores.length
    ? Math.round(completedSegmentScores.reduce((s, x) => s + (x.bestFluencyScore || 0), 0) / completedSegmentScores.length)
    : 0;
  const avgCompleteness = completedSegmentScores.length
    ? Math.round(completedSegmentScores.reduce((s, x) => s + (x.bestCompletenessScore || 0), 0) / completedSegmentScores.length)
    : 0;

  function handleRetakeExam() {
    if (!window.confirm("Bạn muốn làm lại bài thi từ đầu? Toàn bộ kết quả bài thi hiện tại sẽ được xoá để bạn thi lại.")) return;
    stopRecording({ skipSubmit: true });
    clearScores();
    setSegmentScores(new Map());
    setSubmittedSession(null);
    setAssessmentResult(null);
    setRecordingError("");
    onSelectSegment(0);
  }

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
    if (shadowingMode === "exam" && allCompleted) {
      handleSubmit();
      return;
    }

    if (!hasStarted) {
      onStartFirstSegment();
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  }

  function handleContinueAction() {
    if (shadowingMode === "exam" && allCompleted) {
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
    <section className="h-full w-full max-w-full overflow-hidden bg-canvas pb-20 text-coal md:overflow-y-auto md:p-4 md:pb-4 xl:overflow-hidden xl:pb-4">
      <div className="mx-auto grid w-full max-w-[1500px] gap-4 xl:h-full xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 overflow-hidden bg-white shadow-[0_18px_45px_rgba(20,20,19,0.07)] md:rounded-2xl md:border md:border-[#e6dfd8] md:p-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b] xl:flex xl:h-full xl:min-h-0 xl:flex-col">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 md:px-0 xl:gap-3 xl:pb-2 xl:pt-0 xl:shrink-0">
            <div className="hidden h-1.5 w-28 rounded-full bg-coal sm:block xl:w-36" />
            <p className="min-w-0 flex-1 truncate text-xs font-black text-ink-body sm:text-sm">{video.title}</p>
            <Badge className="shrink-0 rounded-full bg-coral px-2 text-[11px] font-bold text-white sm:text-xs">{video.level || "A2"}</Badge>
            {isAdmin ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Select
                  disabled={updateVideoMutation.isPending}
                  onValueChange={(val) => {
                    updateVideoMutation.mutate({
                      id: video._id,
                      data: { language: val },
                    });
                  }}
                  value={video.language || (video.transcriptLanguage === "zh" ? "zh-CN" : video.transcriptLanguage === "es" ? "es-ES" : "en-US")}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[125px] rounded-full border-[#e6dfd8] bg-cream-soft px-2.5 text-xs font-bold text-ink-body shadow-none hover:bg-cream dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">🇺🇸 Tiếng Anh</SelectItem>
                    <SelectItem value="zh-CN">🇨🇳 Tiếng Trung</SelectItem>
                    <SelectItem value="es-ES">🇪🇸 Tây Ban Nha</SelectItem>
                  </SelectContent>
                </Select>
                {updateVideoMutation.isPending && <Spinner className="h-3.5 w-3.5 text-coral" />}
              </div>
            ) : (
              <Badge className="shrink-0 rounded-full border border-[#e6dfd8] bg-cream-soft text-xs font-semibold text-ink-body dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5]">
                {video.language === "zh-CN" || video.transcriptLanguage === "zh"
                  ? "🇨🇳 Tiếng Trung"
                  : video.language === "es-ES" || video.transcriptLanguage === "es"
                  ? "🇪🇸 Tây Ban Nha"
                  : "🇺🇸 Tiếng Anh"}
              </Badge>
            )}
          </div>

          <SegmentYoutubePlayer
            className="xl:mx-auto xl:h-[min(36vh,320px)] xl:w-full xl:max-w-[820px] xl:shrink-0"
            disableInteraction
            fitDesktop
            onPlayingChange={onPlayingChange}
            onReadyChange={onReadyChange}
            ref={playerRef}
            segment={segment}
            title={video.title}
            youtubeVideoId={video.youtubeVideoId}
          />

          <div className="min-h-0 space-y-3 px-3 py-4 md:px-0 xl:flex xl:flex-1 xl:flex-col xl:overflow-y-auto xl:py-2">
            {/* Mode Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#e6dfd8] pb-3 dark:border-[#2e2b27]">
              <div className="inline-flex rounded-xl bg-cream-soft p-1 dark:bg-[#252320]">
                <button
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-black transition-all",
                    shadowingMode === "practice"
                      ? "bg-white text-coal shadow-sm dark:bg-[#181715] dark:text-[#faf9f5]"
                      : "text-ink-muted hover:text-coal dark:hover:text-[#faf9f5]",
                  )}
                  onClick={() => handleSubModeChange("practice")}
                  type="button"
                >
                  <Sparkles className={shadowingMode === "practice" ? "text-amber-500" : ""} size={14} />
                  Luyện tập
                </button>
                <button
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-black transition-all",
                    shadowingMode === "exam"
                      ? "bg-coral text-white shadow-sm"
                      : "text-ink-muted hover:text-coal dark:hover:text-[#faf9f5]",
                  )}
                  onClick={() => handleSubModeChange("exam")}
                  type="button"
                >
                  <GraduationCap size={14} />
                  Làm bài thi
                </button>
              </div>

              <div className="flex items-center gap-2">
                {shadowingMode === "practice" ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Sparkles size={13} /> Tự do chọn câu & thử lại
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-2.5 py-1 text-xs font-black text-coral">
                    <GraduationCap size={13} /> Câu {currentIndex + 1} / {segments.length}
                  </span>
                )}

                <Button
                  className={cn(
                    "gap-1 text-xs font-bold xl:hidden",
                    isTranscriptVisible ? "text-coal" : "text-ink-muted",
                  )}
                  onClick={() => setIsTranscriptVisible((current) => !current)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <EyeOff size={14} /> {isTranscriptVisible ? "Ẩn text" : "Hiện text"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-2">
                <Button
                  className="h-11 w-11 rounded-full border-[#e6dfd8] bg-white shadow-sm transition hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]"
                  disabled={currentIndex === 0 || !isYoutubeReady || locked}
                  onClick={() => onMoveAndPlay(-1)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft size={18} />
                </Button>
                <Button
                  className="h-11 w-11 rounded-full border-[#e6dfd8] bg-white shadow-sm transition hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]"
                  disabled={!canUseSegment}
                  onClick={onReplayCurrentSegment}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw size={18} />
                </Button>
                <Button
                  className="h-11 w-11 rounded-full border-[#e6dfd8] bg-white shadow-sm transition hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]"
                  disabled={!canUseSegment}
                  onClick={onToggleCurrentSegmentPlayback}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  {isPlayerPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                <Button
                  className="h-11 w-11 rounded-full border-[#e6dfd8] bg-white shadow-sm transition hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]"
                  disabled={
                    !isYoutubeReady ||
                    locked ||
                    (shadowingMode === "exam" ? !isCurrentSegmentPassed : currentIndex >= segments.length - 1)
                  }
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
                  className={cn("h-12 min-w-52 rounded-xl bg-coal text-base font-bold text-canvas shadow-[0_14px_30px_rgba(20,20,19,0.18)] hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]", actionButtonMotionClass)}
                  disabled={!canUseSegment}
                  onClick={onStartFirstSegment}
                  type="button"
                >
                  <Play size={17} /> Bắt đầu
                </Button>
              </div>
            ) : null}

            {canDeleteProgress ? (
              <div className="flex justify-end">
                <Button
                  className="h-9 gap-2 rounded-xl border-red-200 bg-white text-xs font-black text-red-600 shadow-sm hover:bg-red-50 dark:border-red-900/50 dark:bg-[#252320] dark:text-red-400 dark:hover:bg-red-950/40"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteProgress()}
                  type="button"
                  variant="outline"
                >
                  <Trash2 size={14} /> Xoá tiến độ
                </Button>
              </div>
            ) : null}

            {/* Exam Summary Report when completed in exam mode */}
            {shadowingMode === "exam" && allCompleted ? (
              <ExamSummaryCard
                allCompleted={allCompleted}
                avgAccuracy={avgAccuracy}
                avgCompleteness={avgCompleteness}
                avgFluency={avgFluency}
                avgPronunciation={avgPronunciation}
                isLocked={locked}
                isSubmitting={submitMutation.isPending}
                onRetakeExam={handleRetakeExam}
                onSubmitExam={handleSubmit}
                onSwitchToPractice={() => handleSubModeChange("practice")}
                submitError={submitMutation.isError ? (submitMutation.error?.response?.data?.message || "Không thể nộp bài.") : null}
              />
            ) : null}

            <div className="max-h-[calc(100dvh-430px)] min-h-[210px] space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-0 xl:pr-0">
              <CurrentTurnCard
                assessmentResult={assessmentResult}
                bestScore={currentBestScore}
                currentIndex={currentIndex}
                isAssessing={assessMutation.isPending}
                isCurrentPassed={isCurrentSegmentPassed}
                isLocked={locked}
                isRecording={isRecording}
                isTranscriptVisible={isTranscriptVisible}
                language={video?.language || (video?.transcriptLanguage === "zh" ? "zh-CN" : video?.transcriptLanguage === "es" ? "es-ES" : "en-US")}
                recordingError={recordingError}
                segment={activeSegment}
                shadowingMode={shadowingMode}
                totalSegments={segments.length}
              />
              <MobileTranscriptFeed
                currentIndex={currentIndex}
                isTranscriptVisible={isTranscriptVisible}
                language={video?.language || (video?.transcriptLanguage === "zh" ? "zh-CN" : video?.transcriptLanguage === "es" ? "es-ES" : "en-US")}
                maxSelectableIndex={shadowingMode === "practice" ? segments.length : unlockedUntilIndex}
                onSelectSegment={handleSelectSegment}
                segments={segments}
                shadowingMode={shadowingMode}
              />
            </div>

            <div className="hidden shrink-0 items-center justify-center gap-3 pt-2 xl:flex">
              {showResultActions ? (
                shadowingMode === "practice" || isCurrentSegmentPassed ? (
                  <>
                    <Button
                      className={cn("h-12 min-w-44 rounded-xl border-[#e6dfd8] bg-white text-sm font-black uppercase text-ink-muted shadow-sm hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]", actionButtonMotionClass)}
                      disabled={!canUseSegment || assessMutation.isPending || locked}
                      onClick={handleRetryAction}
                      type="button"
                      variant="outline"
                    >
                      <Mic size={16} /> Thử lại
                    </Button>
                    <Button
                      className={cn("h-12 min-w-48 rounded-xl bg-coal text-sm font-bold text-canvas shadow-[0_14px_30px_rgba(20,20,19,0.18)] hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]", actionButtonMotionClass)}
                      disabled={!isYoutubeReady || locked}
                      isLoading={submitMutation.isPending}
                      onClick={handleContinueAction}
                      type="button"
                    >
                      {!submitMutation.isPending && (allCompleted ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />)}
                      {allCompleted ? (shadowingMode === "exam" ? "Hoàn thành bài thi" : "Hoàn thành") : "Tiếp tục"}
                    </Button>
                  </>
                ) : (
                  <Button
                    className={cn("h-12 min-w-48 rounded-xl bg-coal text-sm font-bold text-canvas shadow-[0_14px_30px_rgba(20,20,19,0.18)] hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]", actionButtonMotionClass)}
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
                    className={cn("h-12 min-w-44 rounded-xl border-[#e6dfd8] bg-white text-sm font-black uppercase text-ink-muted shadow-sm hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]", actionButtonMotionClass)}
                    disabled={!hasStarted}
                    onClick={onReplayCurrentSegment}
                    type="button"
                    variant="outline"
                  >
                    <Play size={16} /> Phát lại ghi âm
                  </Button>
                  <Button
                    className={cn(
                      "h-12 min-w-48 rounded-xl bg-coal text-sm font-bold text-canvas shadow-[0_14px_30px_rgba(20,20,19,0.18)] hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]",
                      actionButtonMotionClass,
                      isRecording && recordingButtonClass,
                    )}
                    disabled={!canUseSegment || !hasStarted || assessMutation.isPending || locked}
                    isLoading={assessMutation.isPending}
                    onClick={isRecording ? stopRecording : startRecording}
                    type="button"
                  >
                    <Mic className={cn(isRecording && "animate-bounce")} size={16} />
                    {isRecording ? "Dừng ghi âm" : "Ghi âm"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden min-h-0 flex-col rounded-2xl border border-[#e6dfd8] bg-white p-4 shadow-[0_18px_45px_rgba(20,20,19,0.07)] dark:border-[#2e2b27] dark:bg-[#1f1e1b] xl:flex xl:h-full xl:max-h-full">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="eyebrow">{shadowingMode === "exam" ? "Bài thi Shadowing" : "Bản chép & Luyện tập"}</h2>
              {shadowingMode === "exam" ? (
                <p className="text-[11px] font-semibold text-ink-muted">
                  Đã đạt {completedCount}/{segments.length} câu
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-coal px-3 py-1 text-sm font-black text-canvas dark:bg-[#252320] dark:text-[#faf9f5] dark:border dark:border-[#2e2b27]">
              {shadowingMode === "exam" ? `${Math.round((completedCount / (segments.length || 1)) * 100)}%` : `${progressPercent}%`}
            </span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-cream-soft dark:bg-[#252320]">
            <div
              className="h-full rounded-full bg-coral transition-all duration-300"
              style={{
                width: `${shadowingMode === "exam" ? Math.round((completedCount / (segments.length || 1)) * 100) : progressPercent}%`,
              }}
            />
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {segments.length ? (
              segments.map((item, index) => {
                const score = getBestScore(item._id);
                const bestScore = score?.bestPronunciationScore;
                const passed = bestScore !== undefined && bestScore >= passingScore;
                const isSelectable = locked || shadowingMode === "practice" || index <= unlockedUntilIndex;
                return (
                  <TranscriptCard
                    bestScore={bestScore}
                    index={index}
                    isActive={index === currentIndex}
                    isLocked={locked}
                    isSelectable={isSelectable}
                    item={item}
                    key={item._id}
                    onSelectSegment={handleSelectSegment}
                    passed={passed}
                    shadowingMode={shadowingMode}
                  />
                );
              })
            ) : (
              <Card className="rounded-2xl border-dashed border-[#e6dfd8] bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320]">
                <CardContent className="p-4 text-sm font-bold text-ink-muted">Chưa có bản chép cho video này.</CardContent>
              </Card>
            )}
          </div>

          {allCompleted && !locked && shadowingMode === "exam" ? (
            <div className="mt-4 border-t border-[#e6dfd8] pt-4 dark:border-[#2e2b27]">
              <div className="flex items-center justify-between text-sm font-semibold text-ink-muted">
                <span>Điểm TB bài thi</span>
                <span className="text-lg font-black text-coal dark:text-[#faf9f5]">
                  {avgPronunciation}đ
                </span>
              </div>
              <Button
                className="mt-6 w-full rounded-full bg-coral text-white hover:bg-coral-dark"
                disabled={locked}
                isLoading={submitMutation.isPending}
                onClick={handleSubmit}
                size="lg"
                type="button"
              >
                {!submitMutation.isPending && <CheckCircle2 size={18} />}
                Nộp bài thi
              </Button>
              {submitMutation.isError ? (
                <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                  {submitMutation.error?.response?.data?.message || "Không thể nộp bài."}
                </p>
              ) : null}
            </div>
          ) : null}

          {locked ? (
            <div className="mt-4 border-t border-[#e6dfd8] pt-4 dark:border-[#2e2b27]">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 size={16} />
                Đã nộp — TB {effectiveSession?.averageScore || 0}đ
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="mt-4 border-t border-[#e6dfd8] pt-4 dark:border-[#2e2b27]">
              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                Admin ({sessionsLoading ? "..." : (allSessions?.length || 0)})
              </h3>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {(allSessions || []).map((s) => (
                  <div className="rounded-lg border border-[#e6dfd8] bg-cream-soft p-2 text-xs dark:border-[#2e2b27] dark:bg-[#252320]" key={s._id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-ink-muted">{s.sessionId.slice(0, 12)}…</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-coal dark:text-[#faf9f5]">{s.averageScore}đ</span>
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e6dfd8] bg-white/95 p-3 shadow-[0_-18px_36px_rgba(20,20,19,0.10)] backdrop-blur dark:border-[#2e2b27] dark:bg-[#181715]/95 xl:hidden">
        {hasStarted && showResultActions && (shadowingMode === "practice" || isCurrentSegmentPassed) ? (
          <div className="grid grid-cols-[0.85fr_1fr] gap-2">
            <Button
              className={cn("h-14 rounded-2xl border-[#e6dfd8] bg-white text-base font-black text-ink-muted shadow-sm dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5]", actionButtonMotionClass)}
              disabled={!activeSegment || !isYoutubeReady || assessMutation.isPending || locked}
              onClick={handleRetryAction}
              type="button"
              variant="outline"
            >
              <Mic size={17} /> Thử lại
            </Button>
            <Button
              className={cn("h-14 rounded-2xl bg-coal text-base font-bold text-canvas shadow-lg hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]", actionButtonMotionClass)}
              disabled={!activeSegment || !isYoutubeReady || locked}
              isLoading={submitMutation.isPending}
              onClick={handleContinueAction}
              type="button"
            >
              {!submitMutation.isPending && (allCompleted ? <CheckCircle2 size={17} /> : <ChevronRight size={17} />)}
              {allCompleted ? (shadowingMode === "exam" ? "Hoàn thành bài thi" : "Hoàn thành") : "Tiếp tục"}
            </Button>
          </div>
        ) : (
          <Button
            className={cn(
              "h-14 w-full rounded-2xl bg-coal text-base font-bold text-canvas shadow-lg hover:bg-coral-dark dark:bg-[#faf9f5] dark:text-[#181715]",
              actionButtonMotionClass,
              isRecording && recordingButtonClass,
            )}
            disabled={!activeSegment || !isYoutubeReady || locked}
            isLoading={assessMutation.isPending || submitMutation.isPending}
            onClick={hasStarted && showResultActions && !(shadowingMode === "practice" || isCurrentSegmentPassed) ? handleRetryAction : handlePrimaryAction}
            type="button"
          >
            {!(assessMutation.isPending || submitMutation.isPending) && (
              hasStarted ? (
                <Mic className={cn(isRecording && "animate-bounce")} size={17} />
              ) : (
                <Play size={17} />
              )
            )}
            {hasStarted
              ? (isRecording ? "Dừng ghi âm" : showResultActions ? "Nói lại" : "Ghi âm")
              : "Bắt đầu"}
          </Button>
        )}
      </div>
    </section>
  );
}

function ExamSummaryCard({
  allCompleted,
  avgAccuracy,
  avgCompleteness,
  avgFluency,
  avgPronunciation,
  isLocked,
  isSubmitting,
  onRetakeExam,
  onSubmitExam,
  onSwitchToPractice,
  submitError,
}) {
  const grade = getExamGrade(avgPronunciation);

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-coral/30 bg-gradient-to-b from-white via-white to-coral/5 shadow-[0_20px_50px_rgba(204,120,92,0.14)] dark:from-[#1f1e1b] dark:to-coral/10">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dfd8] pb-4 dark:border-[#2e2b27]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral/10 text-coral">
              <Trophy size={22} />
            </div>
            <div>
              <h3 className="font-display text-base font-black text-coal dark:text-[#faf9f5]">
                Bảng điểm bài thi Shadowing
              </h3>
              <p className="text-xs font-semibold text-ink-muted">
                Bạn đã hoàn thành kiểm tra tất cả các câu trong bài
              </p>
            </div>
          </div>
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-black", grade.badgeClass)}>
            {grade.title}
          </Badge>
        </div>

        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#e6dfd8] bg-cream-soft/50 p-3 text-center dark:border-[#2e2b27] dark:bg-[#252320]">
            <span className="text-[11px] font-black uppercase text-ink-muted">Điểm tổng</span>
            <p className={cn("mt-1 text-2xl font-black", grade.colorClass)}>
              {avgPronunciation}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6dfd8] bg-cream-soft/50 p-3 text-center dark:border-[#2e2b27] dark:bg-[#252320]">
            <span className="text-[11px] font-black uppercase text-ink-muted">Độ chuẩn xác</span>
            <p className="mt-1 text-2xl font-black text-coal dark:text-[#faf9f5]">
              {avgAccuracy}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6dfd8] bg-cream-soft/50 p-3 text-center dark:border-[#2e2b27] dark:bg-[#252320]">
            <span className="text-[11px] font-black uppercase text-ink-muted">Độ lưu loát</span>
            <p className="mt-1 text-2xl font-black text-coal dark:text-[#faf9f5]">
              {avgFluency}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6dfd8] bg-cream-soft/50 p-3 text-center dark:border-[#2e2b27] dark:bg-[#252320]">
            <span className="text-[11px] font-black uppercase text-ink-muted">Độ trọn vẹn</span>
            <p className="mt-1 text-2xl font-black text-coal dark:text-[#faf9f5]">
              {avgCompleteness}
            </p>
          </div>
        </div>

        <p className="mb-5 rounded-xl bg-cream-soft/60 p-3 text-center text-xs font-semibold text-ink-body dark:bg-[#252320] dark:text-[#dfdcd6]">
          {grade.message}
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            className="rounded-xl text-xs font-bold"
            onClick={onSwitchToPractice}
            type="button"
            variant="ghost"
          >
            <Sparkles size={14} /> Chuyển sang Luyện tập
          </Button>

          {!isLocked ? (
            <>
              <Button
                className="rounded-xl border-[#e6dfd8] text-xs font-bold dark:border-[#2e2b27]"
                onClick={onRetakeExam}
                type="button"
                variant="outline"
              >
                <RotateCcw size={14} /> Thi lại từ đầu
              </Button>
              <Button
                className="gap-1.5 rounded-xl bg-coral text-xs font-black text-white hover:bg-coral-dark"
                isLoading={isSubmitting}
                onClick={onSubmitExam}
                type="button"
              >
                {!isSubmitting && <CheckCircle2 size={15} />}
                Nộp bài thi & Lưu kết quả
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Đã nộp bài thi
            </div>
          )}
        </div>

        {submitError ? (
          <p className="mt-3 text-right text-xs font-semibold text-red-600 dark:text-red-400">
            {submitError}
          </p>
        ) : null}
      </CardContent>
    </Card>
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
  language = "en-US",
  recordingError,
  segment,
  shadowingMode,
  totalSegments,
}) {
  if (!segment) {
    return (
      <Card className="rounded-2xl border-dashed border-[#e6dfd8] bg-white shadow-[0_14px_32px_rgba(204,120,92,0.06)] dark:border-[#2e2b27] dark:bg-[#1f1e1b]">
        <CardContent className="p-5 text-sm font-bold text-ink-muted">Chưa có transcript để luyện shadowing.</CardContent>
      </Card>
    );
  }

  const latestScore = assessmentResult?.pronunciationScore;
  const showAttempted = bestScore !== undefined && !isLocked;

  return (
    <Card className="rounded-2xl border border-coral/55 bg-white shadow-[0_18px_42px_rgba(204,120,92,0.12)] dark:border-coral/40 dark:bg-[#1f1e1b]">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-cream-soft px-2 text-xs font-black text-ink-muted dark:bg-[#252320] dark:text-[#a09d96]">
              {segment.index || currentIndex + 1}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              {shadowingMode === "exam" ? `Câu thi ${segment.index || currentIndex + 1} / ${totalSegments}` : "Lượt của bạn"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLocked ? (
              <Badge className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Đã nộp</Badge>
            ) : latestScore !== undefined ? (
              <Badge className={cn("rounded-full", getScoreBadgeClass(latestScore))}>
                {latestScore}
              </Badge>
            ) : isAssessing ? (
              <Badge className="rounded-full bg-cream text-ink-muted dark:bg-[#252320] dark:text-[#a09d96]">Đang chấm</Badge>
            ) : isRecording ? (
              <Badge className="rounded-full bg-[#ffe2e2] text-[#e9414f] dark:bg-red-950/60 dark:text-red-300">Đang ghi</Badge>
            ) : null}
          </div>
        </div>

        {showAttempted ? (
          shadowingMode === "exam" ? (
            !isCurrentPassed ? (
              <p className="text-sm font-bold text-[#e9414f] dark:text-red-400">
                Điểm {bestScore} — cần ≥ {passingScore} để qua câu này trong bài thi
              </p>
            ) : (
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Đạt chuẩn ({bestScore}đ) — Bạn có thể thử lại hoặc bấm Tiếp tục
              </p>
            )
          ) : (
            <p className={cn("text-xs font-semibold", bestScore >= passingScore ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
              Điểm gần nhất: {bestScore}đ {bestScore >= passingScore ? "• Phát âm tốt!" : "• Chú ý màu từ bên dưới để phát âm chính xác hơn"}
            </p>
          )
        ) : null}

        {isTranscriptVisible ? (
          <div className="space-y-2">
            <WordLine assessmentWords={assessmentResult?.words} language={language} text={segment.text} />
            <TranslationLine text={segment.translationText} />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#e6dfd8] bg-cream-soft/70 px-3 py-4 text-center text-sm font-bold text-ink-muted dark:border-[#2e2b27] dark:bg-[#252320]/70 dark:text-[#a09d96]">
            Transcript đang ẩn
          </p>
        )}
        {recordingError ? <p className="text-sm font-bold text-[#e9414f] dark:text-red-400">{recordingError}</p> : null}
      </CardContent>
    </Card>
  );
}

function TranscriptCard({ bestScore, index, isActive, isLocked, isSelectable, item, onSelectSegment, passed, shadowingMode }) {
  const scoreClass = bestScore !== undefined
    ? (passed ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-[#ffe2e2] text-[#e9414f] dark:bg-red-950/60 dark:text-red-300")
    : "bg-cream-soft text-ink-body dark:bg-[#252320] dark:text-[#faf9f5]";
  return (
    <Card
      className={cn(
        "rounded-2xl border bg-white shadow-sm transition hover:bg-cream-soft/50 dark:border-[#2e2b27] dark:bg-[#252320] dark:hover:bg-[#2c2925]",
        isActive ? "border-coral bg-coral/5 shadow-[0_10px_24px_rgba(204,120,92,0.10)] dark:border-coral dark:bg-coral/10" : "border-[#e6dfd8]",
        !isSelectable && "opacity-60 cursor-not-allowed",
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
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-[#e6dfd8] bg-cream-soft px-2 text-xs font-black text-ink-body dark:border-[#2e2b27] dark:bg-[#181715] dark:text-[#faf9f5]">
                #{item.index || index + 1}
              </span>
              <div className="flex items-center gap-2">
                {bestScore !== undefined ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-black", scoreClass)}>
                    {bestScore}
                  </span>
                ) : null}
                {isLocked ? (
                  <span className="text-xs text-emerald-600 font-semibold dark:text-emerald-400">✓</span>
                ) : null}
                <span className="text-xs font-black text-ink-muted">{formatDuration(Number(item.endTime || 0))}</span>
              </div>
            </div>
            <p className="whitespace-normal text-sm font-black leading-6 text-coal dark:text-[#faf9f5]">{item.text}</p>
            <TranslationLine text={item.translationText} />
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}

function MobileTranscriptFeed({ currentIndex, isTranscriptVisible, language = "en-US", maxSelectableIndex, onSelectSegment, segments, shadowingMode }) {
  const upcomingSegments = segments.slice(currentIndex + 1);
  if (!upcomingSegments.length) return null;

  return (
    <div className="space-y-2 pb-2 xl:hidden">
      {upcomingSegments.map((item, offset) => {
        const index = currentIndex + offset + 1;
        const isSelectable = shadowingMode === "practice" || index <= maxSelectableIndex;

        return (
        <Card
          className={cn("rounded-2xl border border-[#e6dfd8] bg-white shadow-sm dark:border-[#2e2b27] dark:bg-[#252320]", isSelectable ? "opacity-75" : "opacity-45")}
          key={item._id}
        >
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-cream-soft px-2 text-xs font-black text-ink-muted dark:bg-[#181715] dark:text-[#a09d96]">
                  {item.index || index + 1}
                </span>
                <span className="text-xs font-black uppercase tracking-wide text-[#a3acba] dark:text-[#a09d96]">
                  {shadowingMode === "exam" ? `Câu tiếp theo (#${item.index || index + 1})` : "Tiếp theo"}
                </span>
              </div>
              <Button
                className="h-8 px-2 text-ink-muted hover:text-coal dark:hover:text-[#faf9f5]"
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
                <WordLine isMuted={index !== currentIndex} language={language} text={item.text} />
                <TranslationLine isMuted={index !== currentIndex} text={item.translationText} />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[#e6dfd8] bg-cream-soft px-3 py-4 text-center text-sm font-bold text-[#a3acba] dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96]">
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
  if (score >= 85) return "bg-[#d7f8df] text-[#0e7a3d] dark:bg-emerald-950/60 dark:text-emerald-300";
  if (score >= 60) return "bg-[#fff2c7] text-[#9a6500] dark:bg-amber-950/60 dark:text-amber-300";
  return "bg-[#ffe2e2] text-[#e9414f] dark:bg-red-950/60 dark:text-red-300";
}

function getWordColorClass(color) {
  if (color === "green") return "text-[#159447] dark:text-emerald-400";
  if (color === "yellow") return "text-[#c37a00] dark:text-amber-400";
  if (color === "red") return "text-[#e9414f] dark:text-red-400";
  return "";
}

function splitTextWords(text, language = "en-US") {
  const raw = String(text || "").trim();
  if (!raw) return [];
  if (language && language.toLowerCase().startsWith("zh")) {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
      const segments = Array.from(segmenter.segment(raw))
        .map((s) => s.segment.trim())
        .filter(Boolean);
      if (segments.length > 0) return segments;
    }
    return Array.from(raw).filter((ch) => !/\s/.test(ch));
  }
  return raw.split(/\s+/).filter(Boolean);
}

function WordLine({ assessmentWords, isMuted = false, language = "en-US", text }) {
  const words = splitTextWords(text, language);

  return (
    <div className={cn("flex flex-wrap gap-x-1.5 gap-y-1 text-base font-semibold leading-6", isMuted ? "text-[#687386] dark:text-[#a09d96]" : "text-coal dark:text-[#faf9f5]")}>
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
