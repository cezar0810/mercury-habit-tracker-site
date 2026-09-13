-- Shared wire protocol v1. No service role key is used by either client.
create table public.mercury_documents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{}' check (jsonb_typeof(document) = 'object'),
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table public.mercury_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  sequence bigint not null default 0,
  primary key (user_id, device_id)
);
create table public.mercury_annual (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 1900 and 9999),
  habits numeric not null default 0,
  water_ml numeric not null default 0,
  focus_minutes numeric not null default 0,
  steps numeric not null default 0,
  workout_kcal numeric not null default 0,
  workouts numeric not null default 0,
  primary key (user_id, year)
);
alter table public.mercury_documents enable row level security;
alter table public.mercury_devices enable row level security;
alter table public.mercury_annual enable row level security;
create policy owner on public.mercury_documents for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner on public.mercury_devices for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner on public.mercury_annual for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.mercury_documents, public.mercury_devices, public.mercury_annual from anon;
grant select, insert, update on public.mercury_documents, public.mercury_devices, public.mercury_annual to authenticated;

create function public.mercury_apply(p_device uuid, p_sequence bigint, p_operations jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid(); doc jsonb; rev bigint; seq bigint;
  op jsonb; k text; path jsonb; old_value jsonb; new_value jsonb;
  metric text; yr integer; delta numeric; previous numeric; current_value numeric;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_sequence < 1 or jsonb_typeof(p_operations) <> 'array' or jsonb_array_length(p_operations) > 20000 then raise exception 'Invalid request'; end if;
  insert into public.mercury_documents(user_id) values(uid) on conflict do nothing;
  -- Serializes all writers for this account, including concurrent devices.
  select document, revision into doc, rev from public.mercury_documents where user_id = uid for update;
  insert into public.mercury_devices(user_id, device_id) values(uid,p_device) on conflict do nothing;
  select sequence into seq from public.mercury_devices where user_id=uid and device_id=p_device;
  if p_sequence <= seq then return jsonb_build_object('document',doc,'revision',rev); end if;
  if p_sequence <> seq + 1 then raise exception 'Sequence gap'; end if;
  for op in select value from jsonb_array_elements(p_operations) loop
    k := op->>'key'; path := k::jsonb;
    if jsonb_typeof(path) <> 'array' or jsonb_array_length(path) < 1 or length(k)>2048 then raise exception 'Invalid path'; end if;
    old_value := doc->k;
    case op->>'mode'
      when 'remove' then new_value := null;
      when 'set' then new_value := op->'value';
      when 'increment' then new_value := to_jsonb(greatest(0, coalesce((old_value #>> '{}')::numeric,0) + (op->>'value')::numeric));
      when 'max' then new_value := to_jsonb(greatest(coalesce((old_value #>> '{}')::numeric,0), (op->>'value')::numeric));
      else raise exception 'Invalid operation';
    end case;
    if new_value is null then doc := doc-k; else doc := jsonb_set(doc,array[k],new_value); end if;
    -- O(number of changed fields), one accumulator row per user/year.
    metric := null;
    if path->>1 ~ '^\d{4}-\d{2}-\d{2}$' then
      yr := left(path->>1,4)::integer;
      case path->>0
        when 'focusMinutesByDay' then metric := 'focus_minutes';
        when 'stepsByDay' then metric := 'steps';
        when 'workoutCaloriesByDay' then metric := 'workout_kcal';
        when 'workoutCaloriesByCompletion' then metric := 'workout_kcal';
        when 'waterEntriesByDay' then if path->>-1 = 'amountMl' then metric := 'water_ml'; end if;
        when 'completions' then metric := 'habits';
        when 'workoutDone' then metric := 'workouts';
        else null;
      end case;
      if metric is not null then
        if metric in ('habits','workouts') then
          previous := case when old_value = 'true'::jsonb then 1 else 0 end;
          current_value := case when new_value = 'true'::jsonb then 1 else 0 end;
        else
          previous := coalesce((old_value #>> '{}')::numeric,0);
          current_value := coalesce((new_value #>> '{}')::numeric,0);
        end if;
        delta := current_value-previous;
        insert into public.mercury_annual(user_id,year) values(uid,yr) on conflict do nothing;
        execute format('update public.mercury_annual set %I = %I + $1 where user_id=$2 and year=$3',metric,metric) using delta,uid,yr;
      end if;
    end if;
  end loop;
  update public.mercury_documents set document=doc,revision=rev+1,updated_at=now() where user_id=uid;
  update public.mercury_devices set sequence=p_sequence where user_id=uid and device_id=p_device;
  return jsonb_build_object('document',doc,'revision',rev+1);
end $$;
revoke all on function public.mercury_apply(uuid,bigint,jsonb) from public, anon;
grant execute on function public.mercury_apply(uuid,bigint,jsonb) to authenticated;
do $$ begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.mercury_documents;
  end if;
end $$;
