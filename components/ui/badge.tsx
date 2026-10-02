import { cn } from '@/lib/utils';
const tones: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200', green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200', red: 'bg-red-50 text-red-700 ring-red-200',
  gray: 'bg-slate-100 text-slate-700 ring-slate-200', navy: 'bg-navy-900 text-white ring-navy-900',
};
export const Badge = ({ tone = 'gray', className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) =>
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)} {...p} />;
const statusTone: Record<string, string> = {
  open: 'blue', matched: 'amber', returned: 'green', closed: 'gray', PENDING: 'amber', APPROVED: 'blue', REJECTED: 'red', RETURNED: 'green',
  suggested: 'blue', claimed: 'amber', confirmed: 'green', dismissed: 'gray',
};
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={statusTone[status] ?? 'gray'}>{status}</Badge>;
