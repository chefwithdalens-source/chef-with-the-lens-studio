/* Private owner dashboard: lists booking requests (Supabase, RLS restricts reads to the studio owner). */
(function () {
  const C = window.STUDIO_BOOKINGS || {};
  const SB_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js";
  const SB_SRI = "sha384-BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R";
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : null;
  let sb = null, rows = [], thumbs = {}, when = "upcoming";
  const status = t => { $("#status").textContent = t || ""; };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  function boot(client) {
    sb = client;
    sb.auth.onAuthStateChange((_ev, session) => show(session && session.user));
    sb.auth.getSession().then(r => show(r.data && r.data.session && r.data.session.user));
  }
  function show(user) {
    $("#signin").hidden = !!user; $("#board").hidden = !user; $("#who").hidden = !user;
    if (user) { $("#whoEmail").textContent = user.email || ""; load(); } else { status(""); }
  }
  async function load() {
    status("Loading bookings…");
    const { data, error } = await sb.from("bookings").select("*").order("preferred_date", { ascending: true, nullsFirst: false }).limit(500);
    if (error) { status("Couldn't load bookings: " + error.message); rows = []; return draw(); }
    rows = data || []; status("");
    const svc = [...new Set(rows.map(r => r.session_type).filter(Boolean))].sort();
    const fs = $("#fService"), cur = fs.value;
    fs.innerHTML = '<option value="">All services</option>' + svc.map(s => `<option${s === cur ? " selected" : ""}>${esc(s)}</option>`).join("");
    const paths = rows.flatMap(r => r.reference_files || []).filter(p => !thumbs[p]);
    if (paths.length) {
      const { data: urls } = await sb.storage.from("booking-refs").createSignedUrls(paths, 3600);
      (urls || []).forEach(u => { if (u && u.signedUrl) thumbs[u.path] = u.signedUrl; });
    }
    draw();
  }
  function sortKey(r) { const t = today(); const d = r.preferred_date; return d ? (d >= t ? "0" + d : "2" + (99999999 - Number(d.replace(/-/g, "")))) : "1" + r.created_at; }
  function visible() {
    const t = today(), st = $("#fStatus").value, sv = $("#fService").value, q = $("#fSearch").value.trim().toLowerCase();
    return rows.filter(r => {
      if (when === "upcoming" && r.preferred_date && r.preferred_date < t) return false;
      if (when === "past" && !(r.preferred_date && r.preferred_date < t)) return false;
      if (st && r.status !== st) return false;
      if (sv && r.session_type !== sv) return false;
      if (q && ![r.name, r.email, r.brief, r.subject, r.location, r.message, (r.moods || []).join(" ")].join(" ").toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  }
  function card(r) {
    const d = r.preferred_date ? new Date(r.preferred_date + "T12:00") : null;
    const whenBox = d ? `<div class="ow-when" aria-label="${esc(d.toDateString())}"><span>${d.toLocaleDateString("en-US", { month: "short" })}</span><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-US", { weekday: "short" })}</span></div>` : `<div class="ow-when"><span>Date</span><b>—</b><span>Flexible</span></div>`;
    const links = (r.reference_links || []).map(safeUrl).filter(Boolean);
    const files = (r.reference_files || []).filter(p => thumbs[p]);
    const facts = [["When", [d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Flexible date", r.preferred_time].filter(Boolean).join(" · ")], ["Subject", r.subject], ["Location", r.location], ["Budget", r.budget]].filter(x => x[1]);
    return `<article class="ow-card st-${esc(r.status)}" data-id="${esc(r.id)}">
      <div class="ow-top">${whenBox}<div class="ow-meta"><p class="ow-service">${esc(r.session_type || "Session")}</p><p class="ow-client">${esc(r.name)} · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a></p></div></div>
      <h2 class="ow-brief">${esc(r.brief || r.message || "No brief given")}</h2>
      ${(r.moods || []).length ? `<ul class="ow-tags" aria-label="Style and mood">${r.moods.map(m => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
      ${files.length ? `<div class="ow-thumbs" aria-label="Reference photos">${files.map((p, i) => `<button type="button" data-full="${esc(thumbs[p])}" aria-label="Open reference photo ${i + 1}"><img src="${esc(thumbs[p])}" alt="" loading="lazy" /></button>`).join("")}</div>` : ""}
      <dl class="ow-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      ${links.length ? `<ul class="ow-links" aria-label="Reference links">${links.map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\//, "").slice(0, 60))}</a></li>`).join("")}</ul>` : ""}
      ${r.message && r.brief ? `<p class="ow-note">“${esc(r.message)}”</p>` : ""}
      <div class="ow-foot"><span>Requested ${esc(new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}</span>
        <label><span class="sr-only">Status for ${esc(r.name)}</span><select data-status>${["new", "contacted", "booked", "done", "declined"].map(s => `<option value="${s}"${s === r.status ? " selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select></label></div>
    </article>`;
  }
  function draw() {
    const v = visible();
    $("#count").textContent = rows.length ? `${v.length} of ${rows.length} request${rows.length === 1 ? "" : "s"}` : "";
    $("#cards").innerHTML = v.length ? v.map(card).join("") : `<p class="ow-empty">${rows.length ? "No requests match these filters." : "No booking requests yet. New ones from the website form will show up here."}</p>`;
  }
  // events
  $("#cards").addEventListener("click", e => {
    const b = e.target.closest("[data-full]"); if (!b) return;
    const lb = $("#lightbox"); lb.querySelector("img").src = b.dataset.full; lb.showModal();
  });
  $("#cards").addEventListener("change", async e => {
    const s = e.target.closest("[data-status]"); if (!s) return;
    const id = s.closest(".ow-card").dataset.id;
    const { error } = await sb.from("bookings").update({ status: s.value }).eq("id", id);
    if (error) { status("Couldn't update status: " + error.message); return; }
    const r = rows.find(x => x.id === id); if (r) r.status = s.value; status("Status updated"); draw();
  });
  const lb = $("#lightbox");
  lb.querySelector(".ow-lb-close").addEventListener("click", () => lb.close());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
  document.querySelectorAll("[data-when]").forEach(b => b.addEventListener("click", () => {
    when = b.dataset.when; document.querySelectorAll("[data-when]").forEach(x => x.setAttribute("aria-checked", String(x === b))); draw();
  }));
  ["#fStatus", "#fService"].forEach(s => $(s).addEventListener("change", draw));
  $("#fSearch").addEventListener("input", draw);
  $("#refresh").addEventListener("click", load);
  $("#signOut").addEventListener("click", async () => { await sb.auth.signOut(); show(null); });
  $("#magicForm").addEventListener("submit", async e => {
    e.preventDefault(); const em = $("#email").value.trim(), msg = $("#magicMsg");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.textContent = "Enter a valid email address."; return; }
    if (!sb) { msg.textContent = "Still loading. Try again in a moment."; return; }
    msg.textContent = "Sending…";
    const { error } = await sb.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.origin + location.pathname } });
    msg.textContent = error ? "Couldn't send the link: " + error.message : `Check ${em} for your sign-in link.`;
  });
  // start
  if (window.__OWNER_MOCK_CLIENT) return boot(window.__OWNER_MOCK_CLIENT);
  if (!C.supabaseUrl || !C.supabaseKey) { $("#signin").hidden = false; status("Bookings aren't connected yet."); return; }
  const sc = document.createElement("script"); sc.src = SB_SRC; sc.integrity = SB_SRI; sc.crossOrigin = "anonymous";
  sc.onload = () => boot(window.supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "implicit", storageKey: "cwl-owner-auth" } }));
  sc.onerror = () => { $("#signin").hidden = false; status("Couldn't load sign-in. Check your connection."); };
  document.head.appendChild(sc);
})();
