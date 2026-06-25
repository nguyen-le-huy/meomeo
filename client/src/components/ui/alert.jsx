import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn.js";
import { AlertTriangle, Info } from "lucide-react";

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-lg border p-4 text-sm",
  {
    variants: {
      variant: {
        default: "border-[#e6dfd8] bg-canvas text-coal",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        error: "border-red-200 bg-red-50 text-red-900",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconMap = {
  warning: AlertTriangle,
  error: AlertTriangle,
  success: Info,
  default: Info,
};

function Alert({ className, variant = "default", children, ...props }) {
  const Icon = iconMap[variant] || Info;
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export { Alert, alertVariants };
