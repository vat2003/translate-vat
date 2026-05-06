drop policy if exists "user_favorites_update_own" on public.user_favorites;

create policy "user_favorites_update_own"
  on public.user_favorites
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
