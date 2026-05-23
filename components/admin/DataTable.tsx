import type { ReactNode } from "react";

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-[0.18em] text-text-muted">
          <tr>{headers.map((header) => <th className="px-4 py-3 font-medium" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-border" key={index}>
              {row.map((cell, cellIndex) => <td className="px-4 py-4 text-text-secondary" key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
