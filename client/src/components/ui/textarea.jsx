import { cn } from "../../utils/cn.js";

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md border border-coal/20 bg-white px-3 py-2 text-sm font-semibold outline-none transition placeholder:text-coal/40 focus:border-coal focus:ring-2 focus:ring-coal/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
