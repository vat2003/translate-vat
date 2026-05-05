alter table public.prompt_items
  add column if not exists pinned_at timestamptz;

create index if not exists prompt_items_user_pinned_updated_idx
  on public.prompt_items (user_id, pinned_at desc nulls last, updated_at desc);

create index if not exists prompt_items_display_pinned_updated_idx
  on public.prompt_items (display, pinned_at desc nulls last, updated_at desc);
