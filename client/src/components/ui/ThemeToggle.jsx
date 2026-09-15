import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";
import { cn } from "../../utils/cn.js";

export function ThemeToggle({ className, isDarkOverride = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35",
        isDarkOverride
          ? "text-white/80 hover:bg-white/10 hover:text-white"
          : "text-ink-muted hover:bg-cream-soft hover:text-coal dark:text-ink-muted dark:hover:bg-cream-strong dark:hover:text-coal",
        className,
      )}
      onClick={toggleTheme}
      title={isDark ? "Chế độ tối (Bấm để chuyển sáng)" : "Chế độ sáng (Bấm để chuyển tối)"}
      type="button"
    >
      <Sun
        className={cn(
          "h-[18px] w-[18px] transition-transform duration-300",
          isDark
            ? "rotate-0 scale-100 text-amber-400"
            : "-rotate-90 scale-0 opacity-0 absolute",
        )}
      />
      <Moon
        className={cn(
          "h-[18px] w-[18px] transition-transform duration-300",
          isDark
            ? "rotate-90 scale-0 opacity-0 absolute"
            : "rotate-0 scale-100 text-ink-body",
        )}
      />
    </button>
  );
}

export default ThemeToggle;
