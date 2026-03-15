"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 border border-slate-200/60">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
