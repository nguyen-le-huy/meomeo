import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn.js";
import { Spinner } from "./spinner.jsx";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-coral text-white shadow-sm hover:bg-coral-dark",
        secondary: "bg-coal text-canvas hover:bg-[#252320]",
        outline: "border border-[#d8d0c6] bg-canvas text-coal hover:border-coal/30 hover:bg-cream-soft",
        ghost: "text-coal hover:bg-cream-soft",
        link: "h-auto rounded-none px-0 text-coral underline-offset-4 hover:underline",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({ asChild = false, className, size, variant, isLoading, children, disabled, ...props }) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size, className }))} disabled={disabled || isLoading} {...props}>{children}</Slot>;
  }
  
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} disabled={disabled || isLoading} {...props}>
      {isLoading ? <Spinner className="mr-1 opacity-70" size="sm" /> : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
