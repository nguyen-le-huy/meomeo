import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function resetScrollableElements() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.scrollingElement?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });

  const elements = document.querySelectorAll("main, *");
  elements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    if (element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth) return;

    const style = window.getComputedStyle(element);
    const canScrollY = ["auto", "scroll"].includes(style.overflowY);
    const canScrollX = ["auto", "scroll"].includes(style.overflowX);

    if (canScrollY || canScrollX) {
      element.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  });
}

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    resetScrollableElements();
    const frame = window.requestAnimationFrame(resetScrollableElements);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, search]);

  return null;
}
