import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

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

const SegmentYoutubePlayer = forwardRef(function SegmentYoutubePlayer(
  { continuous, disableInteraction = false, onPlayingChange, onReadyChange, onTimeChange, segment, title, youtubeVideoId },
  ref,
) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const boundaryTimerRef = useRef(null);
  const timeTrackerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopBoundaryTimer = useCallback(() => {
    if (boundaryTimerRef.current) {
      window.clearInterval(boundaryTimerRef.current);
      boundaryTimerRef.current = null;
    }
  }, []);

  const stopTimeTracker = useCallback(() => {
    if (timeTrackerRef.current) {
      window.clearInterval(timeTrackerRef.current);
      timeTrackerRef.current = null;
    }
  }, []);

  const pauseVideo = useCallback(() => {
    stopBoundaryTimer();
    stopTimeTracker();
    playerRef.current?.pauseVideo?.();
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange, stopBoundaryTimer, stopTimeTracker]);

  const startTimeTracker = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    stopTimeTracker();
    timeTrackerRef.current = window.setInterval(() => {
      const currentTime = Number(player.getCurrentTime?.() || 0);
      onTimeChange?.(currentTime);
    }, 250);
  }, [onTimeChange, stopTimeTracker]);

  const playVideo = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    stopBoundaryTimer();
    stopTimeTracker();
    player.playVideo();
    setIsPlaying(true);
    onPlayingChange?.(true);
    if (continuous) startTimeTracker();
  }, [continuous, onPlayingChange, startTimeTracker, stopBoundaryTimer, stopTimeTracker]);

  const playSegment = useCallback(
    (targetSegment = segment, options = {}) => {
      const player = playerRef.current;
      if (!player || !targetSegment) return;

      const startTime = Number(options.startTime ?? targetSegment.startTime ?? 0);
      const endTime = Number(targetSegment.endTime || startTime);

      stopBoundaryTimer();
      stopTimeTracker();
      player.seekTo(startTime, true);
      player.playVideo();
      setIsPlaying(true);
      onPlayingChange?.(true);

      if (continuous) {
        startTimeTracker();
      } else {
        boundaryTimerRef.current = window.setInterval(() => {
          const currentTime = Number(player.getCurrentTime?.() || 0);
          if (currentTime >= endTime) {
            pauseVideo();
          }
        }, 120);
      }
    },
    [continuous, onPlayingChange, pauseVideo, segment, startTimeTracker, stopBoundaryTimer, stopTimeTracker],
  );

  const playFrom = useCallback(
    (startTime = 0) => {
      const player = playerRef.current;
      if (!player) return;

      stopBoundaryTimer();
      stopTimeTracker();
      player.seekTo(Number(startTime || 0), true);
      player.playVideo();
      setIsPlaying(true);
      onPlayingChange?.(true);

      if (continuous) {
        startTimeTracker();
      }
    },
    [continuous, onPlayingChange, startTimeTracker, stopBoundaryTimer, stopTimeTracker],
  );

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
              if (continuous) stopTimeTracker();
            }

            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              onPlayingChange?.(true);
              if (continuous) startTimeTracker();
            }
          },
        },
      });
    });

    return () => {
      isMounted = false;
      stopBoundaryTimer();
      stopTimeTracker();
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [onPlayingChange, onReadyChange, startTimeTracker, stopBoundaryTimer, stopTimeTracker, youtubeVideoId]);

  useImperativeHandle(ref, () => ({ pauseVideo, playFrom, playSegment, playVideo }), [pauseVideo, playFrom, playSegment, playVideo]);

  return (
    <div className="w-full max-w-full min-w-0 rounded-none border-b-4 border-coral bg-[#181715] md:rounded-xl md:border-4 md:border-[#181715]">
      <div
        className={[
          "h-[210px] w-full max-w-full min-w-0 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:max-w-full md:aspect-video md:h-auto",
          disableInteraction ? "[&>iframe]:pointer-events-none" : "",
        ].join(" ")}
        ref={hostRef}
        title={title}
      />
      <span className="sr-only">
        {isPlayerReady ? "Player ready" : "Player loading"} {isPlaying ? "playing" : "paused"}
      </span>
    </div>
  );
});

export default SegmentYoutubePlayer;
