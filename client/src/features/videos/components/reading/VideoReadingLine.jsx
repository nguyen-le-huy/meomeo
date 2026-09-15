import { memo, useRef } from "react";
import { Edit3, Play, Volume2 } from "lucide-react";
import { cn } from "../../../../utils/cn.js";

const sizeStyles = {
  sm: {
    primary: "text-[15px] sm:text-[16px] leading-relaxed",
    secondary: "text-[13px] sm:text-[14px] leading-relaxed",
  },
  md: {
    primary: "text-[17px] sm:text-[18px] leading-relaxed",
    secondary: "text-[14px] sm:text-[15.5px] leading-relaxed",
  },
  lg: {
    primary: "text-[19px] sm:text-[21px] leading-relaxed",
    secondary: "text-[16px] sm:text-[17.5px] leading-relaxed",
  },
  xl: {
    primary: "text-[22px] sm:text-[24px] leading-relaxed",
    secondary: "text-[18px] sm:text-[19.5px] leading-relaxed",
  },
};

const VideoReadingLine = memo(function VideoReadingLine({
  displayMode = "bilingual",
  fontSize = "md",
  isActive = false,
  isAdmin = false,
  onEdit,
  onPlaySegment,
  segment,
}) {
  const lineRef = useRef(null);
  const currentSize = sizeStyles[fontSize] || sizeStyles.md;

  const showEn = displayMode === "bilingual" || displayMode === "en-only";
  const showVi = displayMode === "bilingual" || displayMode === "vi-only";

  return (
    <div
      className={cn(
        "group relative -mx-2.5 flex items-start justify-between rounded-lg px-2.5 py-1.5 transition-colors duration-200 sm:-mx-3 sm:px-3 sm:py-2",
        isActive
          ? "bg-[#faeee4]/80 ring-1 ring-coral/25 dark:bg-coral/15 dark:ring-coral/40"
          : "hover:bg-[#f4efe8]/70 dark:hover:bg-[#252320]",
      )}
      data-segment-id={segment._id}
      ref={lineRef}
    >
      {/* Active left indicator */}
      {isActive ? (
        <span className="absolute -left-1 top-2 bottom-2 w-1 rounded-full bg-coral" />
      ) : null}

      <div
        className="flex-1 cursor-pointer select-text space-y-0.5 sm:space-y-1"
        onClick={() => onPlaySegment?.(segment.startTime)}
        role="button"
        tabIndex={0}
      >
        {/* Top: English transcript (Main Sub) */}
        {showEn ? (
          <p
            className={cn(
              "font-medium text-coal tracking-normal transition-colors dark:text-[#faf9f5]",
              currentSize.primary,
              isActive && "font-semibold text-coal dark:text-white",
            )}
          >
            {segment.text}
          </p>
        ) : null}

        {/* Bottom: Vietnamese translation directly underneath */}
        {showVi ? (
          <p
            className={cn(
              "font-normal text-[#57534e] tracking-normal dark:text-[#a09d96]",
              currentSize.secondary,
              isActive && "text-[#44403c] font-medium dark:text-[#d5d2cc]",
            )}
          >
            {segment.translationText || (
              <span className="italic text-[#a8a29e] dark:text-[#787571]">(Chưa có bản dịch tiếng Việt)</span>
            )}
          </p>
        ) : null}
      </div>

      {/* Action buttons on hover */}
      <div className="ml-2 flex shrink-0 items-center gap-1 self-start pt-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          aria-label="Nghe câu này"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-coal shadow-xs hover:bg-cream hover:text-coral dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925] dark:hover:text-coral"
          onClick={(e) => {
            e.stopPropagation();
            onPlaySegment?.(segment.startTime);
          }}
          title="Nghe câu này"
          type="button"
        >
          {isActive ? <Volume2 className="h-3.5 w-3.5 text-coral" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        {isAdmin ? (
          <button
            aria-label="Sửa câu này"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-ink-muted shadow-xs hover:bg-cream hover:text-coal dark:bg-[#252320] dark:text-[#a09d96] dark:hover:bg-[#2c2925] dark:hover:text-[#faf9f5]"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(segment);
            }}
            title="Chỉnh sửa phụ đề"
            type="button"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
});

export default VideoReadingLine;
