-- Chef with the Lens Studio: booking requests from the website form.
-- Visitors (anon) may only ADD a booking. Only the studio owner's signed-in email can read or update them.
-- Owner email is set in public.is_studio_owner() below (one place).

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text not null default 'new' check (status in ('new','contacted','booked','done','declined')),
  name           text not null check (char_length(name) between 1 and 120),
  email          text not null check (char_length(email) between 3 and 200),
  session_type   text check (char_length(session_type) <= 60),
  preferred_date date,
  preferred_time text check (char_length(preferred_time) <= 40),
  location       text check (char_length(location) <= 200),
  brief          text check (char_length(brief) <= 1000),
  subject        text check (char_length(subject) <= 200),
  moods          text[] not null default '{}' check (cardinality(moods) <= 12),
  reference_links text[] not null default '{}' check (cardinality(reference_links) <= 10),
  reference_files text[] not null default '{}' check (cardinality(reference_files) <= 5),
  budget         text check (char_length(budget) <= 40),
  message        text check (char_length(message) <= 2000)
);

-- Who counts as the studio owner (edit this one line).
create or replace function public.is_studio_owner() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('chefwithdalens@gmail.com'), false)
$$;

alter table public.bookings enable row level security;

drop policy if exists "bookings_insert_public" on public.bookings;
create policy "bookings_insert_public" on public.bookings
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "bookings_select_owner" on public.bookings;
create policy "bookings_select_owner" on public.bookings
  for select to authenticated using (public.is_studio_owner());

drop policy if exists "bookings_update_owner" on public.bookings;
create policy "bookings_update_owner" on public.bookings
  for update to authenticated using (public.is_studio_owner()) with check (public.is_studio_owner());

-- Table privileges: anon can only insert; signed-in users go through the policies above.
revoke all on public.bookings from anon, authenticated;
grant insert on public.bookings to anon, authenticated;
grant select, update (status) on public.bookings to authenticated;

-- ---------- Photo references: private Storage bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-refs', 'booking-refs', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Visitors can upload (but not list, read, overwrite or delete). Only the owner can read.
drop policy if exists "booking_refs_upload_public" on storage.objects;
create policy "booking_refs_upload_public" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'booking-refs');

drop policy if exists "booking_refs_read_owner" on storage.objects;
create policy "booking_refs_read_owner" on storage.objects
  for select to authenticated using (bucket_id = 'booking-refs' and public.is_studio_owner());

notify pgrst, 'reload schema';
