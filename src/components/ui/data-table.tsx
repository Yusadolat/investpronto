import * as React from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No data available",
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-slate-200 scrollbar-thin",
        className
      )}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500",
                  col.hideOnMobile && "hidden sm:table-cell"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors hover:bg-slate-50/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3.5 text-slate-700",
                      col.hideOnMobile && "hidden sm:table-cell"
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type { DataTableProps, Column };
