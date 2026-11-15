-- Completion rewards follow the current checkmark, not lifetime toggles.
create or replace function private.award_xp() returns trigger language plpgsql security definer set search_path='' as $$
declare k text; points integer; complete boolean;
begin
 if auth.uid() is null or auth.uid()<>new.user_id then raise exception 'Owner required';end if;
 if tg_table_name='tasks' then
  k:='task:'||new.id;points:=new.xp;complete:=new.status='completed';
 elsif tg_table_name='projects' then
  k:='project:'||new.id;points:=100;complete:=coalesce((new.data->>'completed')::boolean,false);
 else return new;end if;
 if complete then
  insert into public.xp_events(user_id,event_key,amount) values(new.user_id,k,points) on conflict(user_id,event_key) do nothing;
 else
  delete from public.xp_events where user_id=new.user_id and event_key=k;
 end if;
 return new;
end $$;
