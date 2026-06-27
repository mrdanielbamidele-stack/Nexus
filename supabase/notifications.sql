-- =====================================================================
-- Topfaith Nexus - Notification system
-- Run this whole file once in the Supabase SQL editor.
--
-- It creates:
--   1. public.notifications      - one row per "new material" event (course-scoped)
--   2. public.push_subscriptions - one row per device that opted into web push
--   3. Triggers that insert a notification whenever a material/library resource
--      becomes visible to students.
--
-- Students are NOT in the database (they are localStorage-only), so everything
-- here is course-scoped, not per-student. The frontend filters by the courses
-- in the student's localStorage list.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  course_id   text not null references public.courses(code) on delete cascade,
  kind        text not null default 'material'
              check (kind in ('material', 'library')),
  title       text not null,                 -- e.g. "New module in PHY 101"
  body        text not null,                 -- e.g. "Module 1 Part 1 was just added"
  material_id uuid,                           -- source row id (nullable)
  created_at  timestamptz not null default now()
);

create index if not exists notifications_course_idx
  on public.notifications (course_id, created_at desc);

create index if not exists notifications_created_idx
  on public.notifications (created_at desc);

alter table public.notifications enable row level security;

-- Students are anonymous, so everyone can read. (No sensitive data - just
-- "a file was added to course X".)
drop policy if exists "Notifications: public can read" on public.notifications;
create policy "Notifications: public can read"
  on public.notifications for select
  using (true);

-- Only the triggers (which run as the table owner / definer) insert rows.
-- No client insert/update/delete policy => clients cannot write directly.

-- Let Realtime broadcast inserts to subscribed clients.
alter publication supabase_realtime add table public.notifications;


-- ---------------------------------------------------------------------
-- 2. push_subscriptions
-- ---------------------------------------------------------------------
-- One row per browser/device that granted notification permission. Because
-- there is no student identity, we key by the push endpoint (globally unique)
-- and store the course codes that device wants alerts for.
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  endpoint     text not null unique,
  p256dh       text not null,                 -- subscription keys.p256dh
  auth         text not null,                 -- subscription keys.auth
  course_codes text[] not null default '{}',  -- normalized codes, e.g. {phy101,cos101}
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists push_subscriptions_codes_idx
  on public.push_subscriptions using gin (course_codes);

alter table public.push_subscriptions enable row level security;

-- The table is fully PRIVATE: no client-facing policies. With RLS enabled and
-- no policies, direct REST access (select/insert/update/delete) is denied for
-- anon/authenticated. Clients touch it only through the SECURITY DEFINER
-- functions below (which run as the owner and bypass RLS), and the Edge
-- Function reads it with the service-role key. This keeps device endpoints and
-- push keys unreadable by students.
--
-- NOTE: we cannot use a plain client `upsert` here even with permissive
-- policies, because `INSERT ... ON CONFLICT DO UPDATE` requires a SELECT policy
-- (Postgres must read the conflicting row) - which we don't want to grant.
-- Hence the function indirection.

-- Register / refresh a device's subscription.
create or replace function public.register_push_subscription(
  p_endpoint     text,
  p_p256dh       text,
  p_auth         text,
  p_course_codes text[],
  p_user_agent   text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.push_subscriptions
    (endpoint, p256dh, auth, course_codes, user_agent, updated_at)
  values
    (p_endpoint, p_p256dh, p_auth, coalesce(p_course_codes, '{}'), p_user_agent, now())
  on conflict (endpoint) do update
    set p256dh       = excluded.p256dh,
        auth         = excluded.auth,
        course_codes = excluded.course_codes,
        user_agent   = excluded.user_agent,
        updated_at   = now();
end;
$$;

-- Remove a device's subscription.
create or replace function public.unregister_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

grant execute on function public.register_push_subscription(text,text,text,text[],text)
  to anon, authenticated;
grant execute on function public.unregister_push_subscription(text)
  to anon, authenticated;


-- ---------------------------------------------------------------------
-- 3. Triggers - create a notification when students gain access to a file
-- ---------------------------------------------------------------------

-- (a) Course materials become visible only when is_published flips to true.
--     Materials are inserted unpublished, then published via publish_material().
create or replace function public.notify_on_material_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_label text;
begin
  -- Only fire on the transition into "published".
  if new.is_published is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.is_published is true then
    return new;   -- already published; an edit, not a new release
  end if;

  select coalesce(c.title, new.course_id) into course_label
  from public.courses c where c.code = new.course_id;

  insert into public.notifications (course_id, kind, title, body, material_id)
  values (
    new.course_id,
    'material',
    'New material in ' || new.course_id,
    coalesce(nullif(new.module_numbering, ''), new.file_name)
      || ' was added to ' || coalesce(course_label, new.course_id),
    new.id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_material_insert on public.course_materials;
create trigger trg_notify_material_insert
  after insert on public.course_materials
  for each row execute function public.notify_on_material_published();

drop trigger if exists trg_notify_material_publish on public.course_materials;
create trigger trg_notify_material_publish
  after update of is_published on public.course_materials
  for each row execute function public.notify_on_material_published();


-- (b) Library resources are visible to students the moment they are inserted.
create or replace function public.notify_on_library_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_label text;
begin
  select coalesce(c.title, new.course_id) into course_label
  from public.courses c where c.code = new.course_id;

  insert into public.notifications (course_id, kind, title, body, material_id)
  values (
    new.course_id,
    'library',
    'Library resource for ' || new.course_id,
    coalesce(new.title, new.file_name)
      || ' was added to ' || coalesce(course_label, new.course_id),
    new.id
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_library_insert on public.library_resources;
create trigger trg_notify_library_insert
  after insert on public.library_resources
  for each row execute function public.notify_on_library_insert();
