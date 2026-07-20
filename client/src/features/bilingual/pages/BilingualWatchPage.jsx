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
import "../../movies/styles/netflix-chill.css";

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
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);

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
    async (e) => {
      e?.stopPropagation();
      const container = playerContainerRef.current;
      if (!container) return;
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

      if (fullscreenElement || isPseudoFullscreen) {
        if (fullscreenElement) {
          const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
          try {
            await exitFullscreen?.call(document);
          } catch {
            // Orientation unlocking or exit fullscreen gesture
          }
        }
        setIsPseudoFullscreen(false);
        setIsFullscreen(false);
        document.documentElement.classList.remove("movie-player-lock-scroll");
        try {
          window.screen.orientation?.unlock?.();
        } catch {
          // Ignore unsupported orientation unlock
        }
        return;
      }

      document.documentElement.classList.add("movie-player-lock-scroll");
      const requestFullscreen = container.requestFullscreen || container.webkitRequestFullscreen;
      if (requestFullscreen) {
        try {
          await requestFullscreen.call(container, { navigationUI: "hide" });
          setIsFullscreen(true);
          try {
            await window.screen.orientation?.lock?.("landscape");
          } catch {
            // CSS rotates player if screen orientation lock fails
          }
          return;
        } catch {
          // iPhone Safari rejects fullscreen for non-video elements
        }
      }

      setIsPseudoFullscreen(true);
      setIsFullscreen(true);
    },
    [isPseudoFullscreen],
  );

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      const playerIsFullscreen = fullscreenElement === playerContainerRef.current;
      setIsFullscreen(playerIsFullscreen);
      const playerIsPseudoFullscreen = playerContainerRef.current?.classList.contains("movie-player-pseudo-fullscreen");
      if (!playerIsFullscreen && !playerIsPseudoFullscreen) {
        document.documentElement.classList.remove("movie-player-lock-scroll");
        try {
          window.screen.orientation?.unlock?.();
        } catch {
          // Ignore unsupported orientation unlock
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleFullscreenChange);
      document.documentElement.classList.remove("movie-player-lock-scroll");
      try {
        window.screen.orientation?.unlock?.();
      } catch {
        // Ignore unsupported orientation unlock
      }
    };
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
    <section className="h-full w-full min-w-0 max-w-full overflow-hidden bg-[#f2efe9]">
      <div className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden bg-[#161513] lg:shrink">
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

          <div className="flex min-h-0 min-w-0 flex-none items-center justify-center overflow-hidden bg-[#11110f] lg:flex-1 lg:p-5 lg:[container-type:size] 2xl:p-7">
            <div
              className={`movie-player-surface relative w-full max-w-full shrink-0 overflow-hidden bg-black shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:rounded-xl lg:w-[min(100cqw,calc(100cqh*16/9))] ${isFullscreen ? "movie-player-force-landscape" : ""} ${isPseudoFullscreen ? "movie-player-pseudo-fullscreen" : ""}`}
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

              {activeSegment ? (
                <div className="movie-subtitle-overlay pointer-events-none absolute inset-x-0 z-20 px-5 text-center sm:px-10">
                  <div className="movie-subtitle-panel mx-auto flex max-w-4xl flex-col items-center gap-0 sm:gap-2">
                    <p className="movie-subtitle-line text-[11px] font-normal leading-snug text-white sm:text-3xl">
                      <span className="movie-subtitle-caption">{activeSegment.text}</span>
                    </p>
                    {activeSegment.translationText ? (
                      <p className="movie-subtitle-line text-[11px] font-normal leading-snug text-[#ffd86b] sm:text-3xl">
                        <span className="movie-subtitle-caption movie-subtitle-caption-secondary">
                          {activeSegment.translationText}
                        </span>
                      </p>
                    ) : null}
                  </div>
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

              <button
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình ngang kèm phụ đề"}
                className="movie-player-fullscreen absolute bottom-3 right-3 z-30 grid h-10 w-10 place-items-center rounded-md bg-black/65 text-white shadow-lg backdrop-blur transition duration-300 hover:bg-black/85"
                onClick={handleToggleFullscreen}
                type="button"
              >
                {isFullscreen ? <Minimize size={21} /> : <Maximize size={21} />}
              </button>
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

        <aside className="hidden min-h-0 min-w-0 max-w-full border-l border-black/10 bg-canvas lg:flex lg:flex-col">
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

        <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-canvas lg:hidden">
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
