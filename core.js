// Shared helpers and state for Killian's Cadence. No imports here.
export const BUILD = "20261028-2019";

export const $ = (sel, root = document) => root.querySelector(sel);
export const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") { for (const [sk, sv] of Object.entries(v)) sk.startsWith("--") ? el.style.setProperty(sk, sv) : (el.style[sk] = sv); }
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
};
export const store = {
  get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};
export const money = (n) => "$" + Math.round(+n || 0).toLocaleString("en-US");
export const money2 = (n) => "$" + (Math.round((+n || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const isDirection = (s) => /^\(.*\)$/.test(String(s).trim());
export const fmtDay = (iso) => {
  if (!iso) return "—";
  const d = new Date(String(iso).slice(0, 10) + "T12:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const firstName = (s) => String(s || "").trim().split(/\s+/)[0] || "";
export const uid = () => Math.random().toString(36).slice(2, 10);

export const copy = (text, msg = "Copied") => (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(msg)).catch(() => toast("Couldn't copy"));
let toastT = null;
export function toast(msg) {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 1600);
}

// ---------- state ----------
export const S = {
  repo: null,        // cadence.json as shipped in the repo
  edits: null,       // local edited copy (edit mode), or null
  deck: null,        // deck.json
  tab: store.get("kc:tab", "script"),
  stage: store.get("kc:stage", 0),
  vars: store.get("kc:vars", {}),
  q: "",
  obj: store.get("kc:obj", null),
  cat: store.get("kc:cat", ""),
  practice: store.get("kc:practice", false),
  editing: false,
  call: Object.assign({
    id: "", name: "", email: "", trialStart: "", renews: "", offerId: "renew", payPlan: "full", payUrl: "", card: true,
    mode: "group", deal: "", list: "", paid: "", today: "", paidNow: false, party: false,
  }, store.get("kc:call", {})),
  calls: store.get("kc:calls", []),       // pre-call briefs, this browser only
  log: store.get("kc:log", []),           // call log, this browser only
  present: false,
  slide: 0,
  pay: Object.assign({ offerId: "life", name: "", rail: "stripe", how: "full", total: "", paid: "", who: "", n: 2, every: "month" }, store.get("kc:pay", {})),
  renderers: {},
};
// Saved edits keep working when the repo gains a new offer: missing offers are added from the repo copy.
const merged = new WeakSet();
export const content = () => {
  const e = S.edits; if (!e) return S.repo;
  if (!merged.has(e) && S.repo && Array.isArray(e.offers)) { const have = new Set(e.offers.map(o => o.id)); S.repo.offers.forEach(o => { if (!have.has(o.id)) e.offers.push(JSON.parse(JSON.stringify(o))); }); merged.add(e); }
  return e;
};
export function save() {
  store.set("kc:tab", S.tab); store.set("kc:stage", S.stage); store.set("kc:vars", S.vars); store.set("kc:call", S.call);
  store.set("kc:obj", S.obj); store.set("kc:cat", S.cat); store.set("kc:practice", S.practice); store.set("kc:calls", S.calls);
  store.set("kc:log", S.log); store.set("kc:pay", S.pay);
  if (S.edits) store.set("kc:content", S.edits);
}
export const offer = (id = S.call.offerId) => content().offers.find(o => o.id === id) || content().offers[0];
export const offerById = (id) => content().offers.find(o => o.id === id);
export const coachName = (id) => { const c = content().coaches.find(x => x.id === id); return c ? firstName(c.name) : id; };
export function setCall(patch) { Object.assign(S.call, patch); save(); render(); }
export function setPay(patch) { Object.assign(S.pay, patch); save(); render(); }
export function setTab(t) { S.tab = t; save(); render(); }

// Edit mode: work on a deep copy, keep it in this browser.
export function beginEdit() { if (!S.edits) S.edits = JSON.parse(JSON.stringify(S.repo)); S.editing = true; save(); render(); }
export function endEdit() { S.editing = false; render(); }
export function touch() { S.edits.updated = Date.now(); save(); render(); }
export function resetEdits() { S.edits = null; S.editing = false; store.del("kc:content"); render(); toast("Back to the repo copy"); }

// The current price for the deck: today's price, minus what they already paid, with manual overrides.
export function dealPrice() {
  const o = offer(), c = S.call, renewAmt = +c.renewAmount || 0;
  const set = +(c.prices || {})[o.id] || 0;
  const defToday = set > 0 ? set : (o.id === "renew" && renewAmt > 0 && c.renewInterval !== "month") ? Math.max(50, renewAmt - 25) : o.today;
  const defList = o.id === "renew" && renewAmt > 0 ? renewAmt : o.list;
  const list = c.list !== "" && c.list != null ? +c.list : defList;
  const today = c.today !== "" && c.today != null ? +c.today : defToday;
  const paid = +S.call.paid || 0;
  return { list, today, paid, due: Math.max(today - paid, 0) };
}
export const planMonths = (id = S.call.payPlan) => (S.deck.plans[id] || S.deck.plans.full).months;

export let render = () => {};
export const setRender = (fn) => { render = fn; };

// Small UI bits used by several tabs
export const seg = (items, value, onPick, cls = "") => h("div", { class: "seg " + cls }, items.map(([id, label, title]) =>
  h("button", { class: value === id ? "on" : "", title: title || "", onclick: () => onPick(id) }, label)));
export const field = (label, value, onchange, opts = {}) => h("div", { class: "field" + (opts.class ? " " + opts.class : "") }, h("label", {}, label),
  opts.textarea
    ? h("textarea", { rows: opts.rows || 3, placeholder: opts.ph || "", onchange: (e) => onchange(e.target.value) }, value || "")
    : h("input", { type: opts.type || "text", value: value ?? "", placeholder: opts.ph || "", onchange: (e) => onchange(e.target.value) }));
export const eyebrow = (t) => h("div", { class: "eyebrow" }, t);
export const download = (name, text) => {
  const a = h("a", { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: name });
  document.body.append(a); a.click(); a.remove();
};
