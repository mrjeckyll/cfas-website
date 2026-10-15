// =====================================================================
// CFAS website app: routing, sign-in, and everything that reads or
// writes the Supabase database. Permission rules live in the database
// (supabase/migrations); this file only decides what to show.
// =====================================================================
(function () {
"use strict";

const C = window.CFAS_CONFIG;
const TZ = C.timeZone || "America/New_York";
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const paras = s => esc(s).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

if (!window.supabase || !C) {
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<p class="notice">The site couldn't load its database connection. Check your internet connection and refresh.</p>`);
  return;
}
const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey);

// ---------- session state ----------
const S = { session: null, profile: null };
const signedIn = () => !!S.session;
const isMember = () => S.profile?.status === "active";
const isAdmin = () => isMember() && S.profile.role === "admin";

// ---------- dates (always shown in Eastern time) ----------
const fmt = (d, o) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(new Date(d));
const dayKey = d => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
const timeOf = d => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d));
const fmtTime = d => fmt(d, { hour: "numeric", minute: "2-digit" }).replace(":00", "").toLowerCase();
// "2026-11-07" + "11:00" in Eastern time → ISO timestamp with the right offset (EDT/EST)
function easternISO(date, time) {
  const probe = new Date(`${date}T${time || "00:00"}:00Z`);
  const tz = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" })
    .formatToParts(probe).find(p => p.type === "timeZoneName").value; // e.g. "GMT-4"
  const m = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const off = m ? `${m[1]}${m[2].padStart(2, "0")}:${m[3] || "00"}` : "Z";
  return `${date}T${time || "00:00"}:00${off}`;
}
const MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const money = c => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: c % 100 ? 2 : 0 });

// ---------- small UI helpers ----------
function lockPanel(what) {
  if (!signedIn()) return `<div class="lock"><h3>Members only</h3><p>${esc(what)} is visible to CFAS members. <a href="#signin">Sign in</a> or <a href="#join">create an account</a>.</p></div>`;
  return `<div class="lock"><h3>Awaiting approval</h3><p>Thanks for joining. ${esc(what)} opens up once a board member approves your membership.</p></div>`;
}
function showMsg(el, text, ok) { el.className = ok ? "ok" : "err"; el.textContent = text; }
function friendly(err) {
  const m = err?.message || String(err);
  if (/Invalid login credentials/i.test(m)) return "That email and password don't match. Try again or send yourself a reset link.";
  if (/Email not confirmed/i.test(m)) return "Please confirm your email first. Check your inbox for the link we sent.";
  if (/rate limit/i.test(m)) return "Too many emails sent recently. Wait a few minutes and try again.";
  if (/row-level security|permission denied/i.test(m)) return "You don't have permission to do that.";
  return m;
}
const formVal = id => $(id).value.trim();

// =====================================================================
// Routing
// =====================================================================
const PAGES = ["home","events","news","playlist","gear","systems","members","resources","join","signin","account","admin"];
const LOADERS = {
  home: loadEvents, events: loadEvents, news: loadNews, gear: loadGear,
  systems: loadSystems, members: loadMembers, account: renderAccount, admin: loadAdmin
};
let current = "home";
function route() {
  const h = location.hash.slice(1);
  if (h && !PAGES.includes(h)) return; // e.g. sign-in tokens in the URL; the auth client handles them
  current = h || "home";
  PAGES.forEach(p => $("p-" + p).classList.toggle("on", p === current));
  document.querySelectorAll("#nav a").forEach(a => {
    if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  LOADERS[current]?.();
}
addEventListener("hashchange", route);
const refresh = () => LOADERS[current]?.();

// =====================================================================
// Auth
// =====================================================================
async function loadProfile() {
  S.profile = null;
  if (!S.session) return;
  const { data } = await sb.from("profiles").select("*").eq("user_id", S.session.user.id).maybeSingle();
  S.profile = data;
}
function renderAcct() {
  const a = $("acct");
  if (!signedIn()) {
    a.innerHTML = `<a class="btn small" href="#signin">Sign in</a><a class="btn small primary" href="#join">Join</a>`;
  } else {
    const name = S.profile?.display_name || S.session.user.email;
    a.innerHTML = `<a class="who" href="#account" title="Your profile">${esc(name)}</a>${S.profile?.status === "pending" ? `<span class="pill warn">Pending</span>` : ""}<button class="btn small" id="signOut">Sign out</button>`;
    $("signOut").onclick = async () => { await sb.auth.signOut(); location.hash = "#home"; };
  }
  $("navAdmin").hidden = !isAdmin();
}

sb.auth.onAuthStateChange((event, session) => {
  // Defer database calls out of the auth callback (recommended by Supabase).
  setTimeout(async () => {
    S.session = session;
    await loadProfile();
    renderAcct();
    if (event === "PASSWORD_RECOVERY") {
      location.hash = "#signin";
      $("signinForm").hidden = true; $("resetForm").hidden = false;
    }
    if (event === "SIGNED_IN" && /access_token|type=/.test(location.hash)) location.hash = "#account";
    refresh();
  }, 0);
});

$("joinForm").onsubmit = async e => {
  e.preventDefault();
  const msg = $("joinMsg"); msg.textContent = "";
  const { data, error } = await sb.auth.signUp({
    email: formVal("jEmail"), password: $("jPass").value,
    options: { data: { display_name: formVal("jName") }, emailRedirectTo: location.origin + location.pathname }
  });
  if (error) return showMsg(msg, friendly(error));
  e.target.reset();
  showMsg(msg, data.session
    ? "Account created. A board member will approve your membership shortly."
    : "Almost there. Check your email and click the confirmation link. A board member will then approve your membership.", true);
};

$("signinForm").onsubmit = async e => {
  e.preventDefault();
  const msg = $("signinMsg"); msg.textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email: formVal("sEmail"), password: $("sPass").value });
  if (error) return showMsg(msg, friendly(error));
  e.target.reset(); location.hash = "#events";
};
$("forgotBtn").onclick = async () => {
  const msg = $("signinMsg"), email = formVal("sEmail");
  if (!email) return showMsg(msg, "Enter your email above first, then click the reset button.");
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  showMsg(msg, error ? friendly(error) : "If that email has an account, a reset link is on its way.", !error);
};
$("resetForm").onsubmit = async e => {
  e.preventDefault();
  const { error } = await sb.auth.updateUser({ password: $("newPass").value });
  if (error) return showMsg($("resetMsg"), friendly(error));
  $("resetForm").hidden = true; $("signinForm").hidden = false;
  location.hash = "#account";
};

// =====================================================================
// Events
// =====================================================================
let EVENTS = [], PRIV = {}, RSVPS = [];
let view = (() => { const k = dayKey(new Date()); return { y: +k.slice(0, 4), m: +k.slice(5, 7) - 1 }; })();

async function loadEvents() {
  const { data, error } = await sb.from("event_summary").select("*").order("starts_at");
  if (error) { $("evList").innerHTML = `<p class="err">${esc(friendly(error))}</p>`; return; }
  EVENTS = data; PRIV = {}; RSVPS = [];
  if (isMember()) {
    const [p, r] = await Promise.all([
      sb.from("event_private_details").select("*"),
      sb.from("rsvps").select("event_id, profile_id, status, guests, profile:profiles(display_name)")
    ]);
    (p.data || []).forEach(x => PRIV[x.event_id] = x);
    RSVPS = r.data || [];
  }
  renderCal(); renderEventLists(); renderNext(); renderEventAdmin();
}

function renderCal() {
  $("mLabel").textContent = `${MON[view.m]} ${view.y}`;
  const byDay = {};
  EVENTS.forEach(e => (byDay[dayKey(e.starts_at)] ||= []).push(e));
  const today = dayKey(new Date());
  const first = new Date(Date.UTC(view.y, view.m, 1));
  const start = new Date(first); start.setUTCDate(1 - first.getUTCDay());
  let h = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setUTCDate(start.getUTCDate() + i);
    if (i >= 35 && d.getUTCMonth() !== view.m) break;
    const key = d.toISOString().slice(0, 10);
    const evs = (byDay[key] || []).map(e => `<a class="ev" href="#events" data-jump="${e.id}" title="${esc(e.title)}">${esc(e.title)}</a>`).join("");
    const cls = (d.getUTCMonth() !== view.m ? "out " : "") + (key === today ? "today" : "");
    h += `<div class="${cls}">${d.getUTCDate()}${evs}</div>`;
  }
  $("cal").innerHTML = h;
}
$("prevM").onclick = () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCal(); };
$("nextM").onclick = () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCal(); };
$("cal").onclick = e => {
  const id = e.target.dataset.jump; if (!id) return;
  e.preventDefault();
  const el = document.querySelector(`[data-ev="${id}"]`);
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.querySelector("h3")?.focus?.(); }
};

function eventRow(e, past) {
  const mine = RSVPS.find(r => r.event_id === e.id && r.profile_id === S.profile?.id);
  const going = RSVPS.filter(r => r.event_id === e.id && r.status === "going");
  const priv = PRIV[e.id];
  const spots = e.capacity ? ` · ${Math.max(e.capacity - e.going_count, 0)} of ${e.capacity} spots left` : "";
  let side = "";
  if (isAdmin()) side += `<button class="btn small" data-edit="${e.id}">Edit</button><button class="btn small danger" data-del="${e.id}">Delete</button>`;
  if (!past) {
    if (isMember()) {
      side = ["going","maybe","not_going"].map(s =>
        `<button class="btn small ${mine?.status === s ? "on" : ""}" data-rsvp="${e.id}" data-s="${s}">${{ going: "Going", maybe: "Maybe", not_going: "Can't make it" }[s]}</button>`).join("") + side;
    } else if (!signedIn()) side = `<a class="btn small" href="#signin">Sign in to RSVP</a>`;
    else side = `<span class="mini">RSVP opens after approval</span>`;
  }
  return `<div class="event" data-ev="${e.id}">
    <div class="d">${fmt(e.starts_at, { month: "short" })} ${fmt(e.starts_at, { day: "numeric" })}<span>${fmt(e.starts_at, { weekday: "short" })} · ${fmtTime(e.starts_at)}</span></div>
    <div><span class="tag">${esc(e.event_type)}</span><h3 tabindex="-1">${esc(e.title)}</h3>
      ${e.description ? `<p>${esc(e.description)}</p>` : ""}
      <p>${esc(e.public_location || "Location to be announced")}${past ? "" : ` · ${e.going_count} going${spots}`}</p>
      ${priv && !past ? `<div class="priv"><b>Members only</b>${esc(priv.address || "")}${priv.parking_notes ? `<br>${esc(priv.parking_notes)}` : ""}${priv.host_phone ? `<br>Host: ${esc(priv.host_phone)}` : ""}</div>` : ""}
      ${isMember() && going.length ? `<p class="who-going">Going: ${going.map(r => esc(r.profile?.display_name || "A member") + (r.guests ? ` +${r.guests}` : "")).join(", ")}</p>` : ""}
    </div>
    <div class="actions">${side}</div></div>`;
}
function renderEventLists() {
  const now = Date.now();
  const up = EVENTS.filter(e => new Date(e.ends_at || e.starts_at) >= now);
  const past = EVENTS.filter(e => new Date(e.ends_at || e.starts_at) < now).reverse();
  $("evList").innerHTML = up.length ? up.map(e => eventRow(e, false)).join("") : `<p class="mini" style="padding-top:12px">No upcoming events yet.</p>`;
  $("evPast").innerHTML = past.length ? past.map(e => eventRow(e, true)).join("") : `<p class="mini">No past events.</p>`;
}
function renderNext() {
  const n = EVENTS.find(e => new Date(e.starts_at) >= Date.now());
  $("nextBox").innerHTML = n
    ? `<p class="eyebrow" style="margin:0">Next session</p><div class="date">${fmt(n.starts_at, { weekday: "long", month: "long", day: "numeric" })} · ${fmtTime(n.starts_at)}</div><h3>${esc(n.title)}</h3><p>${esc(n.description || "")}</p><p style="margin-top:8px">${esc(n.public_location || "")}</p><div class="row" style="margin-top:16px"><a class="btn small primary" href="#events">Details &amp; RSVP</a></div>`
    : `<p class="eyebrow">Next session</p><p>To be announced.</p>`;
}
async function onEventClick(e) {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.rsvp) {
    b.disabled = true;
    const { error } = await sb.from("rsvps").upsert({ event_id: b.dataset.rsvp, profile_id: S.profile.id, status: b.dataset.s }, { onConflict: "event_id,profile_id" });
    if (error) alert(friendly(error));
    loadEvents();
  } else if (b.dataset.del) {
    const ev = EVENTS.find(x => x.id === b.dataset.del);
    if (!confirm(`Delete "${ev.title}"? RSVPs for it will be removed too.`)) return;
    const { error } = await sb.from("events").delete().eq("id", b.dataset.del);
    if (error) alert(friendly(error));
    loadEvents();
  } else if (b.dataset.edit) {
    openEventForm(EVENTS.find(x => x.id === b.dataset.edit));
  }
}
$("evList").onclick = onEventClick; $("evPast").onclick = onEventClick;

const EV_TYPES = ["Listening session","Dealer visit","Workshop","Social","Show / expo","Board meeting"];
function renderEventAdmin() {
  const box = $("evAdmin");
  if (!isAdmin()) { box.innerHTML = ""; delete box.dataset.ready; return; }
  if (box.dataset.ready) return;
  box.dataset.ready = "1";
  box.innerHTML = `<details class="panel" id="evPanel"><summary id="evSummary">Add an event</summary>
  <form class="form" id="evForm">
    <input type="hidden" id="evId">
    <label class="f full">Title<input type="text" id="evTitle" required></label>
    <label class="f">Date<input type="date" id="evDate" required></label>
    <label class="f">Start time<input type="time" id="evStart" value="14:00" required></label>
    <label class="f">End time<input type="time" id="evEnd" value="17:00"></label>
    <label class="f">Type<select id="evType">${EV_TYPES.map(t => `<option>${t}</option>`).join("")}</select></label>
    <label class="f">General area (public)<input type="text" id="evLoc" placeholder="Member home, Winter Park"></label>
    <label class="f">Capacity<input type="text" id="evCap" inputmode="numeric" placeholder="Leave blank for no limit"></label>
    <label class="f full">Description (public)<textarea id="evDesc"></textarea></label>
    <label class="f full">Street address (members only)<input type="text" id="evAddr"></label>
    <label class="f">Parking notes (members only)<input type="text" id="evPark"></label>
    <label class="f">Host phone (members only)<input type="text" id="evPhone"></label>
    <div class="full row" style="margin-top:0"><button class="btn primary" type="submit" id="evSave">Add event</button><button class="btn" type="button" id="evCancel">Clear form</button></div>
    <p id="evMsg" class="full"></p>
  </form></details>`;
  $("evCancel").onclick = () => openEventForm(null, true);
  $("evForm").onsubmit = saveEvent;
}
function openEventForm(ev, clearOnly) {
  $("evForm").reset(); $("evId").value = ""; $("evMsg").textContent = "";
  $("evSummary").textContent = "Add an event"; $("evSave").textContent = "Add event";
  if (ev) {
    const p = PRIV[ev.id] || {};
    $("evId").value = ev.id; $("evTitle").value = ev.title; $("evDate").value = dayKey(ev.starts_at);
    $("evStart").value = timeOf(ev.starts_at); $("evEnd").value = ev.ends_at ? timeOf(ev.ends_at) : "";
    $("evType").value = ev.event_type; $("evLoc").value = ev.public_location || ""; $("evCap").value = ev.capacity || "";
    $("evDesc").value = ev.description || ""; $("evAddr").value = p.address || ""; $("evPark").value = p.parking_notes || ""; $("evPhone").value = p.host_phone || "";
    $("evSummary").textContent = `Edit: ${ev.title}`; $("evSave").textContent = "Save changes";
  }
  if (!clearOnly) { $("evPanel").open = true; $("evPanel").scrollIntoView({ behavior: "smooth" }); }
}
async function saveEvent(e) {
  e.preventDefault();
  const msg = $("evMsg"), id = $("evId").value, date = $("evDate").value;
  const cap = parseInt($("evCap").value, 10);
  const row = {
    title: formVal("evTitle"), event_type: $("evType").value,
    starts_at: easternISO(date, $("evStart").value),
    ends_at: $("evEnd").value ? easternISO(date, $("evEnd").value) : null,
    public_location: formVal("evLoc") || null, description: formVal("evDesc") || null,
    capacity: cap > 0 ? cap : null
  };
  let evId = id, error;
  if (id) ({ error } = await sb.from("events").update(row).eq("id", id));
  else { row.created_by = S.profile.id; const r = await sb.from("events").insert(row).select("id").single(); error = r.error; evId = r.data?.id; }
  if (error) return showMsg(msg, friendly(error));
  const priv = { event_id: evId, address: formVal("evAddr") || null, parking_notes: formVal("evPark") || null, host_phone: formVal("evPhone") || null };
  if (priv.address || priv.parking_notes || priv.host_phone || PRIV[evId]) {
    const r = await sb.from("event_private_details").upsert(priv);
    if (r.error) return showMsg(msg, friendly(r.error));
  }
  const d = date.split("-"); view = { y: +d[0], m: +d[1] - 1 };
  openEventForm(null, true); showMsg(msg, id ? "Event updated." : "Event added.", true);
  loadEvents();
}

// =====================================================================
// News
// =====================================================================
let POSTS = [];
const POST_CATS = ["News","Session recap","Show report","Tech talk","Announcement"];
async function loadNews() {
  const { data, error } = await sb.from("posts").select("*, author:profiles(display_name)")
    .order("published_at", { ascending: false, nullsFirst: true });
  if (error) { $("newsList").innerHTML = `<p class="err">${esc(friendly(error))}</p>`; return; }
  POSTS = data;
  $("newsList").innerHTML = POSTS.length ? POSTS.map(p => `<article data-post="${p.id}">
      <div><time>${p.published_at ? fmt(p.published_at, { month: "long", day: "numeric", year: "numeric" }) : "Not published"} · ${esc(p.category)}</time>
      <h3>${esc(p.title)}</h3>${p.is_published ? "" : `<span class="pill warn">Draft</span>`}</div>
      <div><p>${esc(p.excerpt || "")}</p>
      <div class="post-body" hidden>${paras(p.body)}${p.author?.display_name ? `<p class="mini">By ${esc(p.author.display_name)}</p>` : ""}</div>
      <button class="linkish" data-read="${p.id}">Read more</button>
      ${isAdmin() ? `<div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="btn small" data-pedit="${p.id}">Edit</button><button class="btn small" data-ppub="${p.id}">${p.is_published ? "Unpublish" : "Publish"}</button><button class="btn small danger" data-pdel="${p.id}">Delete</button></div>` : ""}
      </div></article>`).join("")
    : `<p class="mini">No news yet.</p>`;
  renderNewsAdmin();
}
$("newsList").onclick = async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.read) {
    const body = b.parentElement.querySelector(".post-body");
    body.hidden = !body.hidden; b.textContent = body.hidden ? "Read more" : "Show less";
  } else if (b.dataset.pedit) openPostForm(POSTS.find(p => p.id === b.dataset.pedit));
  else if (b.dataset.ppub) {
    const p = POSTS.find(x => x.id === b.dataset.ppub);
    const { error } = await sb.from("posts").update({ is_published: !p.is_published, published_at: p.is_published ? p.published_at : (p.published_at || new Date().toISOString()) }).eq("id", p.id);
    if (error) alert(friendly(error)); loadNews();
  } else if (b.dataset.pdel) {
    if (!confirm("Delete this post?")) return;
    const { error } = await sb.from("posts").delete().eq("id", b.dataset.pdel);
    if (error) alert(friendly(error)); loadNews();
  }
};
function renderNewsAdmin() {
  const box = $("newsAdmin");
  if (!isAdmin()) { box.innerHTML = ""; delete box.dataset.ready; return; }
  if (box.dataset.ready) return;
  box.dataset.ready = "1";
  box.innerHTML = `<details class="panel" id="postPanel"><summary id="postSummary">Write a post</summary>
  <form class="form" id="postForm"><input type="hidden" id="postId">
    <label class="f full">Title<input type="text" id="postTitle" required></label>
    <label class="f">Category<select id="postCat">${POST_CATS.map(c => `<option>${c}</option>`).join("")}</select></label>
    <label class="f switch" style="align-self:end"><input type="checkbox" id="postPub" checked> Publish now</label>
    <label class="f full">Short summary<input type="text" id="postExcerpt" placeholder="One sentence shown in the news list"></label>
    <label class="f full">Post (leave a blank line between paragraphs)<textarea id="postBody" required style="min-height:200px"></textarea></label>
    <div class="full row" style="margin-top:0"><button class="btn primary" type="submit" id="postSave">Save post</button><button class="btn" type="button" id="postClear">Clear form</button></div>
    <p id="postMsg" class="full"></p></form></details>`;
  $("postClear").onclick = () => openPostForm(null, true);
  $("postForm").onsubmit = savePost;
}
function openPostForm(p, clearOnly) {
  $("postForm").reset(); $("postId").value = ""; $("postMsg").textContent = ""; $("postSummary").textContent = "Write a post";
  if (p) {
    $("postId").value = p.id; $("postTitle").value = p.title; $("postCat").value = p.category;
    $("postPub").checked = p.is_published; $("postExcerpt").value = p.excerpt || ""; $("postBody").value = p.body;
    $("postSummary").textContent = `Edit: ${p.title}`;
  }
  if (!clearOnly) { $("postPanel").open = true; $("postPanel").scrollIntoView({ behavior: "smooth" }); }
}
async function savePost(e) {
  e.preventDefault();
  const id = $("postId").value, pub = $("postPub").checked, old = POSTS.find(p => p.id === id);
  const row = { title: formVal("postTitle"), category: $("postCat").value, excerpt: formVal("postExcerpt") || null,
    body: $("postBody").value.trim(), is_published: pub,
    published_at: pub ? (old?.published_at || new Date().toISOString()) : (old?.published_at || null) };
  let error;
  if (id) ({ error } = await sb.from("posts").update(row).eq("id", id));
  else {
    row.author_id = S.profile.id;
    row.slug = row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) + "-" + Date.now().toString(36);
    ({ error } = await sb.from("posts").insert(row));
  }
  if (error) return showMsg($("postMsg"), friendly(error));
  openPostForm(null, true); showMsg($("postMsg"), "Post saved.", true); loadNews();
}

// =====================================================================
// Gear for sale
// =====================================================================
const GEAR_CATS = ["Speakers","Amplification","Source","DAC","Turntable / analog","Cables","Accessories","Room treatment","Other"];
const CONDS = ["New","Excellent","Very good","Good","Fair","For parts"];
let LISTINGS = [], gearFilter = { cat: "", status: "open" };
async function loadGear() {
  const box = $("gearBody");
  if (!isMember()) { box.innerHTML = lockPanel("Gear for sale"); return; }
  const { data, error } = await sb.from("listings").select("*, seller:profiles(display_name, city)").order("created_at", { ascending: false });
  if (error) { box.innerHTML = `<p class="err">${esc(friendly(error))}</p>`; return; }
  LISTINGS = data;
  box.innerHTML = `
  <details class="panel" id="gearPanel"><summary>Post an item for sale</summary>
    <form class="form" id="gearForm">
      <label class="f full">Title<input type="text" id="gTitle" required placeholder="e.g. Pair of bookshelf speakers"></label>
      <label class="f">Category<select id="gCat">${GEAR_CATS.map(c => `<option>${c}</option>`).join("")}</select></label>
      <label class="f">Condition<select id="gCond">${CONDS.map(c => `<option${c === "Very good" ? " selected" : ""}>${c}</option>`).join("")}</select></label>
      <label class="f">Brand<input type="text" id="gBrand"></label>
      <label class="f">Model<input type="text" id="gModel"></label>
      <label class="f">Asking price (USD)<input type="text" id="gPrice" inputmode="decimal" required placeholder="450"></label>
      <label class="f switch" style="align-self:end"><input type="checkbox" id="gTrade"> Open to trades</label>
      <label class="f full">Description<textarea id="gDesc" placeholder="Condition details, what's included, pickup or shipping"></textarea></label>
      <div class="full"><button class="btn primary" type="submit">Post listing</button><p id="gMsg"></p></div>
    </form></details>
  <div class="filters">
    <select id="gfCat" aria-label="Category"><option value="">All categories</option>${GEAR_CATS.map(c => `<option${gearFilter.cat === c ? " selected" : ""}>${c}</option>`).join("")}</select>
    <select id="gfStatus" aria-label="Status"><option value="open">Available &amp; pending</option><option value="all">Include sold</option><option value="mine">My listings</option></select>
  </div>
  <div class="cards" id="gearCards"></div>
  <p class="mini" style="margin-top:20px">To contact a seller, find them in the <a href="#members">member directory</a> or at the next session.</p>`;
  $("gfStatus").value = gearFilter.status;
  $("gfCat").onchange = e => { gearFilter.cat = e.target.value; renderGear(); };
  $("gfStatus").onchange = e => { gearFilter.status = e.target.value; renderGear(); };
  $("gearForm").onsubmit = saveListing;
  $("gearCards").onclick = onGearClick;
  renderGear();
}
function renderGear() {
  const mineId = S.profile?.id;
  const list = LISTINGS.filter(l =>
    (!gearFilter.cat || l.category === gearFilter.cat) &&
    (gearFilter.status === "all" || (gearFilter.status === "mine" ? l.seller_id === mineId : l.status !== "sold")));
  $("gearCards").innerHTML = list.length ? list.map(l => {
    const mine = l.seller_id === mineId;
    const pill = { available: `<span class="pill go">Available</span>`, pending: `<span class="pill">Sale pending</span>`, sold: `<span class="pill warn">Sold</span>` }[l.status];
    return `<div class="card">
      <div class="meta">${pill}<span class="pill">${esc(l.category)}</span>${l.trade_ok ? `<span class="pill">Trades OK</span>` : ""}</div>
      <h3>${esc(l.title)}</h3>
      <div class="price">${money(l.price_cents)}</div>
      <p>${esc([l.brand, l.model].filter(Boolean).join(" "))}${l.brand || l.model ? " · " : ""}${esc(l.condition)}</p>
      ${l.description ? `<p>${esc(l.description)}</p>` : ""}
      <div class="foot"><span class="mini">${esc(l.seller?.display_name || "A member")}${l.seller?.city ? `, ${esc(l.seller.city)}` : ""} · ${fmt(l.created_at, { month: "short", day: "numeric" })}</span>
      ${mine ? `<span class="actions"><select data-lstatus="${l.id}" aria-label="Listing status">${["available","pending","sold"].map(s => `<option value="${s}"${l.status === s ? " selected" : ""}>${s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select><button class="btn small danger" data-ldel="${l.id}">Remove</button></span>`
        : isAdmin() ? `<button class="btn small danger" data-ldel="${l.id}">Remove</button>` : ""}</div>
    </div>`;
  }).join("") : `<p class="mini">No listings match. Post the first one above.</p>`;
  document.querySelectorAll("[data-lstatus]").forEach(s => s.onchange = async () => {
    const { error } = await sb.from("listings").update({ status: s.value }).eq("id", s.dataset.lstatus);
    if (error) alert(friendly(error)); loadGear();
  });
}
async function onGearClick(e) {
  const b = e.target.closest("button[data-ldel]"); if (!b) return;
  if (!confirm("Remove this listing?")) return;
  const { error } = await sb.from("listings").delete().eq("id", b.dataset.ldel);
  if (error) alert(friendly(error)); loadGear();
}
async function saveListing(e) {
  e.preventDefault();
  const price = Math.round(parseFloat(formVal("gPrice").replace(/[$,]/g, "")) * 100);
  if (!(price >= 0)) return showMsg($("gMsg"), "Enter the price as a number, for example 450.");
  const { error } = await sb.from("listings").insert({
    seller_id: S.profile.id, title: formVal("gTitle"), category: $("gCat").value, condition: $("gCond").value,
    brand: formVal("gBrand") || null, model: formVal("gModel") || null, price_cents: price,
    trade_ok: $("gTrade").checked, description: formVal("gDesc") || null
  });
  if (error) return showMsg($("gMsg"), friendly(error));
  loadGear();
}

// =====================================================================
// Member systems
// =====================================================================
const SYS_FIELDS = [["speakers","Speakers"],["amplification","Amplification"],["source","Source"],["dac","DAC"],["analog","Analog"],["room","Room"],["notes","Notes"]];
async function loadSystems() {
  const box = $("sysBody");
  if (!isMember()) { box.innerHTML = lockPanel("Member systems"); return; }
  const { data, error } = await sb.from("systems").select("*, owner:profiles(display_name, city)").order("created_at");
  if (error) { box.innerHTML = `<p class="err">${esc(friendly(error))}</p>`; return; }
  const card = s => `<div class="rig" style="margin-top:0">
      <div class="meta" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${s.approved ? "" : `<span class="pill warn">Awaiting review</span>`}</div>
      <h3>${esc(s.name)}</h3><p class="mini" style="margin:4px 0 10px">${esc(s.owner?.display_name || "A member")}${s.owner?.city ? `, ${esc(s.owner.city)}` : ""}</p>
      <table>${SYS_FIELDS.filter(([k]) => s[k] && s[k] !== "—").map(([k, l]) => `<tr><td>${l}</td><td>${esc(s[k])}</td></tr>`).join("")}</table>
      ${(s.owner_id === S.profile.id || isAdmin()) ? `<div class="actions" style="justify-content:flex-start;margin-top:12px">${isAdmin() && !s.approved ? `<button class="btn small primary" data-sapprove="${s.id}">Approve</button>` : ""}<button class="btn small danger" data-sdel="${s.id}">Remove</button></div>` : ""}
    </div>`;
  box.innerHTML = `<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${data.map(card).join("") || `<p class="mini">No systems yet.</p>`}</div>
    <details class="panel"><summary>Add your system</summary>
      <p class="mini" style="margin-top:0">An admin reviews new systems before other members see them.</p>
      <form class="form" id="sysForm">
        <label class="f full">System name<input type="text" id="sys_name" required placeholder="e.g. Living-room two-channel"></label>
        ${SYS_FIELDS.map(([k, l]) => `<label class="f${k === "notes" ? " full" : ""}">${l}<input type="text" id="sys_${k}"></label>`).join("")}
        <div class="full"><button class="btn primary" type="submit">Submit for review</button><p id="sysMsg"></p></div>
      </form></details>`;
  $("sysForm").onsubmit = async ev => {
    ev.preventDefault();
    const row = { owner_id: S.profile.id, name: formVal("sys_name") };
    SYS_FIELDS.forEach(([k]) => row[k] = formVal("sys_" + k) || null);
    const { error } = await sb.from("systems").insert(row);
    if (error) return showMsg($("sysMsg"), friendly(error));
    loadSystems();
  };
  box.onclick = async ev => {
    const b = ev.target.closest("button"); if (!b) return;
    if (b.dataset.sapprove) { const { error } = await sb.from("systems").update({ approved: true }).eq("id", b.dataset.sapprove); if (error) alert(friendly(error)); }
    else if (b.dataset.sdel) { if (!confirm("Remove this system?")) return; const { error } = await sb.from("systems").delete().eq("id", b.dataset.sdel); if (error) alert(friendly(error)); }
    else return;
    loadSystems();
  };
}

// =====================================================================
// Members directory
// =====================================================================
async function loadMembers() {
  const box = $("memBody");
  if (!isMember()) { box.innerHTML = lockPanel("The member directory"); return; }
  const { data, error } = await sb.from("profiles").select("id, display_name, city, bio, joined_on, role, status, show_in_directory").order("display_name");
  if (error) { box.innerHTML = `<p class="err">${esc(friendly(error))}</p>`; return; }
  const rows = data.filter(p => p.status === "active" && (p.show_in_directory || p.id === S.profile.id));
  box.innerHTML = `<p class="lede">${rows.length} members. <a href="#account">Edit your own listing</a>.</p>
  <div class="grid-wrap" style="margin-top:20px"><table class="dir"><thead><tr><th>Name</th><th>City</th><th>Member since</th><th>About</th></tr></thead><tbody>
  ${rows.map(p => `<tr><td><strong>${esc(p.display_name)}</strong>${p.role === "admin" ? ` <span class="pill">Board</span>` : ""}${p.id === S.profile.id ? ` <span class="pill go">You</span>` : ""}</td><td>${esc(p.city || "")}</td><td style="white-space:nowrap">${p.joined_on ? fmt(p.joined_on + "T12:00:00Z", { month: "short", year: "numeric" }) : ""}</td><td>${esc(p.bio || "")}</td></tr>`).join("")}
  </tbody></table></div>`;
}

// =====================================================================
// Account
// =====================================================================
function renderAccount() {
  const box = $("acctBody");
  if (!signedIn()) { box.innerHTML = `<div class="lock"><p><a href="#signin">Sign in</a> to see your profile.</p></div>`; return; }
  const p = S.profile;
  if (!p) { box.innerHTML = `<p class="loading">Loading your profile…</p>`; return; }
  box.innerHTML = `${p.status === "pending" ? `<p class="notice">Your membership is awaiting approval by a board member. You'll see session addresses, the directory, gear for sale, and member systems once approved.</p>` : ""}
  <div class="cols"><form class="form" id="profForm">
    <label class="f full">Name<input type="text" id="pfName" required value="${esc(p.display_name)}"></label>
    <label class="f full">City<input type="text" id="pfCity" value="${esc(p.city || "")}"></label>
    <label class="f full">About you and your system<textarea id="pfBio">${esc(p.bio || "")}</textarea></label>
    <label class="f full switch"><input type="checkbox" id="pfShow" ${p.show_in_directory ? "checked" : ""}> Show me in the member directory</label>
    <div class="full"><button class="btn primary" type="submit">Save profile</button><p id="pfMsg"></p></div>
  </form>
  <div><h3>Account</h3><p class="mini">Signed in as ${esc(S.session.user.email)}<br>Status: ${esc(p.status)}${p.role === "admin" ? " · Administrator" : ""}</p></div></div>`;
  $("profForm").onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.from("profiles").update({
      display_name: formVal("pfName"), city: formVal("pfCity") || null, bio: formVal("pfBio") || null, show_in_directory: $("pfShow").checked
    }).eq("id", p.id);
    if (error) return showMsg($("pfMsg"), friendly(error));
    await loadProfile(); renderAcct(); showMsg($("pfMsg"), "Profile saved.", true);
  };
}

// =====================================================================
// Admin
// =====================================================================
async function loadAdmin() {
  const box = $("adminBody");
  if (!isAdmin()) { box.innerHTML = `<div class="lock"><p>This page is for club administrators.</p></div>`; return; }
  const [{ data: people, error }, { count: pendingSys }] = await Promise.all([
    sb.from("profiles").select("*").order("display_name"),
    sb.from("systems").select("id", { count: "exact", head: true }).eq("approved", false)
  ]);
  if (error) { box.innerHTML = `<p class="err">${esc(friendly(error))}</p>`; return; }
  const pending = people.filter(p => p.status === "pending");
  const active = people.filter(p => p.status === "active");
  const inactive = people.filter(p => p.status === "inactive");
  const row = (p, btns) => `<tr><td><strong>${esc(p.display_name)}</strong>${p.is_demo ? ` <span class="pill">Demo</span>` : ""}${p.user_id ? "" : ` <span class="pill">No login</span>`}</td><td>${esc(p.city || "")}</td><td>${esc(p.role)}</td><td><div class="actions" style="justify-content:flex-start">${btns}</div></td></tr>`;
  const table = (rows) => `<div class="grid-wrap"><table class="dir"><thead><tr><th>Name</th><th>City</th><th>Role</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  box.innerHTML = `
  <div class="stats" style="margin-top:20px"><span><b>${pending.length}</b>awaiting approval</span><span><b>${active.length}</b>active members</span><span><b>${pendingSys || 0}</b>systems to review</span></div>
  ${pendingSys ? `<p class="notice"><a href="#systems">Review member systems</a> waiting for approval.</p>` : ""}
  <h3 style="margin-top:32px">Awaiting approval</h3>
  ${pending.length ? table(pending.map(p => row(p, `<button class="btn small primary" data-st="active" data-id="${p.id}">Approve</button><button class="btn small" data-st="inactive" data-id="${p.id}">Decline</button>`)).join("")) : `<p class="mini">Nobody is waiting.</p>`}
  <h3 style="margin-top:32px">Active members</h3>
  ${table(active.map(p => row(p, p.id === S.profile.id ? `<span class="mini">You</span>` :
      `${p.role === "admin" ? `<button class="btn small" data-role="member" data-id="${p.id}">Remove admin</button>` : `<button class="btn small" data-role="admin" data-id="${p.id}">Make admin</button>`}<button class="btn small danger" data-st="inactive" data-id="${p.id}">Deactivate</button>`)).join(""))}
  ${inactive.length ? `<details class="panel"><summary>Inactive (${inactive.length})</summary>${table(inactive.map(p => row(p, `<button class="btn small" data-st="active" data-id="${p.id}">Reactivate</button>`)).join(""))}</details>` : ""}
  <p class="mini" style="margin-top:24px">Members marked "No login" are on the roster but haven't created an account yet.</p>`;
  box.onclick = async e => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    const patch = b.dataset.st ? { status: b.dataset.st } : { role: b.dataset.role };
    b.disabled = true;
    const { error } = await sb.from("profiles").update(patch).eq("id", b.dataset.id);
    if (error) alert(friendly(error));
    loadAdmin();
  };
}

// ---------- start ----------
$("yr").textContent = fmt(new Date(), { year: "numeric" });
renderAcct();
route();
sb.auth.getSession().then(({ data }) => {
  S.session = data.session;
  loadProfile().then(() => { renderAcct(); refresh(); });
});
})();
