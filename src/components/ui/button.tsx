"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, children, disabled, ...props }, ref) => {
    const variants = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20",
      outline:
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
      ghost: "text-slate-700 hover:bg-slate-100",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      default: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-sm",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export { Button };
export type { ButtonProps };
