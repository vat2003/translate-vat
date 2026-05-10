revoke execute on function public.increment_prompt_item_usage(uuid) from public, anon;
grant execute on function public.increment_prompt_item_usage(uuid) to authenticated;

revoke execute on function public.set_prompt_items_updated_at() from public, anon, authenticated;
revoke execute on function public.set_feedback_items_updated_at() from public, anon, authenticated;

alter default privileges in schema public revoke execute on functions from public;
