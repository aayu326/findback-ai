import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Package, Search, ShieldCheck, Bell, BarChart3, ClipboardList, Users, MapPin, LogOut, FileSearch, Handshake } from 'lucide-react';
import { Logo } from '@/components/logo';
import type { Ctx } from '@/lib/auth';

const user = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'My Reports', icon: Package },
  { href: '/found', label: 'Found Items', icon: Search },
  { href: '/claims', label: 'My Claims', icon: ShieldCheck },
  { href: '/handovers', label: 'Handovers', icon: Handshake },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];
const admin = [
  { href: '/admin', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reports', label: 'Reports', icon: ClipboardList },
  { href: '/admin/claims', label: 'Claims', icon: FileSearch },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
];
function NavLinks({ list }: { list: typeof user }) {
  return <>{list.map(({ href, label, icon: I }) => (
    <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
      <I className="h-4 w-4" />{label}</Link>))}</>;
}
export function Shell({ ctx, unread, children }: { ctx: Ctx; unread: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40 md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 p-4 md:flex md:sticky md:top-0 md:h-screen">
        <Logo dark href="/dashboard" />
        <div className="mt-6 rounded-lg bg-white/5 p-3 text-xs text-slate-300">
          <p className="truncate font-medium text-white">{ctx.orgName}</p><p className="capitalize">{ctx.orgType} · {ctx.role}</p>
        </div>
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          <NavLinks list={user} />
          {ctx.isAdmin && <><p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Admin</p><NavLinks list={admin} /></>}
        </nav>
        <form action="/auth/signout" method="post">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="md:hidden"><Logo href="/dashboard" /></div>
          <p className="hidden text-sm text-muted-foreground md:block">Hi, <span className="font-medium text-foreground">{ctx.fullName}</span></p>
          <div className="flex items-center gap-2">
            <Link href="/report/lost" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Report Lost</Link>
            <Link href="/report/found" className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600">Report Found</Link>
            <Link href="/notifications" className="relative rounded-md p-2 hover:bg-muted"><Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">{unread}</span>}</Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-white py-1.5 md:hidden">
        {[...user.slice(0, 4), ...(ctx.isAdmin ? [admin[0]] : [user[4]])].map(({ href, label, icon: I }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] text-muted-foreground"><I className="h-5 w-5" />{label.split(' ')[0]}</Link>))}
      </nav>
    </div>
  );
}
export const PageHeader = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}</div>{action}
  </div>
);
