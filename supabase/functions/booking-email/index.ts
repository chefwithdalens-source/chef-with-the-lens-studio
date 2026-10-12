// Supabase Edge Function: booking-email
// Called by a Postgres trigger (pg_net) after each INSERT on public.bookings.
// It re-reads the booking with the service role (the payload is never trusted), signs reference
// photo URLs for 7 days, emails the owner via Resend (reply-to = client), and marks the row as notified.
//
// Secrets (Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
//   RESEND_API_KEY          send-only Resend key for the studio account
//   BOOKING_WEBHOOK_SECRET  shared secret; must match the value in Vault (see booking-email-trigger.sql)
// Provided automatically by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { renderBookingEmail, renderText, subjectFor, STUDIO } from "./render.mjs";

const FROM = "Chef with the Lens Studio <onboarding@resend.dev>"; // until a domain is verified in Resend
const OWNER = "chefwithdalens@gmail.com";
const SIGN_SECONDS = 7 * 24 * 60 * 60;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const secret = Deno.env.get("BOOKING_WEBHOOK_SECRET");
  if (secret && !timingSafeEqual(req.headers.get("x-webhook-secret") ?? "", secret)) return json(401, { error: "bad secret" });

  let payload: any;
  try { payload = await req.json(); } catch { return json(400, { error: "invalid JSON" }); }
  const id = payload?.record?.id ?? payload?.id;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return json(400, { error: "missing booking id" });

  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json(500, { error: "RESEND_API_KEY not set" });
  const db = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  // Re-read the row; only email once.
  const r = await fetch(`${url}/rest/v1/bookings?id=eq.${id}&select=*`, { headers: db });
  if (!r.ok) return json(502, { error: "db read failed", status: r.status });
  const booking = (await r.json())[0];
  if (!booking) return json(404, { error: "booking not found" });
  if (booking.notified_at) return json(200, { skipped: "already notified" });

  // Sign reference photos (7 days).
  const photoUrls: string[] = [];
  for (const path of (booking.reference_files ?? []).slice(0, 5)) {
    const s = await fetch(`${url}/storage/v1/object/sign/booking-refs/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST", headers: db, body: JSON.stringify({ expiresIn: SIGN_SECONDS }),
    });
    if (s.ok) { const { signedURL } = await s.json(); if (signedURL) photoUrls.push(`${url}/storage/v1${signedURL}`); }
  }

  const replyTo = /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]+$/.test(booking.email ?? "") ? booking.email : undefined;
  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json", "Idempotency-Key": `booking-${id}` },
    body: JSON.stringify({
      from: FROM, to: [OWNER], reply_to: replyTo, subject: subjectFor(booking),
      html: renderBookingEmail(booking, photoUrls), text: renderText(booking, photoUrls),
      tags: [{ name: "type", value: "booking_request" }],
    }),
  });
  const out = await send.json().catch(() => ({}));
  if (!send.ok) return json(502, { error: "resend failed", status: send.status, detail: out?.message });

  await fetch(`${url}/rest/v1/bookings?id=eq.${id}`, {
    method: "PATCH", headers: { ...db, Prefer: "return=minimal" }, body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });
  return json(200, { sent: true, email_id: out?.id, studio: STUDIO.name });
});
