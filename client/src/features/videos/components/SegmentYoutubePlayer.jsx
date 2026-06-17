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
  { onPlayingChange, onReadyChange, segment, title, youtubeVideoId },
  ref,
) {
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

  const playSegment = useCallback(
    (targetSegment = segment, options = {}) => {
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
    },
    [onPlayingChange, pauseVideo, segment, stopBoundaryTimer],
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
      <span className="sr-only">
        {isPlayerReady ? "Player ready" : "Player loading"} {isPlaying ? "playing" : "paused"}
      </span>
    </div>
  );
});

export default SegmentYoutubePlayer;
