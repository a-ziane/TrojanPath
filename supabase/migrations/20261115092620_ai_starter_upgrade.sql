-- Only an authenticated owner may atomically upgrade an untouched starter plan.
create function private.upgrade_starter(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); old_id uuid; old_source text;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if payload->>'source' is distinct from 'gemini' then raise exception 'AI plan required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select id, source into old_id,old_source from public.weekly_plans where user_id=u and week=(payload->>'week')::date for update;
 if old_id is null then return private.store_plan(payload); end if;
 if old_source <> 'fallback' then return old_id; end if;
 perform 1 from public.tasks where plan_id=old_id and user_id=u for update;
 if exists(select 1 from public.tasks where plan_id=old_id and (status<>'suggested' or coalesce(reflection,'')<>'')) then
  raise exception 'Your plan has activity. Keep this week and generate an AI plan next week.';
 end if;
 delete from public.pathways where user_id=u and data->>'plan_id'=old_id::text;
 delete from public.weekly_plans where id=old_id and user_id=u;
 return private.store_plan(payload);
end $$;
revoke all on function private.upgrade_starter(jsonb) from public,anon;
grant execute on function private.upgrade_starter(jsonb) to authenticated;
create function public.upgrade_starter_plan(payload jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.upgrade_starter(payload); $$;
revoke all on function public.upgrade_starter_plan(jsonb) from public,anon;
grant execute on function public.upgrade_starter_plan(jsonb) to authenticated;
