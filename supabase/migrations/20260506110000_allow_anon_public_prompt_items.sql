drop policy if exists "prompt_items_select_visible" on public.prompt_items;

create policy "prompt_items_select_visible"
  on public.prompt_items
  for select
  to anon, authenticated
  using (
    display = 'public'
    or (auth.uid() is not null and user_id = auth.uid())
  );
