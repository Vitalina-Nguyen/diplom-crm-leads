import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export function Textarea({ label, error, id, className = "", placeholder, ...props }: Props) {
  const inputId = id ?? props.name;
  const ph =
    placeholder !== undefined
      ? placeholder
      : typeof label === "string"
        ? label
        : undefined;
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        placeholder={ph}
        className={`min-h-[96px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
