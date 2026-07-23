import { AlertTriangle, CheckCircle2, X } from "lucide-react";

const toastStyles = {
  error: {
    container: "border-red-400/30 bg-[#271717]",
    icon: "bg-red-400/15 text-red-300",
  },
  success: {
    container: "border-emerald-400/30 bg-[#15221c]",
    icon: "bg-emerald-400/15 text-emerald-300",
  },
};

function Toast({ message, onClose, variant = "success" }) {
  if (!message) return null;

  const styles = toastStyles[variant] || toastStyles.success;
  const Icon = variant === "error" ? AlertTriangle : CheckCircle2;

  return (
    <div
      aria-atomic="true"
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`app-toast fixed left-1/2 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-3 text-sm text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md sm:left-auto sm:right-5 sm:top-5 sm:translate-x-0 ${styles.container}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${styles.icon}`}>
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1 font-semibold leading-5">{message}</span>
      <button
        aria-label="Đóng thông báo"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white"
        onClick={onClose}
        type="button"
      >
        <X size={15} />
      </button>
      <span className={`app-toast-progress absolute inset-x-0 bottom-0 h-0.5 ${variant === "error" ? "bg-red-300/70" : "bg-emerald-300/70"}`} />
    </div>
  );
}

export { Toast };
