import { cn } from "../../utils/cn.js";

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-[#d8d0c6] bg-canvas px-3.5 py-2.5 text-sm text-coal outline-none transition placeholder:text-ink-muted/70 focus:border-coral focus:ring-2 focus:ring-coral/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
