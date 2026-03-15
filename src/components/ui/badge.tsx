import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60",
    error: "bg-red-50 text-red-700 border border-red-200/60",
    info: "bg-blue-50 text-blue-700 border border-blue-200/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold capitalize",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
