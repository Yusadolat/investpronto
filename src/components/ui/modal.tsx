"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function Modal({ open, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-50 w-full sm:max-w-lg bg-white shadow-2xl",
          "rounded-t-2xl sm:rounded-2xl",
          "max-h-[90vh] sm:max-h-[85vh] overflow-y-auto",
          "p-5 sm:p-6",
          className
        )}
      >
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {/* Drag indicator on mobile */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 sm:hidden">
          <div className="h-1 w-8 rounded-full bg-slate-200" />
        </div>
        {children}
      </div>
    </div>
  );
}

export { Modal };
export type { ModalProps };
