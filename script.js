/* ==============================================================
   Chef with the Lens Studio: small helpers
   You normally don't need to edit this file.
   1. Settings panel + Light/Dark appearance (saved in the browser)
   2. Phone menu button
   3. Gentle fade-in of sections while scrolling
   4. Footer year
   5. Booking form -> opens the visitor's email app (mailto)
   6. Simple photo viewer for the portfolio
   ============================================================== */
const root = document.documentElement;
const THEME_KEY = "cwl-theme";

/* 1. Settings + appearance (manual only: Light is the default) */
const settingsBtn = document.querySelector(".settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const themeButtons = document.querySelectorAll("[data-theme-choice]");

function applyTheme(theme) {
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  themeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === theme)));
}
function currentTheme() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

applyTheme(currentTheme());
themeButtons.forEach((b) =>
  b.addEventListener("click", () => {
    applyTheme(b.dataset.themeChoice);
    try { localStorage.setItem(THEME_KEY, b.dataset.themeChoice); } catch (e) {}
  })
);

function setSettingsOpen(open, returnFocus) {
  if (!settingsBtn || !settingsPanel) return;
  settingsBtn.setAttribute("aria-expanded", String(open));
  settingsPanel.hidden = !open;
  if (open) settingsPanel.querySelector('[aria-pressed="true"]').focus();
  else if (returnFocus) settingsBtn.focus();
}
if (settingsBtn && settingsPanel) {
  settingsBtn.addEventListener("click", () => setSettingsOpen(settingsPanel.hidden));
  document.addEventListener("click", (e) => {
    if (!settingsPanel.hidden && !e.target.closest(".settings")) setSettingsOpen(false);
  });
}

/* 2. Phone menu */
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
function setNavOpen(open) {
  if (!navToggle || !nav) return;
  navToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
}
if (navToggle && nav) {
  navToggle.addEventListener("click", () => setNavOpen(navToggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setNavOpen(false)));
}

/* Escape closes the settings panel or the phone menu */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (settingsPanel && !settingsPanel.hidden) setSettingsOpen(false, true);
  if (navToggle && navToggle.getAttribute("aria-expanded") === "true") { setNavOpen(false); navToggle.focus(); }
});

/* 3. Fade sections in as they scroll into view */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* 4. Footer year */
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

/* 5. Booking form.
   Saves the request to the studio's private bookings list (Supabase, see booking-config.js)
   and then opens the visitor's email app (mailto), exactly as before.
   Remove data-mailto from the form to stop the email step. */
const form = document.querySelector(".booking-form");
function bookingPayload(d) {
  const clean = (v, n) => { v = (v || "").toString().trim(); return v ? v.slice(0, n) : null; };
  return {
    name: clean(d.get("name"), 120), email: clean(d.get("email"), 200),
    session_type: clean(d.get("session_type"), 60), preferred_date: clean(d.get("preferred_date"), 10),
    preferred_time: clean(d.get("preferred_time"), 40), location: clean(d.get("location"), 200),
    brief: clean(d.get("brief"), 1000), subject: clean(d.get("subject"), 200),
    moods: d.getAll("moods").map(String).slice(0, 12),
    reference_links: (d.get("reference_links") || "").split(/\s+/).filter(u => /^https?:\/\/\S+$/i.test(u)).map(u => u.slice(0, 500)).slice(0, 10),
    budget: clean(d.get("budget"), 40), message: clean(d.get("message"), 2000),
  };
}
/* Photo references: up to 5 images, 10 MB each, checked here and again by Storage. */
const REF_MAX = 5, REF_BYTES = 10 * 1024 * 1024;
const REF_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
let refFiles = [];
function checkRefFiles(list) {
  const ok = [], errs = [];
  for (const f of list) {
    const type = f.type || (/\.(heic|heif)$/i.test(f.name) ? "image/heic" : "");
    if (!REF_TYPES.includes(type)) errs.push(`${f.name}: not a supported image`);
    else if (f.size > REF_BYTES) errs.push(`${f.name}: larger than 10 MB`);
    else ok.push(f);
  }
  if (ok.length > REF_MAX) { errs.push(`Only the first ${REF_MAX} images were kept`); ok.length = REF_MAX; }
  return { ok, errs };
}
const refInput = document.getElementById("refFiles");
if (refInput) {
  const prev = document.querySelector(".refs-preview"), err = document.querySelector(".refs-err");
  const draw = () => {
    prev.innerHTML = "";
    refFiles.forEach((f, i) => {
      const li = document.createElement("li"); const img = document.createElement("img");
      img.alt = ""; img.src = URL.createObjectURL(f); img.onload = () => URL.revokeObjectURL(img.src);
      const b = document.createElement("button"); b.type = "button"; b.textContent = "×"; b.setAttribute("aria-label", `Remove ${f.name}`);
      b.addEventListener("click", () => { refFiles.splice(i, 1); draw(); });
      li.append(img, b); prev.append(li);
    });
  };
  refInput.addEventListener("change", () => {
    const r = checkRefFiles([...refFiles, ...refInput.files]); refFiles = r.ok; refInput.value = "";
    err.hidden = !r.errs.length; err.textContent = r.errs.join(". ");
    draw();
  });
}
async function uploadRefs(c, id) {
  const paths = [];
  for (let i = 0; i < refFiles.length; i++) {
    const f = refFiles[i]; const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `${id}/${i + 1}.${ext}`;
    try {
      const r = await fetch(`${c.supabaseUrl}/storage/v1/object/booking-refs/${path}`, {
        method: "POST", headers: { apikey: c.supabaseKey, "Content-Type": f.type || "image/heic", "x-upsert": "false" }, body: f,
      });
      if (r.ok) paths.push(path);
    } catch {}
  }
  return paths;
}
async function saveBooking(row) {
  const c = window.STUDIO_BOOKINGS || {};
  if (!c.supabaseUrl || !c.supabaseKey) return false;
  row.id = (crypto.randomUUID && crypto.randomUUID()) || ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, x => (x ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> x / 4).toString(16));
  row.reference_files = refFiles.length ? await uploadRefs(c, row.id) : [];
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(`${c.supabaseUrl}/rest/v1/bookings`, {
      method: "POST", signal: ctrl.signal,
      headers: { apikey: c.supabaseKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    return r.ok;
  } catch { return false; } finally { clearTimeout(t); }
}
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const note = form.querySelector(".form-note");
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    if (note) note.textContent = "Sending your request…";
    const saved = await saveBooking(bookingPayload(d));
    if (btn) btn.disabled = false;
    if (form.dataset.mailto) {
      const moods = d.getAll("moods").join(", ");
      const subject = `Session request: ${d.get("session_type")} (${d.get("name")})`;
      const body = [
        `Name: ${d.get("name")}`,
        `Email: ${d.get("email")}`,
        `Session type: ${d.get("session_type")}`,
        `Preferred date: ${d.get("preferred_date") || "Flexible"}`,
        `Preferred time: ${d.get("preferred_time") || "Flexible"}`,
        `Location: ${d.get("location") || "-"}`,
        "",
        `What I'd like done: ${d.get("brief") || ""}`,
        `Subject: ${d.get("subject") || "-"}`,
        `Style & mood: ${moods || "-"}`,
        `Reference links: ${(d.get("reference_links") || "").trim() || "-"}`,
        `Reference photos: ${refFiles.length ? refFiles.length + " uploaded with the request" : "-"}`,
        `Budget: ${d.get("budget") || "Prefer not to say"}`,
        "",
        `${d.get("message") || ""}`,
      ].join("\n");
      window.location.href =
        `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (note) note.textContent = saved
        ? "Request received! Your email app should open too. Press send for a copy in your inbox."
        : "Your email app should open now. Just press send. Thank you!";
    } else if (note) {
      note.textContent = saved ? "Request received! We'll be in touch soon." : "Sorry, that didn't go through. Please email us instead.";
    }
    if (saved) { form.dataset.saved = "1"; refFiles = []; const p = document.querySelector(".refs-preview"); if (p) p.innerHTML = ""; }
  });
}

/* 6. Portfolio photo viewer */
const lightbox = document.querySelector(".lightbox");
if (lightbox && typeof lightbox.showModal === "function") {
  const big = lightbox.querySelector("img");
  document.querySelectorAll(".portfolio-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const img = link.querySelector("img");
      big.src = link.href;
      big.alt = img ? img.alt : "";
      lightbox.showModal();
    });
  });
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });
}
