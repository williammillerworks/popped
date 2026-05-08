create table if not exists public.puzzles (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  puzzle_number integer,
  status text not null default 'draft',
  is_test boolean not null default true,
  counts_toward_puzzle_number boolean not null default false,
  song_title_english text not null,
  song_title_korean text,
  artist_name text not null,
  album_art_url text,
  source text not null default 'manual',
  source_track_id text,
  source_country text,
  preview_url text not null,
  preview_start_seconds numeric(8, 3) not null default 0,
  canonical_answer_english text not null,
  canonical_answer_korean text,
  accepted_answers text[] not null default '{}'::text[],
  difficulty text,
  tags text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint puzzles_puzzle_number_positive
    check (puzzle_number is null or puzzle_number > 0),
  constraint puzzles_preview_start_seconds_nonnegative
    check (preview_start_seconds >= 0),
  constraint puzzles_status_valid
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  constraint puzzles_source_valid
    check (source in ('itunes', 'manual')),
  constraint puzzles_difficulty_valid
    check (
      difficulty is null
      or difficulty in ('easy', 'medium', 'hard', 'deep_cut')
    ),
  constraint puzzles_test_not_counted
    check (
      is_test = false
      or (
        counts_toward_puzzle_number = false
        and puzzle_number is null
      )
    ),
  constraint puzzles_accepted_answers_not_empty
    check (cardinality(accepted_answers) > 0)
);

create unique index if not exists puzzles_public_number_unique
  on public.puzzles (puzzle_number)
  where puzzle_number is not null and counts_toward_puzzle_number = true;

create unique index if not exists puzzles_one_public_date_unique
  on public.puzzles (date)
  where status in ('scheduled', 'published') and is_test = false;

create index if not exists puzzles_public_lookup_idx
  on public.puzzles (date, status)
  where is_test = false;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_puzzles_updated_at on public.puzzles;

create trigger set_puzzles_updated_at
before update on public.puzzles
for each row
execute function public.set_updated_at();

alter table public.puzzles enable row level security;

drop policy if exists "Published puzzles are readable" on public.puzzles;
