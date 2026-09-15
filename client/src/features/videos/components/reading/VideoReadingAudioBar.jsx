import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gauge,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import { cn } from "../../../../utils/cn.js";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VideoReadingAudioBar({
  activeSegment,
  autoScroll,
  currentTime,
  duration,
  isPlaying,
  onReplaySegment,
  onSeek,
  onToggleAutoScroll,
  onToggleMiniPlayer,
  onTogglePlay,
  playbackRate = 1,
  onChangePlaybackRate,
  showMiniPlayer,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (speedRef.current && !speedRef.current.contains(e.target)) {
        setSpeedMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rates = [0.75, 1, 1.25, 1.5];

  return (
    <aside
      aria-label="Thanh điều khiển âm thanh bài đọc"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300",
        isCollapsed ? "translate-y-[calc(100%-28px)]" : "translate-y-0",
      )}
    >
      {/* Collapse toggle tab */}
      <div className="mx-auto flex max-w-5xl justify-end px-4 sm:px-6">
        <button
          aria-label={isCollapsed ? "Mở thanh audio" : "Thu gọn thanh audio"}
          className="flex items-center gap-1 rounded-t-lg border border-b-0 border-[#e6dfd8] bg-white px-3 py-1 text-[11px] font-semibold text-coal shadow-xs hover:bg-cream dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#faf9f5] dark:hover:bg-[#252320]"
          onClick={() => setIsCollapsed((prev) => !prev)}
          type="button"
        >
          <Volume2 className="h-3 w-3 text-coral" />
          <span>{isCollapsed ? "Hiện audio player" : "Thu gọn"}</span>
          {isCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      <div className="border-t border-[#e6dfd8] bg-[#ffffff]/98 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-[#2e2b27] dark:bg-[#181715]/98">
        <div className="mx-auto max-w-5xl px-4 py-2.5 sm:px-6">
          <div className="flex flex-col gap-2">
            {/* Top row: progress slider & timestamps */}
            <div className="flex items-center gap-3">
              <span className="w-11 text-right text-xs font-semibold tabular-nums text-ink-muted">
                {formatTime(currentTime)}
              </span>

              <div className="flex-1 flex items-center">
                <input
                  aria-label="Tua thời gian video"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#e6dfd8] accent-coral outline-none dark:bg-[#2e2b27]"
                  max={Math.max(1, duration || 100)}
                  min={0}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  step={0.5}
                  type="range"
                  value={currentTime || 0}
                />
              </div>

              <span className="w-11 text-xs font-semibold tabular-nums text-ink-muted">
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom row: controls */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Active segment preview */}
              <div className="hidden min-w-0 flex-1 sm:block">
                {activeSegment ? (
                  <p className="truncate text-xs font-medium text-coal dark:text-[#faf9f5]" title={activeSegment.text}>
                    <span className="font-semibold text-coral">Đang đọc: </span>
                    {activeSegment.text}
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted">Bấm Play hoặc chọn câu để nghe audio</p>
                )}
              </div>

              {/* Center: Play / Pause / Replay sentence */}
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Nghe lại câu hiện tại"
                  className="h-8 w-8 rounded-full text-ink-muted hover:bg-cream hover:text-coal dark:hover:bg-[#252320] dark:hover:text-[#faf9f5]"
                  disabled={!activeSegment}
                  onClick={onReplaySegment}
                  size="icon"
                  title="Nghe lại câu hiện tại"
                  variant="ghost"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  aria-label={isPlaying ? "Tạm dừng" : "Phát audio"}
                  className="h-9 w-9 rounded-full bg-coral text-white shadow-sm hover:bg-coral/90"
                  onClick={onTogglePlay}
                  size="icon"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  )}
                </Button>

                {/* Speed selector */}
                <div className="relative" ref={speedRef}>
                  <Button
                    className="h-8 gap-1 rounded-lg px-2 text-xs font-semibold text-coal hover:bg-cream dark:text-[#faf9f5] dark:hover:bg-[#252320]"
                    onClick={() => setSpeedMenuOpen((prev) => !prev)}
                    size="sm"
                    variant="ghost"
                  >
                    <Gauge className="h-3.5 w-3.5 text-ink-muted" />
                    <span>{playbackRate}x</span>
                  </Button>

                  {speedMenuOpen ? (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-28 rounded-xl border border-[#e6dfd8] bg-white p-1 shadow-lg dark:border-[#2e2b27] dark:bg-[#1f1e1b]">
                      {rates.map((rate) => (
                        <button
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                            playbackRate === rate
                              ? "bg-cream-soft font-semibold text-coral dark:bg-coral/15"
                              : "text-coal hover:bg-cream-soft dark:hover:bg-[#252320]",
                          )}
                          key={rate}
                          onClick={() => {
                            onChangePlaybackRate(rate);
                            setSpeedMenuOpen(false);
                          }}
                          type="button"
                        >
                          <span>{rate}x</span>
                          {rate === 1 ? <span className="text-[10px] text-ink-muted">(chuẩn)</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right: Auto-scroll & Mini Player toggle */}
              <div className="flex items-center gap-1.5">
                <Button
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium transition",
                    autoScroll
                      ? "bg-cream text-coral font-semibold dark:bg-coral/15"
                      : "text-ink-muted hover:bg-cream hover:text-coal dark:hover:bg-[#252320] dark:hover:text-[#faf9f5]",
                  )}
                  onClick={onToggleAutoScroll}
                  size="sm"
                  title={autoScroll ? "Tắt tự cuộn theo audio" : "Bật tự cuộn theo audio"}
                  variant="ghost"
                >
                  <span className="hidden sm:inline">Tự cuộn</span>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      autoScroll ? "bg-coral" : "bg-ink-muted/30",
                    )}
                  />
                </Button>

                <Button
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium transition",
                    showMiniPlayer
                      ? "bg-cream text-coral font-semibold dark:bg-coral/15"
                      : "text-ink-muted hover:bg-cream hover:text-coal dark:hover:bg-[#252320] dark:hover:text-[#faf9f5]",
                  )}
                  onClick={onToggleMiniPlayer}
                  size="sm"
                  title="Hiện video thu nhỏ"
                  variant="ghost"
                >
                  {showMiniPlayer ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Video</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
