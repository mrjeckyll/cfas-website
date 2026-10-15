-- =====================================================================
-- CFAS website: initial database schema
-- Run once in the Supabase SQL Editor (or with `supabase db push`).
--
-- Who can see what:
--   Public (anyone)     : published news, event titles/dates/general area
--   Members (approved)  : directory, exact session addresses, RSVPs,
--                         gear for sale, member systems
--   Admins              : everything, plus adding/editing events & posts
--                         and approving new members
-- =====================================================================

-- ---------- Members -------------------------------------------------
-- A member record can exist before the person creates a login
-- (user_id is null until they sign up), so admins can pre-load the roster.
create table public.profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique references auth.users(id) on delete set null,
  display_name      text not null,
  city              text,
  bio               text,
  role              text not null default 'member' check (role in ('member','admin')),
  status            text not null default 'pending' check (status in ('pending','active','inactive')),
  show_in_directory boolean not null default true,
  joined_on         date not null default current_date,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Helper functions used by the permission rules below.
-- SECURITY DEFINER so they can read profiles without tripping RLS recursion.
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where user_id = auth.uid() and status = 'active')
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where user_id = auth.uid() and status = 'active' and role = 'admin')
$$;

-- New sign-ups get a pending profile; an admin approves them.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Events --------------------------------------------------
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  event_type      text not null default 'Listening session'
                  check (event_type in ('Listening session','Dealer visit','Workshop','Social','Show / expo','Board meeting')),
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  public_location text,            -- shown to everyone, e.g. "Member home, Winter Park"
  description     text,
  capacity        int check (capacity is null or capacity > 0),
  host_id         uuid references public.profiles(id) on delete set null,
  created_by      uuid references public.profiles(id) on delete set null,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now()
);
create index events_starts_at_idx on public.events (starts_at);

-- Exact addresses live in a separate table so they're members-only.
create table public.event_private_details (
  event_id      uuid primary key references public.events(id) on delete cascade,
  address       text,
  parking_notes text,
  host_phone    text,
  is_demo       boolean not null default false
);

create table public.rsvps (
  event_id   uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'going' check (status in ('going','maybe','not_going')),
  guests     int not null default 0 check (guests between 0 and 3),
  is_demo    boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

-- ---------- News / blog --------------------------------------------
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  excerpt      text,
  body         text not null,        -- Markdown
  category     text not null default 'News'
               check (category in ('News','Session recap','Show report','Tech talk','Announcement')),
  author_id    uuid references public.profiles(id) on delete set null,
  is_published boolean not null default false,
  published_at timestamptz,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index posts_published_idx on public.posts (published_at desc) where is_published;

-- ---------- Gear for sale ------------------------------------------
create table public.listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  category    text not null check (category in
              ('Speakers','Amplification','Source','DAC','Turntable / analog','Cables','Accessories','Room treatment','Other')),
  brand       text,
  model       text,
  condition   text not null check (condition in ('New','Excellent','Very good','Good','Fair','For parts')),
  price_cents int not null check (price_cents >= 0),
  trade_ok    boolean not null default false,
  description text,
  status      text not null default 'available' check (status in ('available','pending','sold')),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index listings_status_idx on public.listings (status, created_at desc);

-- ---------- Member systems -----------------------------------------
create table public.systems (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  speakers      text,
  amplification text,
  source        text,
  dac           text,
  analog        text,
  room          text,
  notes         text,
  approved      boolean not null default false,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- Row-level security
-- =====================================================================
alter table public.profiles              enable row level security;
alter table public.events                enable row level security;
alter table public.event_private_details enable row level security;
alter table public.rsvps                 enable row level security;
alter table public.posts                 enable row level security;
alter table public.listings              enable row level security;
alter table public.systems               enable row level security;

-- Profiles: members see the directory; everyone sees their own; admins manage all.
create policy "members read directory" on public.profiles for select
  using (public.is_member() and status = 'active' and show_in_directory);
create policy "read own profile" on public.profiles for select
  using (user_id = auth.uid());
create policy "update own profile" on public.profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins manage profiles" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());
-- Members may edit only their own descriptive fields, never role, status or login link.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() and coalesce(auth.uid()::text, '') <> '' and (
       new.role    is distinct from old.role
    or new.status  is distinct from old.status
    or new.user_id is distinct from old.user_id
    or new.is_demo is distinct from old.is_demo) then
    raise exception 'Only an admin can change role, status, or account link';
  end if;
  return new;
end $$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Events: public read; admins write.
create policy "anyone reads events" on public.events for select using (true);
create policy "admins manage events" on public.events for all
  using (public.is_admin()) with check (public.is_admin());

create policy "members read addresses" on public.event_private_details for select
  using (public.is_member());
create policy "admins manage addresses" on public.event_private_details for all
  using (public.is_admin()) with check (public.is_admin());

-- RSVPs: members see who's going and manage their own.
create policy "members read rsvps" on public.rsvps for select using (public.is_member());
create policy "members rsvp" on public.rsvps for insert
  with check (public.is_member() and profile_id = public.current_profile_id());
create policy "members change own rsvp" on public.rsvps for update
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
create policy "members cancel own rsvp" on public.rsvps for delete
  using (profile_id = public.current_profile_id());
create policy "admins manage rsvps" on public.rsvps for all
  using (public.is_admin()) with check (public.is_admin());

-- Posts: public reads published; admins write.
create policy "anyone reads published posts" on public.posts for select using (is_published);
create policy "admins manage posts" on public.posts for all
  using (public.is_admin()) with check (public.is_admin());

-- Listings: members-only marketplace; sellers manage their own.
create policy "members read listings" on public.listings for select using (public.is_member());
create policy "members create listings" on public.listings for insert
  with check (public.is_member() and seller_id = public.current_profile_id());
create policy "sellers edit listings" on public.listings for update
  using (seller_id = public.current_profile_id())
  with check (seller_id = public.current_profile_id());
create policy "sellers delete listings" on public.listings for delete
  using (seller_id = public.current_profile_id());
create policy "admins manage listings" on public.listings for all
  using (public.is_admin()) with check (public.is_admin());

-- Systems: members see approved ones; owners see and edit their own; admins approve.
create policy "members read approved systems" on public.systems for select
  using (public.is_member() and approved);
create policy "owners read own systems" on public.systems for select
  using (owner_id = public.current_profile_id());
create policy "members submit systems" on public.systems for insert
  with check (public.is_member() and owner_id = public.current_profile_id() and not approved);
create policy "owners edit own systems" on public.systems for update
  using (owner_id = public.current_profile_id())
  with check (owner_id = public.current_profile_id() and not approved);
create policy "owners delete own systems" on public.systems for delete
  using (owner_id = public.current_profile_id());
create policy "admins manage systems" on public.systems for all
  using (public.is_admin()) with check (public.is_admin());

-- Public event list with RSVP counts (no names), safe for the public calendar.
create or replace view public.event_summary with (security_invoker = false) as
  select e.id, e.title, e.event_type, e.starts_at, e.ends_at, e.public_location,
         e.description, e.capacity,
         coalesce(sum(1 + r.guests) filter (where r.status = 'going'), 0)::int as going_count
  from public.events e
  left join public.rsvps r on r.event_id = e.id
  group by e.id;
grant select on public.event_summary to anon, authenticated;
