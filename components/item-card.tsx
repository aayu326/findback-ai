import Link from 'next/link';
import { ImageIcon, MapPin, Clock } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { fmtDay } from '@/lib/utils';

export type CardItem = {
  id: string; title: string; category: string; color?: string | null; status: string; occurred_at: string;
  location_text?: string | null; location?: { name: string } | null;
};
export function ItemCard({ item, kind, img, href }: { item: CardItem; kind: 'lost' | 'found'; img?: string; href?: string }) {
  return (
    <Link href={href ?? `/items/${kind}/${item.id}`} className="group fade-in flex gap-3 rounded-lg border bg-white p-3 transition hover:border-accent/50 hover:shadow-md">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
        {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt={item.title} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium group-hover:text-accent">{item.title}</p><StatusBadge status={item.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5"><Badge>{item.category}</Badge>{item.color && <Badge>{item.color}</Badge>}</div>
        <p className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{item.location?.name ?? item.location_text ?? '—'}</span>
          <span className="flex shrink-0 items-center gap-1"><Clock className="h-3 w-3" />{fmtDay(item.occurred_at)}</span>
        </p>
      </div>
    </Link>
  );
}
export const Empty = ({ children }: { children: React.ReactNode }) =>
  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
