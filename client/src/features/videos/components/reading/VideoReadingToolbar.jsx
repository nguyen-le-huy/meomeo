import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Languages,
  Mic,
  PenTool,
  Printer,
  Sparkles,
  Tv,
  Type,
} from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import { cn } from "../../../../utils/cn.js";

export default function VideoReadingToolbar({
  autoScroll,
  displayMode,
  fontSize,
  onCopyAll,
  onPrint,
  onToggleAutoScroll,
  onUpdateDisplayMode,
  onUpdateFontSize,
  videoId,
  videoTitle,
}) {
  const [copied, setCopied] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [displayModeOpen, setDisplayModeOpen] = useState(false);
  const [modeSwitchOpen, setModeSwitchOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFontSizeOpen(false);
        setDisplayModeOpen(false);
        setModeSwitchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCopy() {
    await onCopyAll();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fontSizeLabels = {
    sm: "Chữ nhỏ (16px)",
    md: "Chữ vừa (18px)",
    lg: "Chữ lớn (21px)",
    xl: "Rất lớn (24px)",
  };

  const displayModeLabels = {
    bilingual: "Song ngữ (Anh - Việt)",
    "en-only": "Chỉ tiếng Anh",
    "vi-only": "Chỉ tiếng Việt",
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-[#e6dfd8] bg-canvas/95 backdrop-blur-md dark:border-[#2e2b27]"
      ref={containerRef}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        {/* Left: Back and Title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            asChild
            className="h-9 w-9 shrink-0 text-ink-muted hover:bg-cream hover:text-coal dark:hover:bg-[#252320] dark:hover:text-[#faf9f5]"
            size="icon"
            variant="ghost"
          >
            <Link aria-label="Về thư viện" to="/youtube">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="hidden rounded bg-cream px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-coral dark:bg-coral/15 sm:inline-block">
                Đọc báo sub
              </span>
              <h1 className="truncate text-sm font-semibold text-coal sm:text-base" title={videoTitle}>
                {videoTitle || "Bài đọc song ngữ"}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Controls & Mode Links */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Font size menu */}
          <div className="relative">
            <Button
              className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-coal hover:bg-cream dark:hover:bg-[#252320]"
              onClick={() => {
                setFontSizeOpen((prev) => !prev);
                setDisplayModeOpen(false);
                setModeSwitchOpen(false);
              }}
              size="sm"
              variant="ghost"
            >
              <Type className="h-3.5 w-3.5 text-coral" />
              <span className="hidden sm:inline">Cỡ chữ</span>
              <span className="font-semibold uppercase">{fontSize}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>

            {fontSizeOpen ? (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#e6dfd8] bg-white p-1.5 shadow-lg dark:border-[#2e2b27] dark:bg-[#1f1e1b]">
                {["sm", "md", "lg", "xl"].map((size) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition",
                      fontSize === size
                        ? "bg-cream-soft font-semibold text-coral dark:bg-coral/15"
                        : "text-coal hover:bg-cream-soft dark:hover:bg-[#252320]",
                    )}
                    key={size}
                    onClick={() => {
                      onUpdateFontSize(size);
                      setFontSizeOpen(false);
                    }}
                    type="button"
                  >
                    <span>{fontSizeLabels[size]}</span>
                    {fontSize === size ? <Check className="h-3.5 w-3.5 text-coral" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Subtitle display mode menu */}
          <div className="relative">
            <Button
              className="h-8 gap-1 rounded-lg px-2 text-xs font-medium text-coal hover:bg-cream dark:hover:bg-[#252320]"
              onClick={() => {
                setDisplayModeOpen((prev) => !prev);
                setFontSizeOpen(false);
                setModeSwitchOpen(false);
              }}
              size="sm"
              variant="ghost"
            >
              <Languages className="h-3.5 w-3.5 text-coral" />
              <span className="hidden sm:inline">Hiển thị</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>

            {displayModeOpen ? (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[#e6dfd8] bg-white p-1.5 shadow-lg dark:border-[#2e2b27] dark:bg-[#1f1e1b]">
                {["bilingual", "en-only", "vi-only"].map((mode) => (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition",
                      displayMode === mode
                        ? "bg-cream-soft font-semibold text-coral dark:bg-coral/15"
                        : "text-coal hover:bg-cream-soft dark:hover:bg-[#252320]",
                    )}
                    key={mode}
                    onClick={() => {
                      onUpdateDisplayMode(mode);
                      setDisplayModeOpen(false);
                    }}
                    type="button"
                  >
                    <span>{displayModeLabels[mode]}</span>
                    {displayMode === mode ? <Check className="h-3.5 w-3.5 text-coral" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Mode switch menu */}
          <div className="relative">
            <Button
              className="h-8 gap-1.5 rounded-lg border border-[#e6dfd8] bg-white px-2.5 text-xs font-medium text-coal hover:bg-cream-soft dark:border-[#2e2b27] dark:bg-[#252320] dark:text-[#faf9f5] dark:hover:bg-[#2c2925]"
              onClick={() => {
                setModeSwitchOpen((prev) => !prev);
                setFontSizeOpen(false);
                setDisplayModeOpen(false);
              }}
              size="sm"
              variant="outline"
            >
              <Sparkles className="h-3.5 w-3.5 text-coral" />
              <span className="hidden sm:inline">Chế độ khác</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>

            {modeSwitchOpen ? (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#e6dfd8] bg-white p-1.5 shadow-lg dark:border-[#2e2b27] dark:bg-[#1f1e1b]">
                <Link
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-coal hover:bg-cream-soft dark:hover:bg-[#252320]"
                  onClick={() => setModeSwitchOpen(false)}
                  to={`/videos/${videoId}/bilingual`}
                >
                  <Tv className="h-3.5 w-3.5 text-coral" />
                  <span>Xem video song ngữ</span>
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-coal hover:bg-cream-soft dark:hover:bg-[#252320]"
                  onClick={() => setModeSwitchOpen(false)}
                  to={`/videos/${videoId}?mode=dictation`}
                >
                  <PenTool className="h-3.5 w-3.5 text-coral" />
                  <span>Nghe - viết chính tả</span>
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-coal hover:bg-cream-soft dark:hover:bg-[#252320]"
                  onClick={() => setModeSwitchOpen(false)}
                  to={`/videos/${videoId}?mode=shadowing`}
                >
                  <Mic className="h-3.5 w-3.5 text-coral" />
                  <span>Bắt chước phát âm</span>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Copy all button */}
          <Button
            aria-label="Sao chép toàn bộ"
            className="h-8 w-8 rounded-lg text-ink-muted hover:bg-cream hover:text-coal dark:hover:bg-[#252320] dark:hover:text-[#faf9f5]"
            onClick={handleCopy}
            size="icon"
            title={copied ? "Đã sao chép!" : "Sao chép toàn bộ nội dung"}
            variant="ghost"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>

          {/* Print button */}
          <Button
            aria-label="In bài đọc"
            className="hidden h-8 w-8 rounded-lg text-ink-muted hover:bg-cream hover:text-coal dark:hover:bg-[#252320] dark:hover:text-[#faf9f5] sm:inline-flex"
            onClick={onPrint}
            size="icon"
            title="In / Lưu PDF"
            variant="ghost"
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
