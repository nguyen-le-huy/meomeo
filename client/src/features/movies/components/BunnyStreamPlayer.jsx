import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

let playerScriptPromise;

function loadPlayerScript() {
  if (window.playerjs?.Player) return Promise.resolve();
  if (playerScriptPromise) return playerScriptPromise;
  playerScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bunny-playerjs="true"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
    script.async = true;
    script.dataset.bunnyPlayerjs = "true";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
  return playerScriptPromise;
}

const BunnyStreamPlayer = forwardRef(function BunnyStreamPlayer(
  { embedUrl, onEnded, onError, onPause, onPlay, onReady, onTimeUpdate, title },
  ref,
) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play() {
      playerRef.current?.play();
    },
    pause() {
      playerRef.current?.pause();
    },
    seek(seconds) {
      playerRef.current?.setCurrentTime(Number(seconds) || 0);
    }
  }));

  useEffect(() => {
    let disposed = false;
    let player;

    loadPlayerScript()
      .then(() => {
        if (disposed || !iframeRef.current) return;
        player = new window.playerjs.Player(iframeRef.current);
        playerRef.current = player;
        player.on("ready", () => onReady?.());
        player.on("play", () => onPlay?.());
        player.on("pause", () => onPause?.());
        player.on("ended", () => onEnded?.());
        player.on("error", (error) => onError?.(error));
        player.on("timeupdate", (data) => onTimeUpdate?.(Number(data?.seconds || 0), Number(data?.duration || 0)));
      })
      .catch(onError);

    return () => {
      disposed = true;
      if (player) {
        ["ready", "play", "pause", "ended", "error", "timeupdate"].forEach((event) => {
          try {
            player.off(event);
          } catch {
            // The cross-origin iframe may already be detached during navigation or rotation.
          }
        });
      }
      playerRef.current = null;
    };
  }, [embedUrl, onEnded, onError, onPause, onPlay, onReady, onTimeUpdate]);

  return (
    <iframe
      allow="accelerometer; gyroscope; autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 h-full w-full border-0"
      ref={iframeRef}
      src={embedUrl}
      title={title}
    />
  );
});

export default BunnyStreamPlayer;
