import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  FilePenLine,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { cn } from "../../../utils/cn.js";
import { useAssessShadowing } from "../hooks/useVideoLearning.js";
import { formatDuration } from "../utils/dictationText.js";
import SegmentYoutubePlayer from "./SegmentYoutubePlayer.jsx";

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
  onSelectSegment,
  onStartFirstSegment,
  onToggleCurrentSegmentPlayback,
  playerRef,
  progressPercent,
  segment,
  segments,
  video,
}) {
  const [isAutoPauseEnabled, setIsAutoPauseEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [recordingError, setRecordingError] = useState("");
  const assessMutation = useAssessShadowing();
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingSegmentRef = useRef(null);
  const skipSubmitRef = useRef(false);
  const canUseSegment = Boolean(segment && isYoutubeReady);
  const activeSegment = segment || segments[0];

  function handlePrimaryAction() {
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

  async function submitRecording(audioBlob, targetSegment) {
    if (!targetSegment?._id) return;

    const formData = new FormData();
    const extension = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
    formData.append("sessionId", getGuestSessionId());
    formData.append("segmentId", targetSegment._id);
    formData.append("audio", audioBlob, `shadowing-${targetSegment._id}.${extension}`);

    const response = await assessMutation.mutateAsync(formData);
    setAssessmentResult(response.data.data);
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                className="h-8 gap-2 px-0 text-sm font-bold text-coal hover:bg-transparent"
                onClick={() => setIsAutoPauseEnabled((current) => !current)}
                type="button"
                variant="ghost"
              >
                <span
                  className={cn(
                    "relative h-4 w-9 rounded-full transition",
                    isAutoPauseEnabled ? "bg-coral" : "bg-[#e6dfd8]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-3 w-3 rounded-full bg-white transition",
                      isAutoPauseEnabled ? "left-5" : "left-1",
                    )}
                  />
                </span>
                Tự động dừng
              </Button>

              <div className="flex items-center gap-2">
                <Button size="icon" type="button" variant="ghost">
                  <Settings size={17} />
                </Button>
                <span className="inline-flex items-center gap-1 text-sm font-black text-coal">
                  <Zap size={16} /> 1x
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div aria-hidden="true" />
              <div className="flex items-center justify-center gap-2">
                <Button
                  className="h-10 w-10 rounded-full border-[#e6dfd8] bg-white shadow-sm"
                  disabled={currentIndex === 0 || !isYoutubeReady}
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
                  disabled={!canUseSegment}
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
                  className="h-12 min-w-52 bg-coral text-base text-white hover:bg-coral-dark"
                  disabled={!canUseSegment}
                  onClick={onStartFirstSegment}
                  type="button"
                >
                  <Play size={17} /> Bắt đầu
                </Button>
              </div>
            ) : null}

            <div className="max-h-[calc(100dvh-430px)] min-h-[210px] space-y-3 overflow-y-auto overscroll-contain pb-2 pr-1 xl:max-h-none xl:min-h-0 xl:overflow-visible xl:pr-0">
              <CurrentTurnCard
                assessmentResult={assessmentResult}
                currentIndex={currentIndex}
                isRecording={isRecording}
                isAssessing={assessMutation.isPending}
                isTranscriptVisible={isTranscriptVisible}
                recordingError={recordingError}
                segment={activeSegment}
              />
              <MobileTranscriptFeed
                currentIndex={currentIndex}
                isTranscriptVisible={isTranscriptVisible}
                onSelectSegment={onSelectSegment}
                segments={segments}
              />
            </div>

            <div className="hidden items-center justify-center gap-3 xl:flex">
              <Button
                className="h-12 min-w-44 rounded-2xl border-[#e6dfd8] bg-white text-sm font-black uppercase text-ink-muted shadow-sm"
                disabled={!hasStarted}
                onClick={onReplayCurrentSegment}
                type="button"
                variant="outline"
              >
                <Play size={16} /> Phát lại ghi âm
              </Button>
              <Button
                className="h-12 min-w-48 bg-coral text-sm text-white hover:bg-coral-dark"
                disabled={!canUseSegment || !hasStarted || assessMutation.isPending}
                onClick={isRecording ? stopRecording : startRecording}
                type="button"
              >
                <Mic size={16} /> {assessMutation.isPending ? "Đang chấm..." : isRecording ? "Dừng ghi âm" : "Ghi âm"}
              </Button>
            </div>
          </div>
        </main>

        <ShadowingTranscriptList
          currentIndex={currentIndex}
          onSelectSegment={onSelectSegment}
          progressPercent={progressPercent}
          segments={segments}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e6dfd8] bg-canvas p-3 xl:hidden">
        <Button
          className="h-14 w-full bg-coral text-base text-white shadow-lg hover:bg-coral-dark"
          disabled={!activeSegment || !isYoutubeReady || assessMutation.isPending}
          onClick={handlePrimaryAction}
          type="button"
        >
          {hasStarted ? <Mic size={17} /> : <Play size={17} />}
          {hasStarted ? (assessMutation.isPending ? "Đang chấm..." : isRecording ? "Dừng ghi âm" : "Ghi âm") : "Bắt đầu"}
        </Button>
      </div>
    </section>
  );
}

function CurrentTurnCard({
  assessmentResult,
  currentIndex,
  isAssessing,
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
            {assessmentResult ? (
              <Badge className={cn("rounded-full", getScoreBadgeClass(assessmentResult.pronunciationScore))}>
                {assessmentResult.pronunciationScore}
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

        {isTranscriptVisible ? (
          <WordLine assessmentWords={assessmentResult?.words} text={segment.text} />
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

function ShadowingTranscriptList({ currentIndex, onSelectSegment, progressPercent, segments }) {
  return (
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
          segments.map((item, index) => (
            <TranscriptCard
              index={index}
              isActive={index === currentIndex}
              item={item}
              key={item._id}
              onSelectSegment={onSelectSegment}
            />
          ))
        ) : (
          <Card className="rounded-2xl border-dashed border-[#e6dfd8] bg-cream-soft">
            <CardContent className="p-4 text-sm font-bold text-ink-muted">Chưa có bản chép cho video này.</CardContent>
          </Card>
        )}
      </div>
    </aside>
  );
}

function TranscriptCard({ index, isActive, item, onSelectSegment }) {
  return (
    <Card
      className={cn(
        "rounded-2xl border bg-white shadow-sm transition",
        isActive ? "border-2 border-coral bg-cream" : "border-[#e6dfd8]",
      )}
    >
      <CardContent className="p-3">
        <Button
          className="h-auto w-full justify-start p-0 text-left hover:bg-transparent"
          onClick={() => onSelectSegment(index)}
          type="button"
          variant="ghost"
        >
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[#e6dfd8] bg-cream-soft px-2 text-xs font-black text-ink-body">
                #{item.index || index + 1}
              </span>
              <span className="text-xs font-black text-ink-muted">{formatDuration(Number(item.endTime || 0))}</span>
            </div>
            <p className="whitespace-normal text-sm font-black leading-6 text-coal">{item.text}</p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}

function MobileTranscriptFeed({ currentIndex, isTranscriptVisible, onSelectSegment, segments }) {
  const upcomingSegments = segments.slice(currentIndex + 1);
  if (!upcomingSegments.length) return null;

  return (
    <div className="space-y-2 pb-2 xl:hidden">
      {upcomingSegments.map((item, offset) => {
        const index = currentIndex + offset + 1;

        return (
        <Card
          className="rounded-2xl border border-[#e6dfd8] bg-white opacity-70 shadow-sm"
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
                onClick={() => onSelectSegment(index)}
                type="button"
                variant="ghost"
              >
                <FilePenLine size={16} />
              </Button>
            </div>
            {isTranscriptVisible ? (
              <WordLine isMuted={index !== currentIndex} text={item.text} />
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
    <div className={cn("flex flex-wrap gap-x-3 gap-y-2 text-base font-black leading-7", isMuted ? "text-[#687386]" : "text-coal")}>
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

export { MobileTranscriptFeed };
