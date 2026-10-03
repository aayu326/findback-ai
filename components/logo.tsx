import Link from 'next/link';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
export const Logo = ({ dark, href = '/' }: { dark?: boolean; href?: string }) => (
  <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white"><Search className="h-4 w-4" /></span>
    <span className={cn('text-lg', dark ? 'text-white' : 'text-navy-900')}>reclaimo <span className="text-accent">AI</span></span>
  </Link>
);
