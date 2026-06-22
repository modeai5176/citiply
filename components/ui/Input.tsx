import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, className, ...props }, ref) {
  return (
    <label className="grid gap-2 text-sm text-text-secondary">
      <span>{label}</span>
      <input
        ref={ref}
        className={cn("h-11 rounded-lg border border-border bg-ivory px-3 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20", className)}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, className, ...props }, ref) {
  return (
    <label className="grid gap-2 text-sm text-text-secondary">
      <span>{label}</span>
      <textarea
        ref={ref}
        className={cn("min-h-28 rounded-lg border border-border bg-ivory px-3 py-3 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20", className)}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
});
