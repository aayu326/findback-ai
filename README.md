# Reclaimo — Lost & Found for organizations

**Find what was lost. Return what was found.** A real, end-to-end MVP: Next.js 15 + TypeScript, Tailwind + shadcn-style UI, Supabase (Postgres, Auth, Storage, RLS, pgvector), Zod + React Hook Form, Recharts, and a pluggable AI layer.

## Features
Signup/login (Supabase Auth) · organizations with join codes, members, locations, admins · lost & found reports with image upload · AI analysis + embeddings · hybrid matching (vector + category + color + brand + location + time + keywords) with explanations · ownership claims with private verification · admin approve / reject / mark returned (AI never decides) · in-app notifications · user + admin dashboards with analytics · RLS everywhere.

## Quick start
```bash
npm install
cp .env.example .env.local   # fill in values
```

### 1. Supabase
1. Create a project at supabase.com. Copy URL, `anon` key, and `service_role` key into `.env.local`.
2. Apply migrations — either:
   - **CLI:** `npx supabase link --project-ref <ref> && npx supabase db push`
   - **or SQL editor:** run `supabase/migrations/0001_schema.sql`, then `0002_rls.sql`, then `supabase/seed.sql`.
3. `pgvector` is enabled by the first migration (`create extension vector`).
4. Auth → Providers → Email enabled. For quick local testing, disable "Confirm email" (or the seed users, which are pre-confirmed, are enough). Set Site URL to `http://localhost:3000` and add your Vercel URL under Redirect URLs.
5. The private `item-images` Storage bucket and its policies are created by the migration.

### 2. AI (optional but recommended)
See **[AI_SETUP.md](AI_SETUP.md)**. Without a key the app still works.

### 3. Run
```bash
npm run seed    # demo college: users, 5 lost + 5 found reports, real AI + matching
npm run dev     # http://localhost:3000
```
Demo logins (password `Demo@12345`): `admin@reclaimo.demo`, `arjun@reclaimo.demo`, `sara@reclaimo.demo`, `ravi@reclaimo.demo`. New users can join with code **`DEMO2026`**.

Demo flow: log in as **arjun** → "My Reports" → *Black leather wallet* → see the Potential Match → "View & claim" → submit private details → log in as **admin** → *Claims* → compare against the finder's private details → Approve → Mark returned → Arjun gets notifications.

## Security model
- **RLS on every table.** Lost reports: reporter + org admins only. Found reports: org members (non-sensitive fields only). Sensitive info (IDs, IMEI/serial, wallet contents) lives in `item_private_details` → owner + admins only, and is never sent to AI.
- Phone/email never exposed publicly; profiles readable by self and org admins only. Embeddings table has no client policies.
- Storage bucket is private; images served via short-lived signed URLs, gated by RLS on `item_images`.
- `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` are server-only (used in server actions / pipeline). Service role is used only for matching, notifications, and audit logs.
- Claims: only admins can change status (RLS + server check). AI scores are displayed as "similarity signal, not proof of ownership".

## Architecture
```
app/            routes (landing, auth, onboarding, (app)/ dashboards, admin/)
components/     UI primitives (shadcn-style), forms, charts
lib/ai/         provider abstraction (gemini, openai-compatible)
lib/matching/   score.ts (hybrid scoring), pipeline.ts (analyze → embed → match → notify)
lib/actions/    server actions (reports, claims, admin)
lib/supabase/   browser/server/admin clients + middleware
lib/validation/ Zod schemas (shared client+server)
supabase/       migrations + demo seed
scripts/seed.ts demo data with real AI processing
```
Report submission saves the report first, then runs `after()` → AI analysis, embedding, matching, notifications. Any AI/network error is logged and swallowed.

## Deploy to Vercel
1. Push to GitHub, import in Vercel.
2. Add env vars from `.env.example` (all of them; keep `SUPABASE_SERVICE_ROLE_KEY` and `AI_API_KEY` non-public).
3. Set Supabase Auth Site URL / Redirect URLs to your Vercel domain.
4. Deploy. (Background AI work uses `after()`; on Hobby, function duration limits apply — keep images ≤5 MB.)

## Known MVP limits
- One organization per user. No email notifications (in-app only). Pagination is minimal (60–100 rows). Seed reports have no photos (upload your own to see vision analysis). Matching scans up to 300 open candidates per org — fine for MVP; move scoring into SQL/RPC at larger scale.
