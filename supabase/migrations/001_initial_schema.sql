-- =============================================
-- Insitus — Initial Schema
-- =============================================

-- VENUES
create table if not exists venues (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text,
  lat            float8 not null,
  lng            float8 not null,
  radius_meters  int default 100,
  open_days      text[],
  open_time      time,
  close_time     time,
  logo_url       text,
  created_at     timestamptz default now()
);

-- PROFILES
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text,
  age               int,
  bio               text,
  instagram_handle  text,
  avatar_url        text,
  push_subscription jsonb,
  created_at        timestamptz default now()
);

-- PRESENCES
create table if not exists presences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  venue_id    uuid references venues(id) on delete cascade,
  entered_at  timestamptz default now(),
  expires_at  timestamptz,
  is_active   boolean default true,
  unique(user_id, venue_id)
);

-- LIKES
create table if not exists likes (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid references profiles(id) on delete cascade,
  to_user     uuid references profiles(id) on delete cascade,
  venue_id    uuid references venues(id),
  created_at  timestamptz default now(),
  unique(from_user, to_user, venue_id)
);

-- MATCHES
create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid references profiles(id) on delete cascade,
  user_b      uuid references profiles(id) on delete cascade,
  venue_id    uuid references venues(id),
  created_at  timestamptz default now(),
  expires_at  timestamptz,
  is_active   boolean default true
);

-- MESSAGES
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid references matches(id) on delete cascade,
  sender_id   uuid references profiles(id) on delete cascade,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table venues    enable row level security;
alter table profiles  enable row level security;
alter table presences enable row level security;
alter table likes     enable row level security;
alter table matches   enable row level security;
alter table messages  enable row level security;

-- VENUES: public read
create policy "venues_read" on venues for select using (true);

-- PROFILES: users read any profile; update only own
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- PRESENCES: only see presences of your active venue
create policy "presences_read" on presences for select
  using (
    venue_id in (
      select venue_id from presences where user_id = auth.uid() and is_active = true
    )
  );
create policy "presences_insert" on presences for insert with check (auth.uid() = user_id);
create policy "presences_update" on presences for update using (auth.uid() = user_id);

-- LIKES: only see your own
create policy "likes_read"   on likes for select using (auth.uid() = from_user or auth.uid() = to_user);
create policy "likes_insert" on likes for insert with check (auth.uid() = from_user);

-- MATCHES: only participants
create policy "matches_read" on matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- MESSAGES: only match participants
create policy "messages_read" on messages for select
  using (
    match_id in (
      select id from matches where user_a = auth.uid() or user_b = auth.uid()
    )
  );
create policy "messages_insert" on messages for insert
  with check (
    auth.uid() = sender_id and
    match_id in (
      select id from matches where (user_a = auth.uid() or user_b = auth.uid()) and is_active = true
    )
  );

-- =============================================
-- TRIGGER: auto-create match on mutual like
-- =============================================

create or replace function handle_new_like()
returns trigger language plpgsql security definer as $$
declare
  v_match_id  uuid;
  v_expires   timestamptz;
begin
  -- Check if reverse like exists
  if exists (
    select 1 from likes
    where from_user = new.to_user
      and to_user   = new.from_user
      and venue_id  = new.venue_id
  ) then
    -- Get venue close time for today
    select (current_date + close_time)::timestamptz
    into v_expires
    from venues where id = new.venue_id;

    -- Insert match (avoid duplicates)
    insert into matches (user_a, user_b, venue_id, expires_at, is_active)
    values (new.from_user, new.to_user, new.venue_id, v_expires, true)
    on conflict do nothing
    returning id into v_match_id;
  end if;
  return new;
end;
$$;

create trigger on_like_inserted
  after insert on likes
  for each row execute procedure handle_new_like();

-- =============================================
-- TRIGGER: auto-create profile on new user
-- =============================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================
-- REALTIME
-- =============================================

alter publication supabase_realtime add table presences;
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table messages;
