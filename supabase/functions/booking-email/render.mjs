// Fills the booking email template. Plain JS so it runs in Deno (Edge Function) and Node (local tests).
import { TEMPLATE } from "./template.mjs";

export const STUDIO = {
  name: "Chef with the Lens Studio",
  email: "chefwithdalens@gmail.com",
  website: "https://chefwithdalens-source.github.io/chef-with-the-lens-studio/",
  responseTime: "two business days",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\/[^\s"'<>]+$/i.test(u || "") ? u : null);
const dash = (v) => (v == null || String(v).trim() === "" ? "—" : v);

export function prettyDate(iso) {
  if (!iso) return "Flexible";
  const d = new Date(iso + "T12:00:00Z");
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function repeat(html, marker, items, fill) {
  const re = new RegExp(`<!-- repeat per ${marker} -->([\\s\\S]*?)<!-- /repeat -->`);
  return html.replace(re, (_, block) => items.map((it) => fill(block, it)).join(""));
}

/** booking: a bookings row. photoUrls: signed URLs for reference_files (same order). */
export function renderBookingEmail(booking, photoUrls = []) {
  const b = booking || {};
  let html = TEMPLATE;
  const moods = (b.moods || []).filter(Boolean).slice(0, 12);
  const links = (b.reference_links || []).map(safeUrl).filter(Boolean).slice(0, 10);
  const photos = photoUrls.map(safeUrl).filter(Boolean).slice(0, 5);
  html = moods.length
    ? repeat(html, "mood", moods, (blk, m) => blk.replaceAll("{{mood}}", esc(m)))
    : repeat(html, "mood", ["—"], () => '<span style="font-family:-apple-system,BlinkMacSystemFont,\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:15px;color:#1d1d1f;">—</span>');
  html = repeat(html, "photo \\(max 5\\)", photos, (blk, u) => blk.replaceAll("{{reference_photo_url}}", esc(u)).replaceAll("{{reference_photo_thumb_url}}", esc(u)));
  html = links.length
    ? repeat(html, "link", links, (blk, u) => blk.replaceAll("{{reference_link}}", esc(u)))
    : repeat(html, "link", ["—"], () => "—");
  const fields = {
    name: dash(b.name), email: dash(b.email), session_type: dash(b.session_type),
    preferred_date: prettyDate(b.preferred_date), preferred_time: b.preferred_time || "Flexible",
    location: dash(b.location), budget: b.budget || "Prefer not to say", brief: dash(b.brief),
    subject: dash(b.subject), message: dash(b.message),
    reference_photo_count: String(photos.length), response_time: STUDIO.responseTime,
    studio_email: STUDIO.email, studio_website: STUDIO.website,
  };
  for (const [k, v] of Object.entries(fields)) html = html.replaceAll(`{{${k}}}`, esc(v));
  html = html.replace(/\d+ photo\(s\) attached/, (m) => (photos.length === 1 ? "1 photo attached" : `${photos.length} photos attached`));
  return html;
}

export function renderText(b, photoUrls = []) {
  return [
    `New session request from ${b.name || "a visitor"}`, "",
    `Name: ${dash(b.name)}`, `Email: ${dash(b.email)}`, `Session type: ${dash(b.session_type)}`,
    `Preferred date: ${prettyDate(b.preferred_date)}`, `Preferred time: ${b.preferred_time || "Flexible"}`,
    `Location: ${dash(b.location)}`, `Budget: ${b.budget || "Prefer not to say"}`, "",
    `What I'd like done: ${dash(b.brief)}`, `Subject: ${dash(b.subject)}`,
    `Style & mood: ${(b.moods || []).join(", ") || "—"}`, `Anything else: ${dash(b.message)}`, "",
    `Reference links: ${(b.reference_links || []).join(" ") || "—"}`,
    `Reference photos (links valid 7 days): ${photoUrls.join(" ") || "—"}`,
  ].join("\n");
}

export function subjectFor(b) {
  return `New booking request: ${b.session_type || "Session"} · ${b.name || "Unknown"}${b.preferred_date ? " · " + prettyDate(b.preferred_date) : ""}`.slice(0, 180);
}
