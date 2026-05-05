do $$
begin
  if not exists (select 1 from pg_type where typname = 'prompt_item_display') then
    create type public.prompt_item_display as enum ('private', 'public');
  end if;
end $$;

alter table public.prompt_items
  add column if not exists name text,
  add column if not exists display public.prompt_item_display not null default 'private',
  add column if not exists usage_count bigint not null default 0;

update public.prompt_items
set name = coalesce(nullif(trim(title), ''), nullif(trim(note), ''), 'Untitled suggestion')
where name is null or trim(name) = '';

alter table public.prompt_items
  alter column name set not null;

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_item_id uuid not null references public.prompt_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_item_id)
);

insert into public.user_favorites (user_id, prompt_item_id)
select user_id, id
from public.prompt_items
where is_favorite = true
on conflict do nothing;

drop policy if exists "prompt_items_select_own" on public.prompt_items;
drop policy if exists "prompt_items_insert_own" on public.prompt_items;
drop policy if exists "prompt_items_update_own" on public.prompt_items;
drop policy if exists "prompt_items_delete_own" on public.prompt_items;

create policy "prompt_items_select_visible"
  on public.prompt_items
  for select
  to authenticated
  using (display = 'public' or user_id = auth.uid());

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

alter table public.user_favorites enable row level security;

drop policy if exists "user_favorites_select_own" on public.user_favorites;
drop policy if exists "user_favorites_insert_own" on public.user_favorites;
drop policy if exists "user_favorites_delete_own" on public.user_favorites;

create policy "user_favorites_select_own"
  on public.user_favorites
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_favorites_insert_own"
  on public.user_favorites
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.prompt_items
      where id = prompt_item_id
        and (display = 'public' or user_id = auth.uid())
    )
  );

create policy "user_favorites_delete_own"
  on public.user_favorites
  for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists prompt_items_user_updated_idx
  on public.prompt_items (user_id, updated_at desc);

create index if not exists prompt_items_display_updated_idx
  on public.prompt_items (display, updated_at desc);

create index if not exists prompt_items_usage_idx
  on public.prompt_items (usage_count desc);

create index if not exists prompt_items_tags_idx
  on public.prompt_items using gin (tags);

create index if not exists user_favorites_prompt_item_idx
  on public.user_favorites (prompt_item_id);

drop index if exists public.prompt_items_user_favorite_idx;

create or replace function public.increment_prompt_item_usage(p_prompt_item_id uuid)
returns public.prompt_items
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.prompt_items;
begin
  update public.prompt_items
  set usage_count = usage_count + 1
  where id = p_prompt_item_id
    and (display = 'public' or user_id = auth.uid())
  returning * into item;

  if item.id is null then
    raise exception 'Prompt item not found or not visible';
  end if;

  return item;
end;
$$;

grant execute on function public.increment_prompt_item_usage(uuid) to authenticated;

alter table public.prompt_items
  drop column if exists title,
  drop column if exists description,
  drop column if exists is_favorite;
