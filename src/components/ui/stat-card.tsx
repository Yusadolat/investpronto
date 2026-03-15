import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "blue" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}

const variantStyles = {
  default: {
    card: "border-slate-200/80",
    icon: "bg-slate-100 text-slate-600",
    accent: "bg-slate-500",
  },
  blue: {
    card: "border-blue-100",
    icon: "bg-blue-50 text-blue-600",
    accent: "bg-blue-500",
  },
  emerald: {
    card: "border-emerald-100",
    icon: "bg-emerald-50 text-emerald-600",
    accent: "bg-emerald-500",
  },
  amber: {
    card: "border-amber-100",
    icon: "bg-amber-50 text-amber-600",
    accent: "bg-amber-500",
  },
  rose: {
    card: "border-rose-100",
    icon: "bg-rose-50 text-rose-600",
    accent: "bg-rose-500",
  },
  violet: {
    card: "border-violet-100",
    icon: "bg-violet-50 text-violet-600",
    accent: "bg-violet-500",
  },
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        styles.card,
        className
      )}
    >
      {/* Top accent line */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          styles.accent
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              styles.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold",
                trend.positive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              <svg
                className={cn(
                  "mr-0.5 h-3 w-3",
                  !trend.positive && "rotate-180"
                )}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                  clipRule="evenodd"
                />
              </svg>
              {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400 truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
