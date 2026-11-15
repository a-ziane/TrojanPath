-- TrojanPath: private ownership, server-derived XP, atomic weekly plans.
create schema if not exists private;
revoke all on schema private from public;
create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null, updated_at timestamptz not null default now());
create table public.projects(id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, data jsonb not null, created_at timestamptz not null default now());
create table public.experiences(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,data jsonb not null);
create table public.pathways(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,data jsonb not null);
create table public.weekly_plans(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,week date not null,data jsonb not null,source text not null check(source in ('gemini','fallback')),created_at timestamptz not null default now(),unique(user_id,week),unique(id,user_id));
create table public.tasks(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,plan_id uuid not null,data jsonb not null,status text not null default 'suggested' check(status in ('suggested','in progress','completed','skipped')),reflection text not null default '' check(length(reflection)<=4000),xp integer generated always as (greatest(10,ceil((data->>'minutes')::numeric/15)::integer*10)) stored,foreign key(plan_id,user_id) references public.weekly_plans(id,user_id) on delete cascade);
create table public.check_ins(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,week date not null,data jsonb not null,created_at timestamptz not null default now(),unique(user_id,week));
create table public.xp_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,event_key text not null,amount integer not null check(amount between 1 and 1000),created_at timestamptz not null default now(),unique(user_id,event_key));
create table public.resources(id text primary key,title text not null,category text not null,description text not null,url text not null check(url like 'https://%'),verified boolean not null default false);
create table public.opportunities(id text primary key,data jsonb not null,is_sample boolean not null default true);
create table private.planning_requests(user_id uuid not null references auth.users(id) on delete cascade,requested_at timestamptz not null default now());
create index planning_requests_owner on private.planning_requests(user_id,requested_at);
create index projects_owner on public.projects(user_id);
create index tasks_owner_plan on public.tasks(user_id,plan_id);
create index experiences_owner on public.experiences(user_id);
create index pathways_owner on public.pathways(user_id);
create index xp_owner_time on public.xp_events(user_id,created_at);
-- Every exposed private record has explicit ownership checks, including updates.
do $$ declare t text; begin
 foreach t in array array['profiles','projects','experiences','pathways','weekly_plans','tasks','check_ins'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_access on public.%I to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 end loop;
end $$;
alter table public.xp_events enable row level security;
create policy read_own_xp on public.xp_events for select to authenticated using ((select auth.uid())=user_id);
alter table public.resources enable row level security;
alter table public.opportunities enable row level security;
create policy read_resources on public.resources for select to authenticated using(true);
create policy read_opportunities on public.opportunities for select to authenticated using(true);
revoke all on public.profiles,public.projects,public.experiences,public.pathways,public.weekly_plans,public.tasks,public.check_ins,public.xp_events,public.resources,public.opportunities from anon,authenticated;
grant select,insert,update on public.profiles,public.projects,public.experiences,public.check_ins to authenticated;
grant select on public.pathways,public.weekly_plans,public.tasks,public.xp_events,public.resources,public.opportunities to authenticated;
grant update(status,reflection) on public.tasks to authenticated;
-- Validate browser-writable input at the database boundary too.
create function private.validate_record() returns trigger language plpgsql set search_path='' as $$
begin
 if octet_length(new.data::text)>40000 then raise exception 'Record too large'; end if;
 if tg_table_name='profiles' then
  if coalesce(new.data->>'name','')='' or length(new.data->>'name')>100 or coalesce(new.data->>'major','')='' or coalesce(new.data->>'email','') !~* '^[^@]+@([a-z0-9-]+\.)?usc\.edu$' or coalesce((new.data->>'hours')::numeric,0) not between 0.25 and 30 or coalesce(new.data->>'degree','') not in ('Undergraduate','Master’s','PhD') or not exists(select 1 from pg_catalog.pg_timezone_names where name=new.data->>'timezone') then raise exception 'Invalid profile'; end if;
 elsif tg_table_name='projects' then
  if length(coalesce(new.data->>'title','')) not between 2 and 150 or length(coalesce(new.data->>'description','')) not between 5 and 3000 or coalesce(new.data->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(new.data->>'url','') !~ '^(https://|$)' then raise exception 'Invalid project'; end if;
  if new.data->>'id'<>new.id::text then raise exception 'Project id mismatch'; end if;
  if coalesce(new.data->>'attachment','')<>'' and new.data->>'attachment' not like new.user_id::text||'/%' then raise exception 'Invalid attachment owner'; end if;
 elsif tg_table_name='check_ins' then
  if coalesce(new.data->>'workload','') not in ('manageable','too busy','ready for more') or extract(isodow from new.week)<>1 then raise exception 'Invalid check-in';end if;
  if new.week<>(date_trunc('week',timezone(coalesce((select data->>'timezone' from public.profiles where user_id=new.user_id),'America/Los_Angeles'),now())))::date then raise exception 'Check-ins must be for the current local week';end if;
 end if;
 return new;
end $$;
create trigger validate_profile before insert or update on public.profiles for each row execute function private.validate_record();
create trigger validate_project before insert or update on public.projects for each row execute function private.validate_record();
create trigger validate_checkin before insert or update on public.check_ins for each row execute function private.validate_record();
-- Narrow elevated trigger: callers cannot write XP, choose amounts, or change owners.
create function private.award_xp() returns trigger language plpgsql security definer set search_path='' as $$
declare k text; points integer;
begin
 if auth.uid() is null or auth.uid()<>new.user_id then raise exception 'Owner required';end if;
 if tg_table_name='tasks' then
  if new.status<>'completed' then return new;end if;
  k:='task:'||new.id;points:=new.xp;
 elsif tg_table_name='projects' then
  if not coalesce((new.data->>'completed')::boolean,false) then return new;end if;
  k:='project:'||new.id;points:=100;
 else return new;end if;
 insert into public.xp_events(user_id,event_key,amount) values(new.user_id,k,points) on conflict(user_id,event_key) do nothing;
 return new;
end $$;
create trigger award_task after update of status on public.tasks for each row execute function private.award_xp();
create trigger award_project after insert or update on public.projects for each row execute function private.award_xp();
-- A single transaction saves pathway, plan, and tasks. Concurrent retries preserve the first plan.
create function private.store_plan(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();p jsonb;t jsonb;pid uuid;budget numeric;total numeric:=0;w date;current_week date;prev_busy boolean;
begin
 if u is null then raise exception 'Authentication required';end if;
 select data into p from public.profiles where user_id=u;if p is null then raise exception 'Save your profile first';end if;
 w:=(payload->>'week')::date;
 current_week:=date_trunc('week',timezone(p->>'timezone',now()))::date;
 if extract(isodow from w)<>1 or w<current_week or w>current_week+7 then raise exception 'Invalid planning week';end if;
 select id into pid from public.weekly_plans where user_id=u and week=w;if pid is not null then return pid;end if;
 if jsonb_array_length(payload->'tasks') not between 1 and 5 or jsonb_array_length(payload->'milestones') not between 3 and 5 or length(payload->>'direction') not between 10 and 1200 or coalesce(payload->>'source','') not in ('gemini','fallback') then raise exception 'Invalid plan';end if;
 select (data->>'workload'='too busy') into prev_busy from public.check_ins where user_id=u and week=w-7;
 budget:=(p->>'hours')::numeric*60*(case when coalesce(prev_busy,false) then 0.5 else 1 end);
 for t in select value from jsonb_array_elements(payload->'tasks') loop
  if coalesce((t->>'minutes')::integer,0) not between 5 and 240 or length(coalesce(t->>'title','')) not between 3 and 160 or length(coalesce(t->>'instructions','')) not between 10 and 1800 or coalesce(t->>'category','') not in ('skills','projects','research','networking','exploration') then raise exception 'Invalid task';end if;
  if exists(select 1 from public.tasks where user_id=u and status='completed' and lower(data->>'title')=lower(t->>'title')) then raise exception 'Completed task repeated';end if;
  if exists(select 1 from jsonb_array_elements_text(t->'resourceIds') r where not exists(select 1 from public.resources where id=r)) then raise exception 'Unknown resource';end if;
  total:=total+(t->>'minutes')::integer;
 end loop;
 if total>budget then raise exception 'Plan exceeds time budget';end if;
 pid:=(payload->>'id')::uuid;
 insert into public.weekly_plans(id,user_id,week,data,source) values(pid,u,w,payload-array['tasks','id','week','source','createdAt'],payload->>'source') on conflict(user_id,week) do nothing;
 if not found then return (select id from public.weekly_plans where user_id=u and week=w);end if;
 insert into public.pathways(user_id,data) values(u,jsonb_build_object('milestones',payload->'milestones','plan_id',pid));
 for t in select value from jsonb_array_elements(payload->'tasks') loop
 insert into public.tasks(id,user_id,plan_id,data) values((t->>'id')::uuid,u,pid,t-array['id','status','xp','reflection']);
 end loop;
 return pid;
end $$;
create function public.save_plan(payload jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.store_plan(payload); $$;
-- Rate limiter persists across Edge Function instances; no private inputs are stored.
create function private.limit_planning() returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();n integer;
begin
 if u is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 delete from private.planning_requests where user_id=u and requested_at<now()-interval '1 hour';
 select count(*) into n from private.planning_requests where user_id=u;
 if n>=10 then return false;end if;
 insert into private.planning_requests(user_id) values(u);return true;
end $$;
create function public.reserve_planning_request() returns boolean language sql security invoker set search_path='' as $$ select private.limit_planning(); $$;
-- Replacement can only decrease effort and never modifies completed tasks or their awards.
create function private.replace_quest(task_id uuid,spec jsonb) returns void language plpgsql security definer set search_path='' as $$
declare old public.tasks;u uuid:=auth.uid();
begin
 if u is null then raise exception 'Authentication required';end if;
 select * into old from public.tasks where id=task_id and user_id=u for update;
 if old.id is null or old.status='completed' then raise exception 'Suggestion not replaceable';end if;
 if (spec->>'minutes')::integer not between 5 and (old.data->>'minutes')::integer or length(spec->>'title') not between 3 and 160 or length(spec->>'instructions') not between 10 and 1800 then raise exception 'Invalid replacement';end if;
 delete from public.tasks where id=task_id and user_id=u;
 insert into public.tasks(id,user_id,plan_id,data) values(gen_random_uuid(),u,old.plan_id,spec-array['id','xp','status','reflection']);
end $$;
create function public.replace_quest(task_id uuid,spec jsonb) returns void language sql security invoker set search_path='' as $$select private.replace_quest(task_id,spec);$$;
-- Elevated aggregate deliberately exposes only opted-in display names and current-month XP.
create function private.leaderboard() returns table(display_name text,xp bigint) language sql security definer set search_path='' as $$
 select left(coalesce(nullif(p.data->>'displayName',''),'Trojan'),40),coalesce(sum(x.amount),0)::bigint from public.profiles p left join public.xp_events x on x.user_id=p.user_id and date_trunc('month',timezone(p.data->>'timezone',x.created_at))=date_trunc('month',timezone(p.data->>'timezone',now())) where auth.uid() is not null and coalesce((p.data->>'leaderboard')::boolean,false) group by p.user_id order by 2 desc limit 20;
$$;
create function public.monthly_leaderboard() returns table(display_name text,xp bigint) language sql security invoker set search_path='' as $$ select * from private.leaderboard(); $$;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.store_plan(jsonb),private.limit_planning(),private.replace_quest(uuid,jsonb),private.leaderboard() to authenticated;
revoke all on function public.save_plan(jsonb),public.reserve_planning_request(),public.replace_quest(uuid,jsonb),public.monthly_leaderboard() from public,anon;
grant execute on function public.save_plan(jsonb),public.reserve_planning_request(),public.replace_quest(uuid,jsonb),public.monthly_leaderboard() to authenticated;
-- Uploads go through a validating Edge Function; no direct browser INSERT privilege.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('student-files','student-files',false,2097152,array['application/pdf','image/png','image/jpeg','text/plain']);
create policy read_own_student_files on storage.objects for select to authenticated using(bucket_id='student-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy delete_own_student_files on storage.objects for delete to authenticated using(bucket_id='student-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
