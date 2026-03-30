import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table
        className={`w-full border-collapse text-left text-sm [&_tbody>tr:nth-child(odd):not([data-inactive])]:bg-slate-100 ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 ${className}`}
      {...props}
    />
  );
}

export function Td({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`border-b border-slate-100 px-3 py-2 text-slate-800 ${className}`} {...props} />;
}
