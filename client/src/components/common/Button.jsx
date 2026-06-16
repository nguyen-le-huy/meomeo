import { cn } from "../../utils/cn.js";

export default function Button({ className, type = "button", ...props }) {
  return (
    <button
      className={cn(
        "rounded-md bg-coal px-4 py-2 text-sm font-medium text-matcha hover:bg-black",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
