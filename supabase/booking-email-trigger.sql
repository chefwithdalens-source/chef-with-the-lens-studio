-- Emails the studio owner whenever a booking is added (run AFTER bookings.sql, and after deploying
-- the booking-email Edge Function). Uses pg_net so the website can't trigger or abuse the email.
--
-- BEFORE RUNNING: pick a long random secret and use the SAME value in two places:
--   1) below, in vault.create_secret(...)   2) Edge Function secret BOOKING_WEBHOOK_SECRET
-- (Never commit the real value; this file only has a placeholder.)

create extension if not exists pg_net;

-- Track that the owner was emailed (the function sets it; prevents duplicate emails).
alter table public.bookings add column if not exists notified_at timestamptz;

-- Store the shared secret in Vault (run once; replace the placeholder). To change it later:
--   select vault.update_secret((select id from vault.secrets where name = 'booking_webhook_secret'), 'NEW_VALUE');
select vault.create_secret('REPLACE_WITH_LONG_RANDOM_SECRET', 'booking_webhook_secret', 'Shared secret for the booking-email function')
where not exists (select 1 from vault.secrets where name = 'booking_webhook_secret');

-- Visitors can't pre-set notified_at to suppress the email.
create or replace function public.bookings_clear_notified()
returns trigger language plpgsql as $$ begin new.notified_at := null; return new; end; $$;
drop trigger if exists bookings_clear_notified on public.bookings;
create trigger bookings_clear_notified before insert on public.bookings
  for each row execute function public.bookings_clear_notified();

create or replace function public.notify_booking_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s text;
begin
  select decrypted_secret into s from vault.decrypted_secrets where name = 'booking_webhook_secret' limit 1;
  perform net.http_post(
    url     := 'https://xzxfdeugzmeubukdblmo.supabase.co/functions/v1/booking-email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(s, '')),
    body    := jsonb_build_object('type', 'INSERT', 'table', 'bookings', 'record', jsonb_build_object('id', new.id)),
    timeout_milliseconds := 10000
  );
  return new;
end;
$$;

revoke all on function public.notify_booking_email() from public, anon, authenticated;

drop trigger if exists bookings_email_owner on public.bookings;
create trigger bookings_email_owner
  after insert on public.bookings
  for each row execute function public.notify_booking_email();

-- Troubleshooting: recent calls and their responses
--   select id, status_code, content, created from net._http_response order by created desc limit 10;
