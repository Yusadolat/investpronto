"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "block w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-10 text-sm text-slate-900 transition-all",
              "focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100",
              error &&
                "border-red-400 focus:ring-red-500/20 focus:border-red-500",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
export { Select };
export type { SelectProps, SelectOption };
