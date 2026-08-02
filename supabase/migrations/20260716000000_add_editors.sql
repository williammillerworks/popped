create table if not exists public.editors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_editors_updated_at on public.editors;

create trigger set_editors_updated_at
before update on public.editors
for each row
execute function public.set_updated_at();

insert into public.editors (display_name)
values ('Anita Lee Miller')
on conflict (display_name) do update set
  is_active = true;

alter table public.puzzles
  add column if not exists editor_id uuid references public.editors (id);

update public.puzzles
set editor_id = (
  select id
  from public.editors
  where display_name = 'Anita Lee Miller'
)
where editor_id is null;

alter table public.puzzles
  alter column editor_id set not null;

create index if not exists puzzles_editor_id_idx
  on public.puzzles (editor_id);

alter table public.editors enable row level security;
