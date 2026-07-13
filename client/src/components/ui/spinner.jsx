import { cn } from "../../utils/cn.js";

function Spinner({ className, size = "md", ...props }) {
  const sizeClass = {
    sm: "h-3.5 w-3.5 border-2",
    md: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-[3px]",
  }[size] || size;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent",
        sizeClass,
        className,
      )}
      {...props}
    />
  );
}

function LoadingState({ className, label = "Đang tải...", size = "lg" }) {
  return (
    <div className={cn("flex min-h-40 flex-col items-center justify-center gap-3 text-ink-muted", className)}>
      <Spinner className="text-coral" size={size} />
      {label ? <p className="text-sm font-semibold">{label}</p> : null}
    </div>
  );
}

export { LoadingState, Spinner };
