import * as React from 'react';
import { cn } from '@/lib/utils';
const base = 'w-full rounded-md border bg-white px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, r) =>
  <input ref={r} className={cn(base, 'h-10', className)} {...p} />);
Input.displayName = 'Input';
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, r) =>
  <textarea ref={r} className={cn(base, 'min-h-[84px] py-2', className)} {...p} />);
Textarea.displayName = 'Textarea';
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, r) =>
  <select ref={r} className={cn(base, 'h-10', className)} {...p} />);
Select.displayName = 'Select';
export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) =>
  <label className={cn('mb-1.5 block text-sm font-medium', className)} {...p} />;
export const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <div><Label>{label}</Label>{children}{hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>
);
