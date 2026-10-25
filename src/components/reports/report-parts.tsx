import type { ReactNode } from "react";
import { Card, Eyebrow, cn } from "@/components/ui";

export function StatTile({ label, value, detail, emphasis }: { label: string; value: ReactNode; detail?: ReactNode; emphasis?: boolean }) {
  return (
    <Card className={cn("flex flex-col gap-2 p-4", emphasis && "border-green-300")}>
      <span className="text-caption text-ink-muted">{label}</span>
      <span className="font-mono text-h2 tabular-nums text-ink">{value}</span>
      {detail ? <span className="text-caption text-ink-muted">{detail}</span> : null}
    </Card>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-4 p-5", className)}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </Card>
  );
}

/** Single-series horizontal bars: label, bar, value. */
export function BarList({ rows, empty, max = 8 }: { rows: Array<{ label: string; count: number }>; empty: string; max?: number }) {
  const shown = rows.slice(0, max);
  if (shown.length === 0) return <p className="text-small text-ink-muted">{empty}</p>;
  const top = Math.max(1, ...shown.map((row) => row.count));
  return (
    <ul className="flex flex-col gap-2.5">
      {shown.map((row) => (
        <li key={row.label} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3" title={`${row.label}: ${row.count}`}>
          <span className="truncate text-small text-ink">{row.label}</span>
          <span className="h-2.5 rounded-r-xs bg-n-100">
            <span className="block h-full rounded-r-xs bg-accent" style={{ width: `${Math.max(2, (row.count / top) * 100)}%` }} />
          </span>
          <span className="text-right font-mono text-small tabular-nums text-ink">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

export type TableColumn = { label: string; align?: "left" | "right" };

export function DataTable({ columns, rows, empty }: { columns: TableColumn[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-small text-ink-muted">{empty}</p>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[20rem] text-small">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th key={column.label} scope="col" className={cn("px-1 pb-2 text-caption font-medium text-ink-muted", column.align === "right" ? "text-right" : "text-left")}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-line last:border-0">
              {row.map((cell, c) => (
                <td key={c} className={cn("px-1 py-2 text-ink", columns[c].align === "right" ? "text-right font-mono tabular-nums" : "text-left")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
