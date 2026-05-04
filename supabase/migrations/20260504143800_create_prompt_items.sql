create extension if not exists pgcrypto;

create table if not exists public.prompt_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  system_prompt text not null default '',
  target_language text not null default '',
  note text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prompt_items enable row level security;

drop policy if exists "prompt_items_select_own" on public.prompt_items;
drop policy if exists "prompt_items_insert_own" on public.prompt_items;
drop policy if exists "prompt_items_update_own" on public.prompt_items;
drop policy if exists "prompt_items_delete_own" on public.prompt_items;

create policy "prompt_items_select_own"
  on public.prompt_items
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "prompt_items_insert_own"
  on public.prompt_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "prompt_items_update_own"
  on public.prompt_items
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "prompt_items_delete_own"
  on public.prompt_items
  for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists prompt_items_user_updated_idx
  on public.prompt_items (user_id, updated_at desc);

create index if not exists prompt_items_user_favorite_idx
  on public.prompt_items (user_id, is_favorite desc);

create index if not exists prompt_items_tags_idx
  on public.prompt_items using gin (tags);

create or replace function public.set_prompt_items_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_prompt_items_updated_at on public.prompt_items;

create trigger set_prompt_items_updated_at
  before update on public.prompt_items
  for each row
  execute function public.set_prompt_items_updated_at();
