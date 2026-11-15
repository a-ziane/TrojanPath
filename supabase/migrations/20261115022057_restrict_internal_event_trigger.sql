-- Event triggers are invoked by Postgres, never by browser RPC callers.
-- New Supabase projects may include this helper in the public schema.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end $$;
