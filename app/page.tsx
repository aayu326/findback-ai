import Link from 'next/link';
import {
  Camera,
  Sparkles,
  ShieldCheck,
  Bell,
  BarChart3,
  Building2,
  GraduationCap,
  BedDouble,
  Stethoscope,
  ShoppingBag,
  Briefcase,
  Lock,
  CheckCircle2,
} from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

const steps = [
  {
    i: Camera,
    t: 'Report',
    d: 'Post a lost or found item with a photo, location and time in under a minute.',
  },
  {
    i: Sparkles,
    t: 'AI matches',
    d: 'AI reads the photo, extracts details and ranks likely matches with reasons.',
  },
  {
    i: ShieldCheck,
    t: 'Verify & return',
    d: 'Owners answer private questions; an admin approves and records the return.',
  },
];

const features = [
  {
    i: Sparkles,
    t: 'Hybrid AI matching',
    d: 'Vector similarity blended with category, color, brand, place and time.',
  },
  {
    i: Lock,
    t: 'Privacy by design',
    d: 'Row Level Security. IDs, serials and contacts are never shown publicly.',
  },
  {
    i: ShieldCheck,
    t: 'Human-verified claims',
    d: 'AI never approves ownership. Admins review every claim.',
  },
  {
    i: Bell,
    t: 'Instant notifications',
    d: 'Get notified of matches, claim updates and returns.',
  },
  {
    i: BarChart3,
    t: 'Admin analytics',
    d: 'Track recovery rate, hot-spot locations and monthly trends.',
  },
  {
    i: Building2,
    t: 'Multi-organization',
    d: 'Each organization has its own members, locations and data.',
  },
];

const cases = [
  { i: GraduationCap, t: 'Colleges' },
  { i: Briefcase, t: 'Corporate offices' },
  { i: BedDouble, t: 'Hostels' },
  { i: Stethoscope, t: 'Hospitals' },
  { i: ShoppingBag, t: 'Malls' },
  { i: Building2, t: 'Any organization' },
];

const CTAs = ({ dark }: { dark?: boolean }) => (
  <div className="flex flex-col gap-3 sm:flex-row">
    <Button asChild size="lg" variant="accent">
      <Link href="/report/lost">Report Lost Item</Link>
    </Button>

    <Button
      asChild
      size="lg"
      variant={dark ? 'ghostDark' : 'outline'}
    >
      <Link href="/report/found">Report Found Item</Link>
    </Button>
  </div>
);

export default function Landing() {
  return (
    <div>
      {/* HEADER */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo dark />

          <div className="flex items-center gap-2">
            <Button asChild variant="ghostDark" size="sm">
              <Link href="/login">Log in</Link>
            </Button>

            <Button asChild variant="light" size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-950 bg-grid pb-24 pt-32 text-white">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered Lost & Found for organizations
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Find what was lost.
            <br />
            <span className="text-blue-400">
              Return what was found.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Report an item, let AI surface likely matches, and let your
            admins verify and return it — safely and privately.
          </p>

          <div className="mt-8 flex justify-center">
            <CTAs dark />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          How it works
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s, n) => (
            <div
              key={s.t}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-accent">
                  <s.i className="h-5 w-5" />
                </span>

                <span className="text-sm font-semibold text-slate-300">
                  0{n + 1}
                </span>
              </div>

              <h3 className="mt-4 font-semibold">
                {s.t}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI MATCHING */}
      <section className="bg-muted/60 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Matching that explains itself
            </h2>

            <p className="mt-3 text-muted-foreground">
              Each report is analyzed for category, color, brand, model and
              distinctive features, then embedded for semantic search. Scores
              combine vector similarity with structured signals.
            </p>

            <ul className="mt-5 space-y-2 text-sm">
              {[
                'Vector similarity (pgvector)',
                'Category, color & brand',
                'Location & time proximity',
                'Keyword & feature overlap',
              ].map((x) => (
                <li
                  key={x}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Potential Match — 92% AI Match Score
            </span>

            <p className="mt-3 font-medium">
              Black leather wallet
            </p>

            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Same category (Wallet)</li>
              <li>• Matching color (black)</li>
              <li>• Same or nearby location</li>
              <li>• Found shortly after it was lost</li>
            </ul>

            <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
              Similarity signal only —{' '}
              <b>not proof of ownership</b>. An admin verifies every claim.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Built for real operations
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.t}
              className="rounded-xl border bg-white p-6"
            >
              <f.i className="h-5 w-5 text-accent" />

              <h3 className="mt-3 font-semibold">
                {f.t}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-y bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Made for every place people lose things
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">
            {cases.map((c) => (
              <div
                key={c.t}
                className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 p-5 text-center text-sm font-medium"
              >
                <c.i className="h-6 w-6 text-accent" />
                {c.t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-navy-900 py-20 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to bring lost things home?
          </h2>

          <p className="mt-3 text-slate-300">
            Create your organization in minutes, or join with a code.
          </p>

          <div className="mt-8 flex justify-center">
            <CTAs dark />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy-950 py-8 text-center text-xs text-slate-400">
        <div className="flex justify-center">
          <Logo dark />
        </div>

        <p className="mt-3">
          © {new Date().getFullYear()} FindBack AI. Match scores are
          similarity signals, not proof of ownership.
        </p>

        <p className="mt-2 text-slate-500">
          Designed & Developed by{' '}
          <a
            href="https://satyeshsingh.site"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-300 transition-colors hover:text-blue-400"
          >
            Satyesh Singh
          </a>
        </p>
      </footer>
    </div>
  );
}
