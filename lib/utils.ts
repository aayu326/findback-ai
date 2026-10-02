import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const fmtDay = (d: string | Date) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' });
