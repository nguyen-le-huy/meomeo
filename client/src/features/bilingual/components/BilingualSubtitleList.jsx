import { useRef, useEffect } from "react";
import { cn } from "../../../utils/cn.js";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BilingualSubtitleList({ activeIndex, onSeek, segments }) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div className="divide-y divide-[#e6dfd8]">
      {segments.map((segment, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={segment._id}
            ref={isActive ? activeRef : null}
            className={cn(
              "flex w-full gap-3 px-5 py-3 text-left transition hover:bg-cream-soft",
              isActive && "bg-cream-soft ring-1 ring-inset ring-coral",
            )}
            onClick={() => onSeek(segment.startTime)}
            type="button"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <p
                className={cn(
                  "text-sm leading-relaxed text-coal",
                  isActive && "font-medium",
                )}
              >
                {segment.text}
              </p>
              {segment.translationText ? (
                <p className="text-sm leading-relaxed text-ink-muted">
                  {segment.translationText}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 self-start pt-0.5 text-xs font-medium text-ink-muted">
              {formatTime(segment.startTime)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
