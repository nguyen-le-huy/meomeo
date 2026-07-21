import { ArrowLeft, Captions, Maximize, Minimize, Pause, Play, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import BunnyStreamPlayer from "../components/BunnyStreamPlayer.jsx";
import MoviePlayerAdminTools from "../components/MoviePlayerAdminTools.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { getMovieById } from "../data/netflixMockData.js";
import { useMovieAdminMutations, useMovieDetail, useMoviePlayback } from "../hooks/useMovies.js";
import { normalizeMovie } from "../utils/movieData.js";
import "../styles/netflix-chill.css";

const subtitleModes = [
  { id: "bilingual", label: "Song ngữ" },
  { id: "english", label: "English" },
  { id: "vietnamese", label: "Tiếng Việt" },
  { id: "off", label: "Tắt" },
];

function pollPendingPlayback(query) {
  return query.state.status === "error" ? 10_000 : false;
}

function findActiveSegmentIndex(segments, currentTime) {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const segment = segments[middle];
    if (currentTime < segment.startTime) high = middle - 1;
    else if (currentTime >= segment.endTime) low = middle + 1;
    else return middle;
  }
  return -1;
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function MoviePlayerPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const movieMutations = useMovieAdminMutations();
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const playerChromeTimeoutRef = useRef(null);
  const isApiMovie = /^[0-9a-f]{24}$/i.test(movieId || "");
  const mockMovie = isApiMovie ? null : getMovieById(movieId);
  const detailQuery = useMovieDetail(movieId, { enabled: isApiMovie });
  const playbackQuery = useMoviePlayback(movieId, {
    enabled: isApiMovie && Boolean(detailQuery.data?.movie),
    refetchInterval: pollPendingPlayback,
  });
  const movie = normalizeMovie(detailQuery.data?.movie || mockMovie);
  const segments = useMemo(() => {
    if (detailQuery.data?.segments?.length) return detailQuery.data.segments;
    if (!mockMovie) return [];
    return [{ _id: `${mockMovie.id}-demo`, startTime: 0, endTime: 9999, text: mockMovie.subtitle, translationText: mockMovie.translation }];
  }, [detailQuery.data?.segments, mockMovie]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitleMode, setSubtitleMode] = useState(() => localStorage.getItem("movie_subtitle_mode") || "bilingual");
  const [playerError, setPlayerError] = useState("");
  const [showPlayerChrome, setShowPlayerChrome] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(resumeTimeoutRef.current);
    };
  }, []);
  const activeSegmentIndex = useMemo(() => findActiveSegmentIndex(segments, currentTime), [currentTime, segments]);
  const activeSegment = activeSegmentIndex >= 0 ? segments[activeSegmentIndex] : null;
  const playbackPending = isApiMovie && playbackQuery.isError;
  const transcriptVirtualizer = useVirtualizer({
    count: segments.length,
    estimateSize: () => 88,
    getItemKey: (index) => segments[index]?._id || segments[index]?.index || index,
    getScrollElement: () => transcriptScrollRef.current,
    overscan: 6,
  });

  const revealPlayerChrome = useCallback(() => {
    window.clearTimeout(playerChromeTimeoutRef.current);
    setShowPlayerChrome(true);
    if (isPlaying) {
      playerChromeTimeoutRef.current = window.setTimeout(() => setShowPlayerChrome(false), 2500);
    }
  }, [isPlaying]);

  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const handlePointerMove = useCallback((e) => {
    const { clientX, clientY } = e;
    if (clientX === undefined || clientY === undefined) {
      revealPlayerChrome();
      return;
    }
    if (clientX === lastMousePosRef.current.x && clientY === lastMousePosRef.current.y) {
      return;
    }
    lastMousePosRef.current = { x: clientX, y: clientY };
    revealPlayerChrome();
  }, [revealPlayerChrome]);

  useEffect(() => {
    localStorage.setItem("movie_subtitle_mode", subtitleMode);
  }, [subtitleMode]);

  useEffect(() => {
    revealPlayerChrome();
    return () => window.clearTimeout(playerChromeTimeoutRef.current);
  }, [revealPlayerChrome]);

  useEffect(() => {
    const handleWindowBlur = () => {
      if (document.activeElement?.tagName === "IFRAME") {
        revealPlayerChrome();
      }
    };
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [revealPlayerChrome]);

  // Force black background on html/body while in player to avoid white letterbox
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = "#000";
    body.style.background = "#000";
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);

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
          // Orientation unlocking is not available in every mobile browser.
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
        // Orientation unlocking is not available in every mobile browser.
      }
    };
  }, []);

  useEffect(() => {
    if (!mockMovie || !isPlaying) return undefined;
    const interval = window.setInterval(() => setCurrentTime((time) => time + 0.25), 250);
    return () => window.clearInterval(interval);
  }, [isPlaying, mockMovie]);

  useEffect(() => {
    if (activeSegmentIndex >= 0) transcriptVirtualizer.scrollToIndex(activeSegmentIndex, { align: "auto" });
  }, [activeSegmentIndex, transcriptVirtualizer]);

  const lastSavedTimeRef = useRef(0);
  const handleTimeUpdate = useCallback((seconds, totalDuration) => {
    setCurrentTime(seconds);
    setDuration(totalDuration);
    if (Math.abs(seconds - lastSavedTimeRef.current) >= 5) {
      localStorage.setItem(`meomeo_progress_${movieId}`, seconds);
      lastSavedTimeRef.current = seconds;
    }
  }, [movieId]);

  const handleReady = useCallback(() => {
    setPlayerError("");
    const savedTime = localStorage.getItem(`meomeo_progress_${movieId}`);
    if (savedTime && Number(savedTime) > 10) {
      setResumeTime(Number(savedTime));
      setShowResumePrompt(true);
    }
  }, [movieId]);

  const handleResume = useCallback(() => {
    if (resumeTime > 0) {
      playerRef.current?.seek(resumeTime);
      playerRef.current?.play();
    }
    setShowResumePrompt(false);
  }, [resumeTime]);

  const handleIgnoreResume = useCallback(() => {
    setShowResumePrompt(false);
  }, []);
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    revealPlayerChrome();
  }, [revealPlayerChrome]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    revealPlayerChrome();
  }, [revealPlayerChrome]);

  const handleEnded = useCallback(() => setIsPlaying(false), []);
  const handleError = useCallback(() => setPlayerError("Không thể phát phim. Hãy thử tải lại player."), []);

  function goBack() {
    navigate("/netflix", { replace: true });
  }

  function toggleMockPlayback() {
    if (mockMovie) setIsPlaying((value) => !value);
  }

  const togglePlayback = useCallback(() => {
    if (mockMovie) {
      setIsPlaying((value) => !value);
      return;
    }
    playerRef.current?.togglePlay?.();
  }, [mockMovie]);

  function seek(seconds) {
    setCurrentTime(seconds);
    if (mockMovie) {
      setIsPlaying(true);
      return;
    }
    setIsPlaying(true);
    playerRef.current?.seek(seconds);
    playerRef.current?.play();
  }

  async function toggleFullscreen() {
    const container = playerContainerRef.current;
    if (!container) return;
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    if (fullscreenElement || isPseudoFullscreen) {
      if (fullscreenElement) {
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
        try {
          await exitFullscreen?.call(document);
        } catch {
          // The browser may already be leaving fullscreen through a system gesture.
        }
      }
      setIsPseudoFullscreen(false);
      setIsFullscreen(false);
      document.documentElement.classList.remove("movie-player-lock-scroll");
      try {
        window.screen.orientation?.unlock?.();
      } catch {
        // Orientation unlocking is not available in every mobile browser.
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
          // CSS rotates the player on iOS and browsers without orientation lock.
        }
        return;
      } catch {
        // iPhone Safari can reject fullscreen for non-video elements.
      }
    }

    setIsPseudoFullscreen(true);
    setIsFullscreen(true);
  }

  if (isApiMovie && (detailQuery.isLoading || playbackQuery.isLoading)) {
    return <div className="grid h-[100dvh] place-items-center bg-black text-white"><LoadingState label="Đang tải phim..." /></div>;
  }
  if (isApiMovie && (detailQuery.error || !detailQuery.data?.movie)) {
    return <Navigate replace to="/netflix" />;
  }
  if (!movie) return <Navigate replace to="/netflix" />;

  const playerChromeClass = showPlayerChrome
    ? "translate-y-0 opacity-100"
    : "pointer-events-none -translate-y-2 opacity-0";

  return (
    <div className="netflix-chill movie-player-shell grid h-[100dvh] min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-black text-white lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1">
      <main
        className={`movie-player-surface relative aspect-video w-full min-h-0 min-w-0 self-center bg-black ${isFullscreen ? "movie-player-force-landscape" : ""} ${isPseudoFullscreen ? "movie-player-pseudo-fullscreen" : ""}`}
        onFocusCapture={revealPlayerChrome}
        onPointerDown={revealPlayerChrome}
        onPointerMove={handlePointerMove}
        ref={playerContainerRef}
      >
        {playbackQuery.data?.embedUrl ? (
          <BunnyStreamPlayer
            embedUrl={playbackQuery.data.embedUrl}
            onEnded={handleEnded}
            onError={handleError}
            onPause={handlePause}
            onPlay={handlePlay}
            onReady={handleReady}
            onTimeUpdate={handleTimeUpdate}
            ref={playerRef}
            title={movie.title}
          />
        ) : (
          <>
            <img alt="" className={`absolute inset-0 h-full w-full object-cover transition duration-1000 ${isPlaying ? "scale-[1.02]" : "scale-100"}`} src={movie.backdrop} />
            <div className="absolute inset-0 bg-black/35" />
          </>
        )}

        <div aria-hidden="true" className={`absolute inset-x-0 bottom-20 top-0 z-[19] cursor-pointer transition-all ${showPlayerChrome ? "pointer-events-none" : "pointer-events-auto"}`} onClick={togglePlayback} onPointerEnter={handlePointerMove} onPointerMove={handlePointerMove} />
        <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showPlayerChrome ? "opacity-100" : "opacity-0"}`} />
        <div className={`movie-player-top-controls absolute z-20 flex items-center gap-3 transition duration-300 ${playerChromeClass}`}>
          <button aria-label="Quay lại thư viện phim" className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white/90 backdrop-blur transition hover:bg-black/70 hover:text-white" onClick={goBack} type="button"><ArrowLeft size={22} /></button>
          <div className="hidden rounded-full bg-black/50 p-1 backdrop-blur sm:flex">
            {subtitleModes.map((mode) => (
              <button className={`h-8 rounded-full px-4 text-[13px] font-medium transition ${subtitleMode === mode.id ? "bg-white text-black shadow-sm" : "text-white/70 hover:text-white"}`} key={mode.id} onClick={() => setSubtitleMode(mode.id)} type="button">{mode.label}</button>
            ))}
          </div>
        </div>

        <button
          aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình ngang kèm phụ đề"}
          className={`movie-player-fullscreen absolute z-30 grid h-12 w-12 place-items-center rounded-md text-white transition duration-300 ${showPlayerChrome ? "bg-black/65 opacity-100 backdrop-blur" : "bg-transparent opacity-0 pointer-events-none"}`}
          onClick={toggleFullscreen}
          onPointerEnter={revealPlayerChrome}
          onPointerMove={revealPlayerChrome}
          type="button"
        >
          {isFullscreen ? <Minimize size={21} /> : <Maximize size={21} />}
        </button>

        {mockMovie ? (
          <div className="absolute inset-0 z-10 grid place-items-center">
            <button aria-label={isPlaying ? "Tạm dừng" : `Phát ${movie.title}`} className="grid h-16 w-16 place-items-center rounded-full bg-white text-black shadow-2xl" onClick={toggleMockPlayback} type="button">
              {isPlaying ? <Pause fill="currentColor" size={26} /> : <Play fill="currentColor" size={26} />}
            </button>
          </div>
        ) : null}

        {playbackPending ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/55 px-4 text-center backdrop-blur-sm">
            <div>
              <p className="text-lg font-semibold">Bunny đang chuẩn bị luồng phát</p>
              <p className="mt-2 text-sm text-white/60">Tiến độ hiện tại: {Math.round(detailQuery.data?.movie?.encodeProgress || 0)}%</p>
              <button className="mx-auto mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-black hover:bg-white/85" onClick={() => playbackQuery.refetch()} type="button">
                <RefreshCw size={16} /> Thử lại
              </button>
            </div>
          </div>
        ) : null}

        {activeSegment && subtitleMode !== "off" ? (
          <div className="movie-subtitle-overlay pointer-events-none absolute inset-x-0 z-20 px-5 text-center sm:px-10">
            <div className="movie-subtitle-panel mx-auto flex max-w-4xl flex-col items-center gap-0">
              {subtitleMode !== "vietnamese" ? (
                <p className="movie-subtitle-line text-[12px] font-normal leading-snug text-white sm:text-[18px] lg:text-xl">
                  <span className="movie-subtitle-caption">{activeSegment.text}</span>
                </p>
              ) : null}
              {subtitleMode !== "english" && activeSegment.translationText ? (
                <p className="movie-subtitle-line text-[12px] font-normal leading-snug text-[#ffd86b] sm:text-[18px] lg:text-xl">
                  <span className="movie-subtitle-caption movie-subtitle-caption-secondary">{activeSegment.translationText}</span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {mockMovie ? (
          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-md bg-black/65 px-3 py-2 sm:inset-x-5 sm:bottom-5">
            <button aria-label={isPlaying ? "Tạm dừng" : "Phát"} onClick={toggleMockPlayback} type="button">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
            <button aria-label="Tua lại 10 giây" onClick={() => seek(Math.max(0, currentTime - 10))} type="button"><RotateCcw size={19} /></button>
            <span className="truncate text-sm font-semibold">{movie.title}</span>
          </div>
        ) : null}

        {showResumePrompt && (
          <div className="absolute bottom-24 left-4 right-4 z-40 flex items-center justify-between gap-4 rounded-xl bg-zinc-950/90 border border-white/10 p-4 text-white backdrop-blur-xl shadow-2xl transition-all duration-300 sm:left-6 sm:right-auto sm:max-w-md animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 border border-white/10 text-coral">
                <RotateCcw size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-coral">BẠN ĐANG XEM DỞ</span>
                <span className="truncate text-sm font-medium text-white/90">Xem tiếp từ {formatDuration(resumeTime)}?</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleIgnoreResume} 
                className="rounded-md px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white transition"
                type="button"
              >
                Bỏ qua
              </button>
              <button 
                onClick={handleResume} 
                className="rounded-md bg-white hover:bg-white/90 text-black px-4 py-2 text-xs font-bold shadow-md transition flex items-center gap-1.5"
                type="button"
              >
                <Play fill="currentColor" size={12} /> Xem tiếp
              </button>
            </div>
          </div>
        )}

        {playerError ? <div className="absolute inset-x-4 top-20 z-30 rounded-md bg-red-700/95 p-3 text-center text-sm">{playerError}</div> : null}
      </main>

      <aside className="movie-player-sidebar flex min-h-0 min-w-0 flex-col border-t border-white/10 bg-[#111] lg:border-l lg:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{movie.title}</h1>
            <p className="mt-1 text-xs text-white/50">{movie.year} · {movie.age} · {segments.length} câu</p>
          </div>
          <Captions className="shrink-0 text-[#e06f50]" size={20} />
        </div>
        {isAdmin && detailQuery.data?.movie ? (
          <MoviePlayerAdminTools
            eligibility={detailQuery.data.eligibility}
            movie={detailQuery.data.movie}
            mutations={movieMutations}
            segmentCount={segments.length}
            segments={segments}
            translationCount={segments.filter((segment) => segment.translationText?.trim()).length}
          />
        ) : null}
        <div className="movie-player-mobile-modes mx-4 my-3 flex rounded-lg bg-white/5 p-1 lg:hidden">
          {subtitleModes.map((mode) => (
            <button className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${subtitleMode === mode.id ? "bg-white/15 text-white shadow-sm" : "text-white/40"}`} key={mode.id} onClick={() => setSubtitleMode(mode.id)} type="button">{mode.label}</button>
          ))}
        </div>
        <div className="movie-transcript-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4" ref={transcriptScrollRef}>
          {segments.length ? (
            <div className="relative w-full" style={{ height: `${transcriptVirtualizer.getTotalSize()}px` }}>
              {transcriptVirtualizer.getVirtualItems().map((virtualRow) => {
                const segment = segments[virtualRow.index];
                const isActive = activeSegmentIndex === virtualRow.index;
                return (
                  <div
                    className="absolute left-0 top-0 w-full pb-1"
                    data-index={virtualRow.index}
                    key={virtualRow.key}
                    ref={transcriptVirtualizer.measureElement}
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <button
                      className={`block min-h-11 w-full rounded-md px-3 py-2.5 text-left transition sm:py-3 ${isActive ? "bg-[#e06f50]/15 ring-1 ring-[#e06f50]/45" : "hover:bg-white/5 active:bg-white/[0.08]"}`}
                      onClick={() => seek(segment.startTime)}
                      type="button"
                    >
                      <span className="block text-xs text-white/35">{Math.floor(segment.startTime / 60)}:{String(Math.floor(segment.startTime % 60)).padStart(2, "0")}</span>
                      <span className="mt-1 block text-sm font-medium text-white/90">{segment.text}</span>
                      {segment.translationText ? <span className="mt-1 block text-sm text-[#e8a38d]">{segment.translationText}</span> : null}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : <p className="p-4 text-sm text-white/45">Phim chưa có phụ đề.</p>}
        </div>
        {duration ? <div className="shrink-0 border-t border-white/10 px-4 py-2 text-xs text-white/40">{Math.round(currentTime)}s / {Math.round(duration)}s</div> : null}
      </aside>
    </div>
  );
}
