import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";
import { getReaderFont, READER_THEMES } from "../config/readerAppearance.js";
import reithSansBoldUrl from "../../../bbcreith_v2.300/BBCReithSans_V2.300/Web/WOFF2/BBCReithSans_W_Bd.woff2?url";
import reithSansUrl from "../../../bbcreith_v2.300/BBCReithSans_V2.300/Web/WOFF2/BBCReithSans_W_Rg.woff2?url";
import reithSerifBoldUrl from "../../../bbcreith_v2.300/BBCReithSerif_V2.300/Web/WOFF2/BBCReithSerif_W_Bd.woff2?url";
import reithSerifUrl from "../../../bbcreith_v2.300/BBCReithSerif_V2.300/Web/WOFF2/BBCReithSerif_W_Rg.woff2?url";

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

  const sanitizeEpubDocument = (doc) => {
    if (!doc?.querySelectorAll) return;

    doc.querySelectorAll("script").forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((node) => {
      Array.from(node.attributes || []).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || "").trim().toLowerCase();
        if (name.startsWith("on") || value.startsWith("javascript:")) {
          node.removeAttribute(attribute.name);
        }
      });
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

    // R2 ebooks are served through an extensionless API proxy. Without this
    // hint, epub.js treats the URL as an unpacked directory and requests
    // `/META-INF/container.xml` from the API route instead of opening the zip.
    const book = ePub(ebook.fileUrl, { openAs: "epub" });
    book.spine.hooks.content.register(sanitizeEpubDocument);
    const rendition = book.renderTo(frameRef.current, {
      width: "100%",
      height: "100%",
      spread: "none",
      flow: "scrolled-doc",
      manager: "default",
      method: "blobUrl",
    });

    bookRef.current = book;
    renditionRef.current = rendition;

    READER_THEMES.forEach((theme) => {
      rendition.themes.register(theme.id, {
        html: { background: `${theme.background} !important` },
        body: { color: `${theme.foreground} !important`, background: `${theme.background} !important` },
        "p, div, span, li, h1, h2, h3, h4, h5, h6": { color: "inherit !important" },
        a: { color: `${theme.accent} !important` },
      });
    });
    constrainRenderedLayout();

    rendition.hooks.content.register((contents) => {
      contents.document.documentElement.style.maxWidth = "100%";
      contents.document.documentElement.style.overflowX = "hidden";
      contents.document.body.style.maxWidth = "100%";
      contents.document.body.style.overflowX = "hidden";
      contents.document.body.style.paddingBottom = "1.25rem";
      contents.document.body.style.boxSizing = "border-box";
      const style = contents.document.createElement("style");
      style.textContent = `
        @font-face {
          font-display: swap;
          font-family: "BBC Reith Serif";
          font-style: normal;
          font-weight: 400;
          src: url("${reithSerifUrl}") format("woff2");
        }
        @font-face {
          font-display: swap;
          font-family: "BBC Reith Serif";
          font-style: normal;
          font-weight: 700;
          src: url("${reithSerifBoldUrl}") format("woff2");
        }
        @font-face {
          font-display: swap;
          font-family: "BBC Reith Sans";
          font-style: normal;
          font-weight: 400;
          src: url("${reithSansUrl}") format("woff2");
        }
        @font-face {
          font-display: swap;
          font-family: "BBC Reith Sans";
          font-style: normal;
          font-weight: 700;
          src: url("${reithSansBoldUrl}") format("woff2");
        }
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
        "font-family": getReaderFont(settings.fontFamily).css,
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
    rendition.themes.override("font-family", getReaderFont(settings.fontFamily).css);
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
    rendition?.themes.select(settings.theme);
  }, [ready, settings.theme]);

  return <div className="min-h-0 flex-1 w-full overflow-x-hidden overflow-y-auto overscroll-contain pb-2" ref={frameRef} />;
}
