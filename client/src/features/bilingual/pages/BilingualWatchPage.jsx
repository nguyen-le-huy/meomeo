import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Captions, Maximize, Minimize, Pause, Play, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import SegmentYoutubePlayer from "../../videos/components/SegmentYoutubePlayer.jsx";
import BilingualSubtitleList from "../components/BilingualSubtitleList.jsx";
import BilingualAdminToolbar from "../components/BilingualAdminToolbar.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useBilingualVideo,
  useDeleteBilingualSegments,
  useGenerateVietsub,
  useUpdateBilingualSegment,
} from "../hooks/useBilingualWatch.js";

export default function BilingualWatchPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data, isLoading, error } = useBilingualVideo(id);
  const generateVietsubMutation = useGenerateVietsub(id);
  const updateSegmentMutation = useUpdateBilingualSegment(id);
  const deleteSegmentsMutation = useDeleteBilingualSegments(id);

  const video = data?.video;
  const segments = data?.segments || [];

  const activeIndex = segments.findIndex(
    (segment) => currentTime >= segment.startTime && currentTime < segment.endTime,
  );
  const activeSegment = activeIndex >= 0 ? segments[activeIndex] : null;

  const handleTimeChange = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback(
    (startTime) => {
      setIsVideoEnded(false);
      playerRef.current?.playFrom(startTime);
    },
    [],
  );

  const handleTogglePlay = useCallback(
    (e) => {
      e.stopPropagation();
      if (isPlaying) {
        playerRef.current?.pauseVideo();
      } else if (isVideoEnded) {
        playerRef.current?.playFrom(0);
      } else {
        playerRef.current?.playFrom(currentTime || 0);
      }
    },
    [currentTime, isPlaying, isVideoEnded],
  );

  const handleToggleFullscreen = useCallback(
    (e) => {
      e.stopPropagation();
      const el = playerContainerRef.current;
      if (!el) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen?.();
      }
    },
    [],
  );

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleVietsubDone = useCallback(() => {
    generateVietsubMutation.reset?.();
    queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
    queryClient.invalidateQueries({ queryKey: ["video", id] });
    queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
  }, [generateVietsubMutation, id, queryClient]);

  const overlayButtonLabel = isVideoEnded ? "Phát lại" : currentTime > 0.5 ? "Tiếp tục" : "Bắt đầu xem";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
        <LoadingState label="Đang tải video..." />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-canvas">
        <p className="font-display text-2xl">Không tìm thấy video</p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Về thư viện
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="h-full overflow-hidden bg-[#f2efe9]">
      <div className="flex h-full flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="flex min-h-0 flex-col bg-[#161513]">
          <div className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#1b1a18] px-3 sm:h-16 sm:px-5">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                asChild
                aria-label="Quay lại thư viện"
                className="shrink-0 text-canvas hover:bg-white/10 hover:text-white"
                size="icon"
                variant="ghost"
              >
                <Link to="/youtube">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="min-w-0">
                <p className="mb-0.5 hidden text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:block">
                  Đang học song ngữ
                </p>
                <h1 className="truncate text-sm font-semibold text-white sm:text-base">{video.title}</h1>
              </div>
            </div>
            <div className="ml-3 hidden shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/65 sm:flex">
              <Captions className="h-3.5 w-3.5 text-coral" />
              {segments.length} đoạn
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-[#11110f] lg:p-5 2xl:p-7">
            <div
              className="relative w-full max-w-[min(100%,calc((100dvh-11rem)*16/9))] overflow-hidden bg-black shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:rounded-xl"
              ref={playerContainerRef}
            >
              <SegmentYoutubePlayer
                ref={playerRef}
                continuous
                immersive
                onEndedChange={setIsVideoEnded}
                onReadyChange={setIsPlayerReady}
                onPlayingChange={setIsPlaying}
                onTimeChange={handleTimeChange}
                title={video.title}
                youtubeVideoId={video.youtubeVideoId}
              />

              <div className="pointer-events-auto absolute inset-0 z-10" onClick={handleTogglePlay}>
              {!isPlaying ? (
                <div className="flex h-full w-full items-center justify-center bg-black/10">
                  <button
                    className="group flex items-center gap-3 rounded-full border border-white/15 bg-[#181715]/90 py-2.5 pl-2.5 pr-5 text-left shadow-2xl backdrop-blur-md transition hover:bg-[#252320] sm:gap-4 sm:py-3 sm:pl-3 sm:pr-6"
                    onClick={handleTogglePlay}
                    type="button"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-white sm:h-12 sm:w-12">
                      {isVideoEnded ? (
                        <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Play className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white sm:text-base">{overlayButtonLabel}</span>
                      <span className="hidden text-xs text-white/50 sm:block">Phụ đề Anh - Việt đồng bộ</span>
                    </span>
                  </button>
                </div>
              ) : null}

              {isPlaying && activeSegment ? (
                <div className="pointer-events-none absolute bottom-3 left-1/2 w-[92%] max-w-3xl -translate-x-1/2 space-y-0.5 rounded-lg bg-black/75 px-3 py-2 text-center backdrop-blur-sm sm:bottom-5 sm:space-y-1 sm:px-5 sm:py-3">
                  <p className="text-xs font-medium leading-snug text-[#f6d85c] [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:text-xl">
                    {activeSegment.text}
                  </p>
                  {activeSegment.translationText ? (
                    <p className="text-[11px] font-normal leading-snug text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:text-base">
                      {activeSegment.translationText}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isPlaying ? (
                <button
                  aria-label="Tạm dừng"
                  className="absolute bottom-3 left-3 rounded-full bg-[#181715]/85 p-2.5 opacity-0 transition hover:opacity-100 focus:opacity-100"
                  onClick={handleTogglePlay}
                  type="button"
                >
                  <Pause className="h-5 w-5 text-canvas" />
                </button>
              ) : null}

              <Button
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
                className="absolute bottom-3 right-3 hidden rounded-full border border-white/10 bg-coal/85 text-canvas opacity-70 hover:bg-coal hover:opacity-100 sm:inline-flex"
                onClick={handleToggleFullscreen}
                size="icon"
                type="button"
                variant="secondary"
              >
                {isFullscreen ? <Minimize className="h-5 w-5 text-canvas" /> : <Maximize className="h-5 w-5 text-canvas" />}
              </Button>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <div className="shrink-0 border-t border-white/10 bg-[#1b1a18] px-4 py-3 text-canvas sm:px-6">
              <BilingualAdminToolbar
                bilingualError={video.bilingualError}
                bilingualStatus={video.bilingualStatus}
                generateVietsubMutation={generateVietsubMutation}
                hasSegments={segments.length > 0}
                onVietsubDone={handleVietsubDone}
                segments={segments}
                transcriptStatus={video.transcriptStatus}
                videoId={id}
              />
            </div>
          ) : null}
        </div>

        <aside className="hidden min-h-0 border-l border-black/10 bg-canvas lg:flex lg:flex-col">
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-[#e6dfd8] px-5 2xl:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream text-coral">
                <Captions className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-coal">Phụ đề song ngữ</h2>
                <p className="text-xs text-ink-muted">Chọn một câu để phát từ vị trí đó</p>
              </div>
            </div>
            <Badge variant="secondary">{segments.length}</Badge>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <BilingualSubtitleList
              activeIndex={activeIndex}
              canEdit={isAdmin}
              onSeek={handleSeek}
              onUpdateSegment={(segmentId, segmentData) =>
                updateSegmentMutation.mutateAsync({ data: segmentData, segmentId })
              }
              onDeleteSegments={(segmentIds) => deleteSegmentsMutation.mutateAsync(segmentIds)}
              segments={segments}
            />
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col bg-canvas lg:hidden">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e6dfd8] px-4">
            <div className="flex items-center gap-2.5">
              <Captions className="h-4 w-4 text-coral" />
              <h2 className="text-sm font-semibold">Phụ đề song ngữ</h2>
            </div>
            <Badge variant="secondary">{segments.length} đoạn</Badge>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BilingualSubtitleList
              activeIndex={activeIndex}
              canEdit={isAdmin}
              onSeek={handleSeek}
              onUpdateSegment={(segmentId, segmentData) =>
                updateSegmentMutation.mutateAsync({ data: segmentData, segmentId })
              }
              onDeleteSegments={(segmentIds) => deleteSegmentsMutation.mutateAsync(segmentIds)}
              segments={segments}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
