import { cn } from "../../utils/cn.js";

function Card({ className, ...props }) {
  return <div className={cn("rounded-xl border border-[#e6dfd8] bg-canvas text-coal", className)} {...props} />;
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}

export { Card, CardContent, CardFooter, CardHeader };
