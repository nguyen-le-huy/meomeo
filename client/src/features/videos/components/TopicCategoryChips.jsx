import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn.js";

export const allTopicsValue = "__all__";

export default function TopicCategoryChips({ selectedTopicId, topics, onSelectTopic }) {
  const totalVideoCount = topics.reduce((total, topic) => total + (topic.videoCount || 0), 0);
  const chips = [{ _id: allTopicsValue, name: "All", videoCount: totalVideoCount }, ...topics];

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    const frameId = requestAnimationFrame(checkScroll);

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    // Support mouse wheel vertical-to-horizontal scrolling
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canLeft = e.deltaY < 0 && el.scrollLeft > 0;
        const canRight = e.deltaY > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

        if (canLeft || canRight) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [checkScroll, chips.length]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.max(260, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  if (!topics.length) return null;

  return (
    <div className="relative mb-8 -mt-3">
      {/* Nút cuộn sang trái với hiệu ứng mờ dần */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-9 items-center bg-gradient-to-r from-canvas via-canvas/95 to-transparent pr-7 dark:from-[#181715] dark:via-[#181715]/95">
          <button
            aria-label="Cuộn sang trái"
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-hairline/80 bg-surface-card text-ink shadow-sm transition hover:scale-105 hover:bg-cream-soft active:scale-95 dark:border-[#38342f] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2e2b27]"
            onClick={() => handleScroll("left")}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Thanh cuộn ngang với custom scrollbar rõ ràng, mượt mà */}
      <div
        className="horizontal-scrollbar pb-2.5 pt-0.5 scroll-smooth"
        ref={scrollRef}
      >
        <div className="flex min-w-max items-center gap-2">
          {chips.map((topic) => {
            const isSelected = selectedTopicId === topic._id;

            return (
              <button
                className={cn(
                  "h-8 shrink-0 rounded-lg px-3.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35",
                  isSelected
                    ? "bg-coal text-canvas shadow-sm dark:bg-[#faf9f5] dark:text-[#181715]"
                    : "bg-[#f0ece4] text-[#3d3d3a] hover:bg-[#e6e0d4] hover:text-[#141413] dark:border dark:border-[#38342f]/70 dark:bg-[#252320] dark:text-[#a09d96] dark:hover:border-[#4a453f] dark:hover:bg-[#2e2b27] dark:hover:text-[#faf9f5]",
                )}
                key={topic._id}
                onClick={() => onSelectTopic(topic._id)}
                type="button"
              >
                {topic.name}
                <span
                  className={cn(
                    "ml-1.5 text-xs font-normal",
                    isSelected
                      ? "text-canvas/75 dark:text-[#181715]/70"
                      : "text-ink-muted dark:text-[#8e8b82]",
                  )}
                >
                  {topic.videoCount || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nút cuộn sang phải với hiệu ứng mờ dần */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 z-10 flex h-9 items-center justify-end bg-gradient-to-l from-canvas via-canvas/95 to-transparent pl-7 dark:from-[#181715] dark:via-[#181715]/95">
          <button
            aria-label="Cuộn sang phải"
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-hairline/80 bg-surface-card text-ink shadow-sm transition hover:scale-105 hover:bg-cream-soft active:scale-95 dark:border-[#38342f] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2e2b27]"
            onClick={() => handleScroll("right")}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
