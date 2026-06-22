import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-coal text-white",
        secondary: "bg-cream text-coal",
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
