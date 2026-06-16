import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-black leading-none",
  {
    variants: {
      variant: {
        default: "bg-coal text-white",
        secondary: "bg-matcha text-coal",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-400 text-white",
        youtube: "bg-red-50 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
