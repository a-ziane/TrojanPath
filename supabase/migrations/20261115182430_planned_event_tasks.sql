create table public.campus_event_catalog(id text primary key,title text not null,url text not null check(url like 'https://calendar.usc.edu/%'),starts_at timestamptz,ends_at timestamptz,updated_at timestamptz not null default now(),check(ends_at is null or starts_at is null or ends_at>=starts_at));
alter table public.campus_event_catalog enable row level security;
revoke all on public.campus_event_catalog from anon,authenticated;
grant all on public.campus_event_catalog to service_role;
create unique index task_campus_event_once on public.tasks(user_id,(data->>'eventId')) where data->>'eventId' is not null;
create function private.plan_campus_event(event_id text,going boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.campus_event_catalog; p jsonb; pid uuid; tid uuid; old_status text; minutes integer; w date;
begin
 if u is null then raise exception 'Authentication required';end if;
 if going is null then raise exception 'Choose whether you are going';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into e from public.campus_event_catalog where id=event_id;if not found then raise exception 'Verified event not found';end if;
 select data into p from public.profiles where user_id=u;if p is null then raise exception 'Save your profile first';end if;
 select id,status into tid,old_status from public.tasks where user_id=u and data->>'eventId'=event_id for update;
 if not going and old_status='completed' then raise exception 'Uncheck the completed event task before removing it';end if;
 if not going then
  delete from public.tasks where user_id=u and id=tid;
 else
  if tid is null then
   w:=date_trunc('week',timezone(p->>'timezone',now()))::date;
   select id into pid from public.weekly_plans where user_id=u and week>=w order by week desc limit 1;
   if pid is null then
    pid:=gen_random_uuid();insert into public.weekly_plans(id,user_id,week,source,data) values(pid,u,w,'fallback','{"direction":"Your selected campus events, alongside your weekly activities.","change":"Events selected by you; no AI generation was requested.","milestones":["Explore an event","Participate and reflect","Choose a next step"]}');
   end if;
   minutes:=greatest(5,least(240,coalesce(ceil(extract(epoch from(e.ends_at-e.starts_at))/60)::integer,60)));
   tid:=gen_random_uuid();
   insert into public.tasks(id,user_id,plan_id,data) values(tid,u,pid,jsonb_build_object('title',left('Attend '||e.title,160),'instructions','Attend the selected USC event. Verify registration and schedule on the official page. This student-selected event is additional to the generated plan.','why','You chose to attend this event.','criteria','After the official end time, confirm participation and save a reflection.','minutes',minutes,'category','networking','resourceIds','[]'::jsonb,'eventId',event_id,'eventStartsAt',e.starts_at,'eventEndsAt',e.ends_at,'eventURL',e.url));
  else
   update public.tasks set data=data||jsonb_build_object('eventStartsAt',e.starts_at,'eventEndsAt',e.ends_at) where id=tid and user_id=u;
  end if;
 end if;
 update public.profiles set data=jsonb_set(data,'{campusEvents}',coalesce(data->'campusEvents','{}'::jsonb)||jsonb_build_object(event_id,jsonb_build_object('title',e.title,'url',e.url,'startsOn',e.starts_at,'endsOn',e.ends_at,'going',going,'attended',coalesce(old_status='completed',false),'note',coalesce(data->'campusEvents'->event_id->>'note','')))) where user_id=u;
 return tid;
end $$;
revoke all on function private.plan_campus_event(text,boolean) from public,anon;
grant execute on function private.plan_campus_event(text,boolean) to authenticated;
create function public.plan_campus_event(event_id text,going boolean) returns uuid language sql security invoker set search_path='' as $$select private.plan_campus_event(event_id,going);$$;
revoke all on function public.plan_campus_event(text,boolean) from public,anon;
grant execute on function public.plan_campus_event(text,boolean) to authenticated;
create function private.guard_event_completion() returns trigger language plpgsql security definer set search_path='' as $$
declare ending timestamptz;
begin
 if new.data->>'eventId' is not null and new.status='completed' then
  select ends_at into ending from public.campus_event_catalog where id=new.data->>'eventId';
  if ending is null or now()<ending then raise exception 'This event can only be completed after its official end time';end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_event_completion() from public,anon,authenticated;
create trigger guard_event_completion before update of status on public.tasks for each row execute function private.guard_event_completion();
create function private.sync_event_completion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.data->>'eventId' is not null then
  if auth.uid() is null or auth.uid()<>new.user_id then raise exception 'Owner required';end if;
  update public.profiles set data=jsonb_set(data,'{campusEvents}',coalesce(data->'campusEvents','{}'::jsonb)||jsonb_build_object(new.data->>'eventId',coalesce(data->'campusEvents'->(new.data->>'eventId'),'{}'::jsonb)||jsonb_build_object('attended',new.status='completed','note',left(new.reflection,1500)))) where user_id=new.user_id;
 end if;
 return new;
end $$;
revoke all on function private.sync_event_completion() from public,anon,authenticated;
create trigger sync_event_completion after update of status,reflection on public.tasks for each row execute function private.sync_event_completion();

-- Only an authenticated owner may atomically upgrade an untouched starter plan.
create or replace function private.upgrade_starter(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); old_id uuid; old_source text;
begin
 if u is null then raise exception 'Authentication required'; end if;
 if payload->>'source' is distinct from 'gemini' then raise exception 'AI plan required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select id, source into old_id,old_source from public.weekly_plans where user_id=u and week=(payload->>'week')::date for update;
 if old_id is null then return private.store_plan(payload); end if;
 if old_source <> 'fallback' then return old_id; end if;
 if exists(select 1 from public.tasks where plan_id=old_id and data->>'eventId' is not null) then raise exception 'Remove your selected event tasks before regenerating this starter plan';end if;
 perform 1 from public.tasks where plan_id=old_id and user_id=u for update;
 if exists(select 1 from public.tasks where plan_id=old_id and (status<>'suggested' or coalesce(reflection,'')<>'')) then
  raise exception 'Your plan has activity. Keep this week and generate an AI plan next week.';
 end if;
 delete from public.pathways where user_id=u and data->>'plan_id'=old_id::text;
 delete from public.weekly_plans where id=old_id and user_id=u;
 return private.store_plan(payload);
end $$;
