import { cn } from "../../utils/cn.js";

export default function Button({ className, type = "button", ...props }) {
  return (
    <button
      className={cn(
        "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
