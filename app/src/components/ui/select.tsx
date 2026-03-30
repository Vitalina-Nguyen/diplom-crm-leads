import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  /** Подсказка для первой отключённой option (плейсхолдер) */
  placeholderOption?: string;
};

export function Select({
  label,
  error,
  id,
  className = "",
  children,
  placeholderOption,
  ...props
}: Props) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={inputId}
        title={placeholderOption}
        className={`cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 focus:border-blue-500 focus:ring-2 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
