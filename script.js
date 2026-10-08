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

/* 5. Booking form via email.
   Only runs while the form has a data-mailto="..." attribute.
   Remove that attribute if you switch to a form service like Formspree. */
const form = document.querySelector(".booking-form[data-mailto]");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const subject = `Session request: ${d.get("session_type")} (${d.get("name")})`;
    const body = [
      `Name: ${d.get("name")}`,
      `Email: ${d.get("email")}`,
      `Session type: ${d.get("session_type")}`,
      `Preferred date: ${d.get("preferred_date") || "Flexible"}`,
      "",
      `${d.get("message") || ""}`,
    ].join("\n");
    window.location.href =
      `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const note = form.querySelector(".form-note");
    if (note) note.textContent = "Your email app should open now. Just press send. Thank you!";
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
