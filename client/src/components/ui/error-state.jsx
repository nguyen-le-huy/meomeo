import { WifiOff } from "lucide-react";
import { Button } from "./button.jsx";

/**
 * A generic, reusable error banner for data-fetch failures.
 *
 * Props:
 *   error      – the error object from React Query (optional)
 *   title      – heading text (default: "Không tải được dữ liệu")
 *   message    – override the body message (optional)
 *   onRetry    – callback when user clicks "Tải lại" (optional, hides button if omitted)
 *   className  – extra classes for the outer wrapper
 *   dark       – if true, uses a dark (Netflix-style) theme
 */
export default function ErrorState({
  error,
  title = "Không tải được dữ liệu",
  message,
  onRetry,
  className = "",
  dark = false,
}) {
  const body =
    message ||
    error?.response?.data?.message ||
    "Trình duyệt trong Instagram đang chặn web — dùng Safari, Chrome,... sẽ tốt hơn.";

  if (dark) {
    return (
      <div className={`flex flex-col items-center gap-3 rounded-xl bg-white/5 px-6 py-10 text-center ${className}`}>
        <WifiOff className="text-white/40" size={32} />
        <p className="text-base font-bold text-white/80">{title}</p>
        <p className="max-w-sm text-sm text-white/50">{body}</p>
        {onRetry ? (
          <Button
            className="mt-2 border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={onRetry}
            type="button"
            variant="outline"
          >
            Tải lại
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center ${className}`}>
      <WifiOff className="text-red-400" size={32} />
      <p className="text-base font-bold text-red-900">{title}</p>
      <p className="max-w-sm text-sm text-red-700">{body}</p>
      {onRetry ? (
        <Button className="mt-2" onClick={onRetry} type="button" variant="outline">
          Tải lại
        </Button>
      ) : null}
    </div>
  );
}
