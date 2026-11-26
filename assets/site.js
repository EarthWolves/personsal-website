// ---------------------------------------------------------------
// Edit these to update links everywhere on the site.
// ---------------------------------------------------------------
const SITE = {
  name: "Rohan Raval",
  email: "rraval@ucsd.edu",
  linkedin: "https://www.linkedin.com/in/rohanraval2/",
  calendly: "https://calendly.com/rohanraval/new-meeting",
  // Where the contact form posts. Leave empty to fall back to email.
  // Later: a public endpoint on the CRM, e.g. "https://crm.rraval.com/api/public/inbound"
  crmEndpoint: "https://crm.rraval.com/api/public/contact",
};

// Fill any element with data-link / data-text from SITE
document.querySelectorAll("[data-link]").forEach((el) => {
  const k = el.dataset.link;
  el.href = k === "email" ? `mailto:${SITE.email}` : SITE[k];
  if (k !== "email") { el.target = "_blank"; el.rel = "noopener"; }
});
document.querySelectorAll("[data-text]").forEach((el) => { el.textContent = SITE[el.dataset.text]; });

// Nav border on scroll
const nav = document.querySelector(".nav");
const onScroll = () => nav && nav.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

// Reveal on scroll
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Toast
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
}

// Copy email
document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async (e) => {
  e.preventDefault();
  try { await navigator.clipboard.writeText(SITE[b.dataset.copy]); toast("Email copied"); }
  catch { location.href = `mailto:${SITE.email}`; }
}));

// Contact form: topic chips + submit
const form = document.querySelector("form.msg");
if (form) {
  let topic = "";
  form.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
    form.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", "false"));
    c.setAttribute("aria-pressed", "true"); topic = c.textContent.trim();
  }));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    d.topic = topic;
    if (SITE.crmEndpoint) {
      const btn = form.querySelector('[type="submit"]'), label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const r = await fetch(SITE.crmEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
        if (!r.ok) throw new Error();
        form.reset(); topic = "";
        form.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", "false"));
        btn.textContent = "Sent ✓"; toast("Thanks! I'll get back to you soon.");
        setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 4000);
        return;
      } catch { btn.textContent = label; btn.disabled = false; /* fall through to email */ }
    }
    const subject = encodeURIComponent(`${topic ? topic + " — " : ""}from ${d.name || "rraval.com"}`);
    const body = encodeURIComponent(`${d.message || ""}\n\n— ${d.name || ""} (${d.email || ""})`);
    location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  });
}

// Merlo demo: highlight where each line item came from on the plan
const demo = document.querySelector("[data-demo]");
if (demo) {
  const items = [...demo.querySelectorAll(".item")], layers = [...demo.querySelectorAll(".hl")];
  const sheet = demo.querySelector("[data-sheet]"), sheetName = demo.querySelector("[data-sheetname]");
  let cur = 0, paused = false;
  const show = (i) => {
    cur = i; const it = items[i];
    items.forEach((x) => x.classList.toggle("on", x === it));
    layers.forEach((l) => l.classList.toggle("on", l.dataset.k === it.dataset.k));
    sheet.textContent = it.dataset.sheet; sheetName.textContent = it.dataset.sheetname;
    sheet.style.setProperty("--cur", getComputedStyle(it).getPropertyValue("--c"));
  };
  items.forEach((it, i) => {
    it.addEventListener("mouseenter", () => { paused = true; show(i); });
    it.addEventListener("focus", () => { paused = true; show(i); });
    it.addEventListener("click", () => { paused = true; show(i); });
  });
  demo.addEventListener("mouseleave", () => (paused = false));
  show(0);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
    setInterval(() => { if (!paused && !document.hidden) show((cur + 1) % items.length); }, 2400);
}

// Reading progress (articles)
const bar = document.querySelector(".progress");
if (bar) addEventListener("scroll", () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
}, { passive: true });

// ---------------------------------------------------------------
// Command menu (⌘K / Ctrl+K) — the Linear signature
// ---------------------------------------------------------------
const root = document.body.dataset.root || "";
const COMMANDS = [
  { group: "Reach me" },
  { label: "Book a call", hint: "Calendly", run: () => open(SITE.calendly, "_blank") },
  { label: "Copy email", hint: SITE.email, run: () => navigator.clipboard.writeText(SITE.email).then(() => toast("Email copied")) },
  { label: "Send an email", hint: "mailto", run: () => (location.href = `mailto:${SITE.email}`) },
  { label: "LinkedIn", hint: "↗", run: () => open(SITE.linkedin, "_blank") },
  { group: "Go to" },
  { label: "Home", hint: "G H", run: () => (location.href = root + "index.html") },
  { label: "Merlo", hint: "G M", run: () => (location.href = root + "index.html#merlo") },
  { label: "Writing", hint: "G W", run: () => (location.href = root + "index.html#writing") },
  { label: "Timeline", hint: "G T", run: () => (location.href = root + "index.html#timeline") },
  { label: "Resume", hint: "you found it", run: () => (location.href = root + "resume.html") },
];

const bd = document.createElement("div");
bd.className = "cmdk-backdrop";
bd.innerHTML = `<div class="cmdk" role="dialog" aria-label="Command menu">
  <input placeholder="Type a command or search…" aria-label="Search commands"/><ul></ul></div>`;
document.body.appendChild(bd);
const input = bd.querySelector("input"), list = bd.querySelector("ul");
let items = [], active = 0;

function render() {
  const q = input.value.toLowerCase().trim();
  list.innerHTML = ""; items = [];
  COMMANDS.forEach((c) => {
    if (c.group) { if (!q) list.insertAdjacentHTML("beforeend", `<li class="group">${c.group}</li>`); return; }
    if (q && !(c.label + " " + c.hint).toLowerCase().includes(q)) return;
    const li = document.createElement("li");
    li.innerHTML = `<span>${c.label}</span><span class="hint">${c.hint}</span>`;
    li.onclick = () => { close(); c.run(); };
    li.onmousemove = () => setActive(items.indexOf(li));
    list.appendChild(li); items.push(li); li._c = c;
  });
  setActive(0);
}
function setActive(i) { items.forEach((x) => x.classList.remove("active")); active = i; items[i] && items[i].classList.add("active"); }
function openMenu() { bd.classList.add("open"); input.value = ""; render(); setTimeout(() => input.focus(), 0); }
function close() { bd.classList.remove("open"); }

bd.addEventListener("click", (e) => { if (e.target === bd) close(); });
input.addEventListener("input", render);
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(active + 1, items.length - 1)); items[active]?.scrollIntoView({ block: "nearest" }); }
  if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); items[active]?.scrollIntoView({ block: "nearest" }); }
  if (e.key === "Enter" && items[active]) { const c = items[active]._c; close(); c.run(); }
});
document.querySelectorAll("[data-cmdk]").forEach((b) => b.addEventListener("click", openMenu));

let gPressed = 0;
addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); bd.classList.contains("open") ? close() : openMenu(); return; }
  if (e.key === "Escape") return close();
  if (/input|textarea/i.test(document.activeElement.tagName)) return;
  // Linear-style "G then X" shortcuts
  if (e.key === "g") { gPressed = Date.now(); return; }
  if (Date.now() - gPressed < 800) {
    const map = { m: "index.html#merlo", c: "index.html#contact", h: "index.html", w: "index.html#writing", t: "index.html#timeline", r: "resume.html" };
    if (map[e.key]) location.href = root + map[e.key];
  }
});
