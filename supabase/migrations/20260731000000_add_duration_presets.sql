alter table public.puzzles
  add column if not exists duration_preset_id text not null default 'classic_v1';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'puzzles_duration_preset_id_check'
      and conrelid = 'public.puzzles'::regclass
  ) then
    alter table public.puzzles
      add constraint puzzles_duration_preset_id_check
      check (
        duration_preset_id in (
          'classic_v1',
          'balanced_v1',
          'generous_v1'
        )
      );
  end if;
end
$$;
