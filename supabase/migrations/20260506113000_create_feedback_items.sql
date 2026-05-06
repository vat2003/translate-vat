create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  topic text not null default 'Feedback',
  subject text not null default '',
  message text not null,
  page_url text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_items_topic_check check (topic in ('Feedback', 'Suggestion', 'Bug report')),
  constraint feedback_items_status_check check (status in ('open', 'reviewing', 'resolved', 'archived')),
  constraint feedback_items_message_check check (length(trim(message)) > 0)
);

alter table public.feedback_items enable row level security;

drop policy if exists "feedback_items_insert_own" on public.feedback_items;
drop policy if exists "feedback_items_select_own" on public.feedback_items;

create policy "feedback_items_insert_own"
  on public.feedback_items
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "feedback_items_select_own"
  on public.feedback_items
  for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists feedback_items_created_at_idx
  on public.feedback_items (created_at desc);

create index if not exists feedback_items_status_created_at_idx
  on public.feedback_items (status, created_at desc);

create index if not exists feedback_items_user_created_at_idx
  on public.feedback_items (user_id, created_at desc);

create or replace function public.set_feedback_items_updated_at()
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

drop trigger if exists set_feedback_items_updated_at on public.feedback_items;

create trigger set_feedback_items_updated_at
  before update on public.feedback_items
  for each row
  execute function public.set_feedback_items_updated_at();
