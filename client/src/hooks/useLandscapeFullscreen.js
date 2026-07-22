import { useCallback, useEffect, useRef, useState } from "react";

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

export function useLandscapeFullscreen(containerRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const pseudoFullscreenRef = useRef(false);
  const lockedScrollYRef = useRef(0);

  const updateViewportSize = useCallback(() => {
    const viewport = window.visualViewport;
    const width = viewport?.width || window.innerWidth;
    const height = viewport?.height || window.innerHeight;
    const container = containerRef.current;

    container?.style.setProperty("--movie-player-viewport-width", `${Math.round(width)}px`);
    container?.style.setProperty("--movie-player-viewport-height", `${Math.round(height)}px`);
  }, [containerRef]);

  const unlockPage = useCallback(() => {
    const root = document.documentElement;
    const shouldRestoreScroll = root.classList.contains("movie-player-ios-lock");

    root.classList.remove("movie-player-lock-scroll", "movie-player-ios-lock");
    document.body.style.removeProperty("--movie-player-scroll-top");

    if (shouldRestoreScroll) {
      window.scrollTo(0, lockedScrollYRef.current);
    }

    try {
      window.screen.orientation?.unlock?.();
    } catch {
      // Safari and older mobile browsers do not expose orientation unlock.
    }
  }, []);

  const leavePseudoFullscreen = useCallback(() => {
    pseudoFullscreenRef.current = false;
    containerRef.current?.classList.remove("movie-player-pseudo-fullscreen");
    setIsPseudoFullscreen(false);
    setIsFullscreen(false);
    unlockPage();
  }, [containerRef, unlockPage]);

  const enterPseudoFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    lockedScrollYRef.current = window.scrollY;
    document.body.style.setProperty("--movie-player-scroll-top", `-${lockedScrollYRef.current}px`);
    document.documentElement.classList.add("movie-player-lock-scroll", "movie-player-ios-lock");
    container.classList.add("movie-player-pseudo-fullscreen");
    pseudoFullscreenRef.current = true;
    updateViewportSize();
    setIsPseudoFullscreen(true);
    setIsFullscreen(true);
  }, [containerRef, updateViewportSize]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    const fullscreenElement = getFullscreenElement();
    if (fullscreenElement || pseudoFullscreenRef.current) {
      if (fullscreenElement) {
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
        try {
          await exitFullscreen?.call(document);
        } catch {
          // A system gesture can finish exiting fullscreen before this promise resolves.
        }
      }

      if (pseudoFullscreenRef.current) leavePseudoFullscreen();
      else {
        setIsFullscreen(false);
        unlockPage();
      }
      return;
    }

    document.documentElement.classList.add("movie-player-lock-scroll");
    const requestFullscreen = container.requestFullscreen || container.webkitRequestFullscreen;
    if (requestFullscreen) {
      try {
        await requestFullscreen.call(container);
        setIsFullscreen(true);
        try {
          await window.screen.orientation?.lock?.("landscape");
        } catch {
          // Safari versions without orientation locking still allow the user to rotate
          // the native fullscreen view normally.
        }
        return;
      } catch {
        // Fall through to the cross-browser fullscreen overlay.
      }
    }

    enterPseudoFullscreen();
  }, [containerRef, enterPseudoFullscreen, leavePseudoFullscreen, unlockPage]);

  useEffect(() => {
    function handleFullscreenChange() {
      const playerIsFullscreen = getFullscreenElement() === containerRef.current;
      if (playerIsFullscreen) {
        setIsFullscreen(true);
      } else if (!pseudoFullscreenRef.current) {
        setIsFullscreen(false);
        unlockPage();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape" && pseudoFullscreenRef.current) leavePseudoFullscreen();
    }

    const viewport = window.visualViewport;
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateViewportSize);
    window.addEventListener("orientationchange", updateViewportSize);
    viewport?.addEventListener("resize", updateViewportSize);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("orientationchange", updateViewportSize);
      viewport?.removeEventListener("resize", updateViewportSize);

      containerRef.current?.classList.remove("movie-player-pseudo-fullscreen");
      pseudoFullscreenRef.current = false;
      unlockPage();
    };
  }, [containerRef, leavePseudoFullscreen, unlockPage, updateViewportSize]);

  return { isFullscreen, isPseudoFullscreen, toggleFullscreen };
}
