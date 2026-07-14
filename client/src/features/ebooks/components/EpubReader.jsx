import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";

export default function EpubReader({
  ebook,
  settings,
  progress,
  onProgress,
  onBookmarkReady,
  onControlsReady,
}) {
  const frameRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const currentSectionIndexRef = useRef(0);
  const [ready, setReady] = useState(false);

  const resetReaderScroll = () => {
    const container = frameRef.current;
    if (!container) return;

    container.scrollTop = 0;
    container.querySelectorAll(".epub-container, .epub-view, .epub-contents").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.scrollTop = 0;
    });
  };

  useEffect(() => {
    if (!frameRef.current) return undefined;

    let active = true;
    const constrainRenderedLayout = () => {
      const container = frameRef.current;
      if (!container) return;

      container.style.overflowX = "hidden";
      container.style.maxWidth = "100%";

      Array.from(container.children).forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.style.width = "100%";
        node.style.maxWidth = "100%";
        node.style.minWidth = "0";
        node.style.overflowX = "hidden";
        node.style.boxSizing = "border-box";
      });

      container.querySelectorAll(".epub-container, .epub-view, .epub-contents, iframe").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.style.width = "100%";
        node.style.maxWidth = "100%";
        node.style.minWidth = "0";
        node.style.overflowX = "hidden";
        node.style.boxSizing = "border-box";
      });
    };

    const book = ePub(ebook.fileUrl);
    const rendition = book.renderTo(frameRef.current, {
      width: "100%",
      height: "100%",
      spread: "none",
      flow: "scrolled-doc",
      manager: "default",
    });

    bookRef.current = book;
    renditionRef.current = rendition;

    rendition.themes.register("light", { body: { color: "#202224", background: "#faf9f5" } });
    rendition.themes.register("sepia", { body: { color: "#453b2b", background: "#f4ead7" } });
    rendition.themes.register("dark", { body: { color: "#f6f0e5", background: "#252320" } });
    constrainRenderedLayout();

    rendition.hooks.content.register((contents) => {
      contents.document.documentElement.style.maxWidth = "100%";
      contents.document.documentElement.style.overflowX = "hidden";
      contents.document.body.style.maxWidth = "100%";
      contents.document.body.style.overflowX = "hidden";
      contents.document.body.style.paddingBottom = "6rem";
      contents.document.body.style.boxSizing = "border-box";
      const style = contents.document.createElement("style");
      style.textContent = `
        html, body {
          max-width: 100%;
          overflow-x: hidden !important;
        }
        img, svg, video, canvas, table, pre {
          max-width: 100% !important;
        }
      `;
      contents.document.head.appendChild(style);
    });

    const observer = new MutationObserver(() => constrainRenderedLayout());
    observer.observe(frameRef.current, { childList: true, subtree: true });

    rendition.themes.default({
      body: {
        "font-family": settings.fontFamily === "bbc" ? "BBC Reith Serif, Georgia, serif" : settings.fontFamily === "sans" ? "Arial, sans-serif" : "Georgia, serif",
        "font-size": `${settings.fontSize}px`,
        "line-height": `${settings.lineHeight}`,
        "letter-spacing": `${settings.letterSpacing}em`,
      },
    });

    rendition.display(progress?.location?.cfi || undefined).then((displayedSection) => {
      if (!active) return;

      currentSectionIndexRef.current = displayedSection?.index ?? 0;
      setReady(true);
      onBookmarkReady(() => rendition.currentLocation()?.start?.cfi || "");

      const displaySpineItem = async (direction) => {
        let targetIndex = currentSectionIndexRef.current + direction;
        let targetSection = book.spine.get(targetIndex);

        while (targetSection && !targetSection.linear) {
          targetIndex += direction;
          targetSection = book.spine.get(targetIndex);
        }

        if (targetSection) {
          await rendition.display(targetSection.index);
          currentSectionIndexRef.current = targetSection.index;
          rendition.manager?.scrollTo(0, 0, true);
          resetReaderScroll();
        }
      };

      onControlsReady({
        next: () => displaySpineItem(1),
        prev: () => displaySpineItem(-1),
      });
    });

    const handleRelocated = (location) => {
      if (Number.isInteger(location.start?.index)) currentSectionIndexRef.current = location.start.index;
      onProgress({ location: { cfi: location.start.cfi }, progress: location.end?.percentage || location.start?.percentage || 0 });
    };

    rendition.on("relocated", handleRelocated);

    return () => {
      active = false;
      observer.disconnect();
      rendition.off("relocated", handleRelocated);
      book.destroy();
      bookRef.current = null;
      renditionRef.current = null;
      onControlsReady(null);
    };
  }, [ebook.fileUrl]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    rendition.themes.fontSize(`${settings.fontSize}px`);
    rendition.themes.override("font-family", settings.fontFamily === "bbc" ? "BBC Reith Serif, Georgia, serif" : settings.fontFamily === "sans" ? "Arial, sans-serif" : "Georgia, serif");
    rendition.themes.override("line-height", `${settings.lineHeight}`);
    rendition.themes.override("letter-spacing", `${settings.letterSpacing}em`);
  }, [settings.fontSize, settings.fontFamily, settings.letterSpacing, settings.lineHeight]);

  useEffect(() => {
    const handleGoto = async (event) => {
      const rendition = renditionRef.current;
      if (!rendition || !event.detail) return;

      const displayedSection = await rendition.display(event.detail);
      if (Number.isInteger(displayedSection?.index)) currentSectionIndexRef.current = displayedSection.index;

      rendition.manager?.scrollTo(0, 0, true);
      window.requestAnimationFrame(() => {
        resetReaderScroll();
        window.requestAnimationFrame(resetReaderScroll);
      });
    };

    window.addEventListener("meomeo:ebook-goto", handleGoto);
    return () => window.removeEventListener("meomeo:ebook-goto", handleGoto);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const rendition = renditionRef.current;
    rendition?.themes.select(settings.theme === "dark" ? "dark" : settings.theme === "sepia" ? "sepia" : "light");
  }, [ready, settings.theme]);

  return <div className="h-[calc(100vh-7rem)] min-h-[520px] w-full scroll-mt-28 overflow-x-hidden overflow-y-auto overscroll-contain pb-24 md:scroll-mt-32" ref={frameRef} />;
}
