import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "bg-coal text-white dark:bg-[#faf9f5] dark:text-[#181715]",
        secondary: "bg-cream text-coal dark:bg-[#252320] dark:text-[#faf9f5]",
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        warning: "bg-amber-400 text-white dark:bg-amber-500/20 dark:text-amber-300",
        youtube: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
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
