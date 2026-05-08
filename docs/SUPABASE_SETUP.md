# POPPED Supabase Setup

POPPED uses Supabase Postgres for curated daily puzzles. The public game loads today’s published, non-test puzzle through `/api/today`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values from your Supabase project settings.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://...
```

- `NEXT_PUBLIC_SUPABASE_URL` is the Supabase project URL. It is safe for browser use.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the publishable or legacy anon key. Public reads are still protected by Row Level Security.
- `NEXT_PUBLIC_SITE_URL` is used in spoiler-safe share text. Set it to your Vercel production domain for deploys.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and should never be exposed to the browser or committed.
- `SUPABASE_DB_URL` is optional and only needed for local database tooling or one-off scripts.

Admin auth uses separate server-only variables documented in `docs/ADMIN_AUTH.md`.

## Database

The puzzle schema lives in:

```text
supabase/migrations/20260507000000_create_puzzles.sql
```

The local development seed lives in:

```text
supabase/seed.sql
```

The migration creates `public.puzzles`, enables Row Level Security, and leaves direct public table access closed by default. Public game reads go through `/api/today`, which returns only the safe gameplay fields and uses `SUPABASE_SERVICE_ROLE_KEY` on the server. Admin write routes also use `SUPABASE_SERVICE_ROLE_KEY` only after an explicit admin-auth check.

## Launch Puzzle #1

Create the launch puzzle from `/admin/puzzles/new`:

1. Set the launch date.
2. Set `status` to `published` on launch day, or `scheduled` before launch.
3. Turn off `Test puzzle`.
4. Turn on `Counts toward public puzzle number`.
5. Save.

If there are no existing countable puzzle numbers, the app assigns `puzzle_number = 1`. Test puzzles and non-counting puzzles keep `puzzle_number = null`.

## Local Smoke Check

After applying the migration and seed to a Supabase project, the app can verify a published puzzle through:

```bash
GET /api/today?date=2026-05-07
```

If Supabase env vars are missing, the route returns a `503` instead of crashing the app.
