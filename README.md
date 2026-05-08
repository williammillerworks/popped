# POPPED

POPPED is a daily K-pop audio guessing game built with Next.js, TypeScript, Tailwind CSS, and Supabase Postgres.

Players hear short snippets, guess the song title, reveal the answer, and share a spoiler-safe result card. Admins curate daily puzzles, search iTunes previews, tune the start timestamp, and manage the puzzle schedule.

## Local Setup

Install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in `.env.local`, then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If Supabase is not configured or no eligible puzzle exists for today, `/` shows a graceful "Warming up" state instead of crashing.

## Environment Variables

Required for Supabase-backed puzzles:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Required for admin access:

```bash
ADMIN_ALLOWED_EMAILS=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Recommended for production share text:

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Optional for local database tooling:

```bash
SUPABASE_DB_URL=
```

Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never prefix `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, or `ADMIN_SESSION_SECRET` with `NEXT_PUBLIC_`.

## Supabase Setup

Apply the migration in:

```text
supabase/migrations/20260507000000_create_puzzles.sql
```

Optional local seed data lives in:

```text
supabase/seed.sql
```

The public game reads puzzles through `/api/today`. Admin create/edit routes use the server-only Supabase service role key after admin auth.

More detail: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Admin Setup

Admin routes use simple allowlisted MVP auth.

1. Set `ADMIN_ALLOWED_EMAILS` to one or more comma-separated admin emails.
2. Set `ADMIN_PASSWORD` to a strong shared admin password.
3. Set `ADMIN_SESSION_SECRET` to a long random value.
4. Visit `/admin`, sign in, then use `/admin/puzzles`.

More detail: [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md).

## Create The First Launch Puzzle #1

Puzzle numbering starts at `#1` for the first real public puzzle.

1. Sign in at `/admin`.
2. Go to `/admin/puzzles/new`.
3. Use music search or manual fields to add the launch song.
4. Set the launch `date`.
5. Set `status` to `published` for launch day, or `scheduled` before launch.
6. Turn off `Test puzzle`.
7. Turn on `Counts toward public puzzle number`.
8. Save the puzzle.

If no existing countable puzzle has a number, the app assigns `puzzleNumber = 1`. Test puzzles and puzzles with `countsTowardPuzzleNumber=false` receive `null` and do not affect launch numbering. Existing puzzle numbers are preserved in MVP.

## Useful Checks

```bash
./node_modules/.bin/tsc --noEmit
npm run lint
npm run build
```

After the dev server is running:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/api/today
curl -i "http://localhost:3000/api/admin/music-search?term=LOVE%20DIVE&country=US"
```

Expected notes:

- `/` should return `200`.
- `/api/today` returns today’s published, non-test puzzle when Supabase has one; otherwise it returns structured JSON with `puzzle: null` or a clear config error.
- `/api/admin/music-search` requires admin auth and returns `401` when signed out.

## Deployment To Vercel

1. Create a Vercel project from this repository.
2. Add all required environment variables in Vercel Project Settings.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
4. Apply the Supabase migration.
5. Create the first launch puzzle #1 in admin.
6. Deploy.

The app is designed for Vercel’s standard Next.js deployment flow.

## Product Source Of Truth

The product requirements document is [docs/POPPED_PRD_v0_2.md](docs/POPPED_PRD_v0_2.md).
