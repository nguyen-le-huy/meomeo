import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Captions,
  Clock,
  Eye,
  RefreshCw,
  Sparkles,
  Tv,
  Volume2,
  X,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import SegmentYoutubePlayer from "../components/SegmentYoutubePlayer.jsx";
import VideoReadingAudioBar from "../components/reading/VideoReadingAudioBar.jsx";
import VideoReadingEditDialog from "../components/reading/VideoReadingEditDialog.jsx";
import VideoReadingLine from "../components/reading/VideoReadingLine.jsx";
import VideoReadingToolbar from "../components/reading/VideoReadingToolbar.jsx";
import {
  useBilingualVideo,
  useGenerateVietsub,
  useUpdateBilingualSegment,
} from "../../bilingual/hooks/useBilingualWatch.js";
import { formatDuration } from "../utils/videoLibrary.js";
import { cn } from "../../../utils/cn.js";

function groupSegmentsIntoStanzas(segments) {
  if (!segments || !segments.length) return [];
  const stanzas = [];
  let currentStanza = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = segments[i - 1];

    const isTimeGap = prevSegment && segment.startTime - prevSegment.endTime >= 1.5;
    const isFull = currentStanza.length >= 4;
    const isSentenceEnd =
      prevSegment &&
      /[.!?]$/.test(prevSegment.text?.trim() || "") &&
      currentStanza.length >= 3;

    if (currentStanza.length > 0 && (isTimeGap || isFull || isSentenceEnd)) {
      stanzas.push(currentStanza);
      currentStanza = [];
    }

    currentStanza.push(segment);
  }

  if (currentStanza.length) {
    stanzas.push(currentStanza);
  }

  return stanzas;
}

export default function VideoReadingPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const { data, error, isLoading } = useBilingualVideo(id);
  const updateSegmentMutation = useUpdateBilingualSegment(id);
  const generateVietsubMutation = useGenerateVietsub(id);

  const video = data?.video;
  const segments = useMemo(() => data?.segments || [], [data?.segments]);

  const playerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fontSize, setFontSize] = useState("md");
  const [displayMode, setDisplayMode] = useState("bilingual");
  const [autoScroll, setAutoScroll] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const userScrollingTimeoutRef = useRef(null);
  const isUserScrollingRef = useRef(false);

  const duration = video?.duration || (segments.length ? segments[segments.length - 1].endTime : 0);

  const activeIndex = useMemo(() => {
    return segments.findIndex(
      (segment) => currentTime >= segment.startTime && currentTime < segment.endTime,
    );
  }, [currentTime, segments]);

  const activeSegment = activeIndex >= 0 ? segments[activeIndex] : null;

  const stanzas = useMemo(() => groupSegmentsIntoStanzas(segments), [segments]);

  // Listen to manual user scroll to avoid fighting the user
  useEffect(() => {
    function handleUserScroll() {
      isUserScrollingRef.current = true;
      if (userScrollingTimeoutRef.current) {
        window.clearTimeout(userScrollingTimeoutRef.current);
      }
      userScrollingTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 3000);
    }

    window.addEventListener("wheel", handleUserScroll, { passive: true });
    window.addEventListener("touchmove", handleUserScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleUserScroll);
      window.removeEventListener("touchmove", handleUserScroll);
      if (userScrollingTimeoutRef.current) {
        window.clearTimeout(userScrollingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to active segment ONLY when autoScroll is enabled AND user is not manually scrolling
  useEffect(() => {
    if (!autoScroll || !activeSegment?._id || isUserScrollingRef.current) return;
    const element = document.querySelector(`[data-segment-id="${activeSegment._id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeSegment?._id, autoScroll]);

  // Player handlers
  const handlePlayFrom = useCallback((startTime) => {
    playerRef.current?.playFrom(startTime);
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
    } else {
      if (currentTime > 0) {
        playerRef.current?.playFrom(currentTime);
      } else {
        playerRef.current?.playVideo();
      }
      setIsPlaying(true);
    }
  }, [currentTime, isPlaying]);

  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
    playerRef.current?.playFrom(time);
  }, []);

  const handleReplaySegment = useCallback(() => {
    if (activeSegment) {
      handlePlayFrom(activeSegment.startTime);
    }
  }, [activeSegment, handlePlayFrom]);

  const handleChangePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    const iframe = document.querySelector("#reading-yt-player iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "setPlaybackRate", args: [rate] }),
        "*",
      );
    }
  }, []);

  const handleCopyAll = useCallback(() => {
    const lines = [];
    stanzas.forEach((stanza, sIdx) => {
      stanza.forEach((seg) => {
        if (displayMode === "bilingual") {
          lines.push(seg.text);
          if (seg.translationText) lines.push(seg.translationText);
        } else if (displayMode === "vi-only") {
          lines.push(seg.translationText || seg.text);
        } else {
          lines.push(seg.text);
        }
      });
      if (sIdx < stanzas.length - 1) lines.push("");
    });

    const fullText = lines.join("\n");
    return navigator.clipboard.writeText(fullText);
  }, [displayMode, stanzas]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSaveSegment = useCallback(
    async (segmentId, segmentData) => {
      await updateSegmentMutation.mutateAsync({
        segmentId,
        data: segmentData,
      });
    },
    [updateSegmentMutation],
  );

  const hasTranslations = useMemo(() => {
    return segments.some((s) => Boolean(s.translationText?.trim()));
  }, [segments]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-canvas">
        <LoadingState label="Đang tải bài đọc song ngữ..." />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <p className="font-display text-2xl font-semibold text-coal">Không tìm thấy video</p>
        <p className="text-sm text-ink-muted">Video này có thể đã bị gỡ hoặc không tồn tại.</p>
        <Button asChild variant="outline">
          <Link to="/youtube">
            <ArrowLeft className="mr-2 h-4 w-4" /> Về thư viện YouTube
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] pb-28 text-[#141413]">
      {/* Top Reading Navigation Bar */}
      <VideoReadingToolbar
        autoScroll={autoScroll}
        displayMode={displayMode}
        fontSize={fontSize}
        onCopyAll={handleCopyAll}
        onPrint={handlePrint}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
        onUpdateDisplayMode={setDisplayMode}
        onUpdateFontSize={setFontSize}
        videoId={video._id}
        videoTitle={video.title}
      />

      {/* Main Editorial Article Container */}
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-16 sm:px-6 md:pt-12">
        {/* Article Headline & Metadata */}
        <header className="mb-8 border-b border-[#e6dfd8] pb-6 sm:mb-10 sm:pb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-coral">
              {video.channelTitle || "YouTube Transcript"}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(video.duration || 0)}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
              <Captions className="h-3.5 w-3.5" />
              {segments.length} câu
            </span>
          </div>

          <h1 className="font-serif text-2xl font-normal leading-snug tracking-tight text-coal sm:text-3xl lg:text-4xl">
            {video.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
            <p>
              Bản đọc phụ đề song ngữ · Nhấp vào câu bất kỳ hoặc bấm Play để nghe phát âm đồng bộ
            </p>
            <div className="flex items-center gap-2">
              <Button asChild className="h-7 text-xs font-medium" size="sm" variant="ghost">
                <Link to={`/videos/${video._id}/bilingual`}>
                  <Tv className="mr-1.5 h-3.5 w-3.5 text-coral" /> Xem có video
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Translation Alert if missing */}
        {!hasTranslations ? (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Bài đọc này hiện chưa có bản dịch tiếng Việt</p>
                <p className="text-xs text-amber-700">
                  {isAdmin
                    ? "Bạn có thể bấm nút bên phải để AI tự động dịch song ngữ toàn bộ video."
                    : "Chờ ban quản trị cập nhật bản dịch hoặc đọc trước bản phụ đề tiếng Anh."}
                </p>
              </div>
              {isAdmin ? (
                <Button
                  className="h-8 shrink-0 bg-coral text-xs text-white hover:bg-coral/90"
                  disabled={generateVietsubMutation.isPending}
                  onClick={() => generateVietsubMutation.mutate({})}
                  size="sm"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {generateVietsubMutation.isPending ? "Đang dịch AI..." : "Dịch tiếng Việt (AI)"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Article Body: Grouped by Stanzas / Paragraphs (like Image 2) */}
        <article className="article-body">
          {stanzas.length > 0 ? (
            stanzas.map((stanza, stanzaIndex) => (
              <section
                className="mb-7 space-y-2 sm:mb-9 sm:space-y-2.5"
                key={`stanza-${stanzaIndex}`}
              >
                {stanza.map((seg) => (
                  <VideoReadingLine
                    displayMode={displayMode}
                    fontSize={fontSize}
                    isActive={activeSegment?._id === seg._id}
                    isAdmin={isAdmin}
                    key={seg._id}
                    onEdit={setEditingSegment}
                    onPlaySegment={handlePlayFrom}
                    segment={seg}
                  />
                ))}
              </section>
            ))
          ) : (
            <div className="py-12 text-center text-ink-muted">
              <p className="font-display text-lg">Chưa có dữ liệu phụ đề cho video này.</p>
            </div>
          )}
        </article>
      </main>

      {/* Floating Picture-in-Picture Mini Video Player */}
      <div
        className={cn(
          "fixed bottom-24 right-4 z-40 w-72 overflow-hidden rounded-xl border border-[#e6dfd8] bg-black shadow-2xl transition-all duration-300 sm:w-80",
          showMiniPlayer ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
        )}
      >
        <div className="flex items-center justify-between bg-[#1f1e1b] px-3 py-1.5 text-xs text-white/80">
          <span className="truncate font-semibold">Video đồng bộ</span>
          <button
            aria-label="Đóng video thu nhỏ"
            className="rounded p-1 hover:bg-white/10 hover:text-white"
            onClick={() => setShowMiniPlayer(false)}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="aspect-video w-full" id="reading-yt-player">
          <SegmentYoutubePlayer
            continuous
            disableInteraction={false}
            immersive
            onPlayingChange={setIsPlaying}
            onTimeChange={setCurrentTime}
            ref={playerRef}
            title={video.title}
            youtubeVideoId={video.youtubeVideoId}
          />
        </div>
      </div>

      {/* When mini video is closed, player still exists in dom with 0 opacity so audio keeps playing */}
      {!showMiniPlayer ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -bottom-96 left-0 h-1 w-1 opacity-0"
        >
          {/* Handled by retaining SegmentYoutubePlayer above */}
        </div>
      ) : null}

      {/* Sticky Bottom Audio Player Bar */}
      <VideoReadingAudioBar
        activeSegment={activeSegment}
        autoScroll={autoScroll}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onChangePlaybackRate={handleChangePlaybackRate}
        onReplaySegment={handleReplaySegment}
        onSeek={handleSeek}
        onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
        onToggleMiniPlayer={() => setShowMiniPlayer((prev) => !prev)}
        onTogglePlay={handleTogglePlay}
        playbackRate={playbackRate}
        showMiniPlayer={showMiniPlayer}
      />

      {/* Admin Inline Edit Segment Dialog */}
      <VideoReadingEditDialog
        isOpen={Boolean(editingSegment)}
        onClose={() => setEditingSegment(null)}
        onSave={handleSaveSegment}
        segment={editingSegment}
      />
    </div>
  );
}
