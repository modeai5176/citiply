import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminTable({
  headers,
  children,
  empty,
  className
}: {
  headers: ReactNode[];
  children: ReactNode;
  empty?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.16em] text-text-muted">
            <tr>{headers.map((header, index) => <th className="px-4 py-3.5 font-semibold" key={index}>{header}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {empty ? (
        <div className="border-t border-border px-4 py-12 text-center">
          <p className="font-medium text-text-primary">No records found</p>
          <p className="mt-1 text-sm text-text-secondary">Create a new item or adjust your filters.</p>
        </div>
      ) : null}
    </div>
  );
}

export function AdminTableRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr className={cn("border-t border-border transition hover:bg-surface/60", onClick && "cursor-pointer")} onClick={onClick}>
      {children}
    </tr>
  );
}

export function AdminTableCell({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return <td className={cn("px-4 py-4 align-middle text-text-secondary", className)} colSpan={colSpan}>{children}</td>;
}
