// Live data from Poppy's server, the same door Mo's page uses.
// Needs a machine key, kept in this browser only (localStorage kc:key). Never in the repo.
import { S, store, save, toast, uid } from "./core.js";

export const API = "https://getpoppy.ai";
export const WHO = "killian";
export const key = () => store.get("kc:key", "");
export const hasKey = () => !!key();
export function setKey(k) { store.set("kc:key", String(k || "").trim()); }
// Vercel locks the per-deploy address (killian-cadence-<hash>-<team>.vercel.app); the project address is open.
const salesBase = (u) => String(u || "").replace(/^https:\/\/killian-cadence-(?!api\.)[\w-]+\.vercel\.app\//, "https://killian-cadence-api.vercel.app/");
try { const sv = localStorage.getItem("kc:sales"); if (sv && salesBase(sv) !== sv) localStorage.setItem("kc:sales", salesBase(sv)); } catch {}
export function keyFromUrl() {
  try {
    const u = new URL(location.href); const k = u.searchParams.get("key");
    if (k) { setKey(k); u.searchParams.delete("key"); history.replaceState(null, "", u.pathname + (u.search || "") + u.hash); toast("Poppy connected"); }
    // Sales API proxy link from tools/deploy-proxy.sh: save it in this browser, then clean the address bar
    const su = u.searchParams.get("sales"), st = u.searchParams.get("salesToken");
    if (su && st && /^https:\/\/[\w.-]+\.vercel\.app\/api\/poppy-sales$/.test(su)) {
      localStorage.setItem("kc:sales", salesBase(su)); localStorage.setItem("kc:salesToken", st);
      u.searchParams.delete("sales"); u.searchParams.delete("salesToken");
      history.replaceState(null, "", u.pathname + (u.search || "") + u.hash); toast("Sales API connected");
    }
  } catch {}
}
const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Dublin"; } catch { return "Europe/Dublin"; } };

export const live = { at: store.get("kc:live:at", 0), error: "", busy: false };

export async function refreshCalls(force = false) {
  if (!hasKey()) return false;
  if (!force && Date.now() - live.at < 10 * 60e3 && S.calls.some(c => c.live)) return true;
  live.busy = true; live.error = "";
  try {
    const r = await fetch(`${API}/api/precall?who=${WHO}&tz=${encodeURIComponent(tz())}&key=${encodeURIComponent(key())}`, { credentials: "omit" });
    if (r.status === 401 || r.status === 403) { live.error = "Poppy didn't accept the key"; return false; }
    if (!r.ok) { live.error = "Poppy said " + r.status; return false; }
    const j = await r.json();
    if (!j || !j.ok || !Array.isArray(j.calls)) { live.error = (j && j.error) || "odd reply from Poppy"; return false; }
    const fresh = j.calls.map(c => mapCall(c, j.tz));
    const keep = new Map(S.calls.filter(c => c.live).map(c => [c.id, c]));
    for (const c of fresh) { const old = keep.get(c.id); if (old) { c.late = old.late; c.open = old.open; c.offerId = old.offerId || c.offerId; } }
    S.calls = [...S.calls.filter(c => !c.live), ...fresh];
    live.at = Date.now(); store.set("kc:live:at", live.at); save();
    return true;
  } catch (e) { live.error = "Couldn't reach Poppy"; return false; }
  finally { live.busy = false; }
}

const TYPES = { group: "Group onboarding", ob: "1-on-1 onboarding", ob1: "1-on-1 onboarding", onboard: "1-on-1 onboarding", close: "Closing call", closing: "Closing call", set: "Set", triage: "Closing call" };
const dayOf = (iso, zone) => {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)); } catch { return String(iso).slice(0, 10); }
};
const minus = (iso, days) => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); if (isNaN(d)) return ""; d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };
const line = (...parts) => parts.filter(Boolean).join(" · ");
const txt = (v) => (v == null ? "" : typeof v === "string" ? v : Array.isArray(v) ? v.map(txt).filter(Boolean).join("\n") : typeof v === "object" ? Object.entries(v).filter(([k, x]) => x && typeof x !== "object").map(([k, x]) => `${k}: ${x}`).join(" · ") : String(v));

const ev = (e) => {
  if (!e || typeof e !== "object") return txt(e);
  const when = e.ts ? String(e.ts).slice(5, 16).replace("T", " ") : "";
  const arrow = e.dir === "out" ? "→" : e.dir === "in" ? "←" : "·";
  const body = String(e.gist || e.text || "").replace(/\s+/g, " ").slice(0, 140);
  return line(when, e.ch, `${arrow} ${e.who || ""}`.trim()) + (body ? ": " + body : "");
};
// Turn one call from /api/precall into the card shape the Pre-call tab shows.
export function mapCall(c, zone) {
  const cust = c.customer || {}, trial = cust.trial || {}, renew = trial.renew || {};
  const brand = (c.brand && c.brand.brand) || {}, read = (c.brand && c.brand.read) || {};
  const brief = c.brief || {}, notes = brief.notes || {}, usage = c.usage || {}, where = c.where || {}, t = c.touches || {}, d7 = t.d7 || {};
  const drafts = c.drafts || {};
  const date = c.startAt ? dayOf(c.startAt, zone) : (c.day === "Today" ? new Date().toISOString().slice(0, 10) : "");
  const kind = String(c.callType || "").toLowerCase();
  const type = TYPES[kind] || (kind.includes("group") ? "Group onboarding" : kind.includes("ob") ? "1-on-1 onboarding" : "Closing call");
  const trialLine = trial.day != null ? `on day ${trial.day} of the $1 trial${trial.ends ? ", renews " + (renew.at || trial.ends) : ""}${trial.canceled ? " (canceled)" : ""}` : "";
  const sections = {
    confirmed: line(c.confirmed ? "Yes" : "No", c.score != null ? `${c.score}/10` : "", c.confirmed ? "" : (c.score != null && c.score <= 4 ? "Likely a no-show" : ""), ...(c.why || [])),
    reach: [drafts.text ? "Text: " + drafts.text : "", drafts.email && (drafts.email.subject || drafts.email.text) ? `Email: ${drafts.email.subject || ""}\n${drafts.email.text || ""}` : ""].filter(Boolean).join("\n\n"),
    who: [line(where.place, where.local ? where.local + " their time" : "", trialLine), brand.role, brand.business, ...(cust.chips || [])].filter(Boolean).join("\n"),
    putOut: [read.posts, read.working, read.gap, read.verdict].filter(Boolean).join("\n"),
    usePoppy: line(usage.messages120 != null ? `${usage.messages120} messages` : "", usage.creditsMonth != null ? `${usage.creditsMonth} credits this month` : "", usage.boards != null ? `${usage.boards} boards` : "", usage.daysMonth != null ? `${usage.daysMonth} active days this month` : "", usage.lastSeen ? "last seen " + String(usage.lastSeen).slice(0, 10) : ""),
    close: [notes.problem, ...(brief.lines || []), notes.whyNow ? "Why now: " + notes.whyNow : "", notes.cost ? "Cost of waiting: " + notes.cost : "", (brief.flags || []).length ? "Flags: " + brief.flags.join(" · ") : ""].filter(Boolean).join("\n"),
    soFar: [d7.out != null ? `We reached out ${d7.out} time${d7.out === 1 ? "" : "s"} this week (${d7.human || 0} from a person) · ${d7.in || 0} replies` : "", ...(c.timeline || []).slice(0, 6).map(ev)].filter(Boolean).join("\n"),
  };
  return {
    id: "live:" + String(c.email || c.name || uid()).toLowerCase() + ":" + date, live: true,
    date, time: c.time || "", type, name: c.name || "", email: c.email || "", phone: c.phone || "",
    bio: brand.business || brief.business || "", calendar: c.title || "", instagram: (c.links && c.links.instagram) || "",
    confirmed: c.confirmed ? "yes" : "no", score: c.score != null ? `${c.score}/10` : "", late: false,
    trialStart: trial.ends ? minus(trial.ends, 7) : "", renews: renew.at || trial.ends || "", renewAmount: renew.amount || "", renewInterval: renew.interval || "", trialCanceled: !!trial.canceled, offerId: "renew",
    join: c.join || "", notOnCalendar: !!c.notOnCalendar, channel: c.channel || "", sop: c.sop || [],
    brief: { problem: notes.problem || "", flags: brief.flags || [], lines: brief.lines || [] },
    sections, open: {},
  };
}

// ---------- money: links and the card on file (same calls as Mo's page) ----------
export const REP_EMAIL = WHO + "@getpoppy.ai";
const SKIP_IN_PRACTICE = (path, body) => /^\/api\/paylink/.test(path) && body && ["charge", "newcard"].includes(body.action)
  || /^\/api\/(lifetime|upgrade|plan-upgrade)/.test(path) && body && body.action !== "checkout"
  || /^\/api\/(postcall|followup|onboard)/.test(path) && body;

// GET or POST to Poppy with the key. In Practice: charges are skipped, everything else runs in test mode.
export async function api(path, body) {
  if (!hasKey()) throw new Error("Connect Poppy first (○ Poppy, top right)");
  let url = API + path;
  if (S.practice) {
    if (SKIP_IN_PRACTICE(path, body)) { toast("🧪 Practice: skipped " + ((body && body.action) || path.split("?")[0])); return { ok: true, practice: true, skipped: true }; }
    if (body) body = { ...body, test_mode: true, test: true }; else url += (url.includes("?") ? "&" : "?") + "test=1";
  }
  url += (url.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(key());
  // text/plain on purpose: Poppy's server parses the JSON fine, and it avoids the CORS preflight that getpoppy.ai doesn't answer.
  const r = await fetch(url, body ? { method: "POST", credentials: "omit", headers: { "content-type": "text/plain" }, body: JSON.stringify(body) } : { credentials: "omit" });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 || r.status === 403) throw new Error("Poppy didn't accept the key");
  if (!r.ok || j.ok === false) throw new Error(j.error || "that did not work (" + r.status + ")");
  return j;
}

export const isPlan = (o) => o && o.deck === "plan";
export const isOb = (o) => o && o.deck === "ob";
export const clean = (e) => String(e || "").toLowerCase().trim();

// Find the card on file. Trial customers: /api/upgrade?email=. Everyone: Stripe customers by email, then their payment methods.
export async function findCard({ email, name, ob }) {
  const te = clean(email); if (!te) return { has: false, error: "no email" };
  if (ob) {
    const q = await api("/api/upgrade?email=" + encodeURIComponent(te)).catch(() => ({}));
    if (q && q.trialing && q.has_card) return { has: true, label: q.card || "card on file", trialing: true, day: q.day, trialStart: q.trial_start, trialEnd: q.trial_end, via: "trial" };
  }
  const found = await api("/api/paylink?q=" + encodeURIComponent(te)).catch(() => ({}));
  let customers = (found.customers || found.data || []).filter(c => c && c.id);
  if (!customers.length && name && name.length > 3) {
    const byName = await api("/api/paylink?q=" + encodeURIComponent(name)).catch(() => ({}));
    customers = (byName.customers || byName.data || []).filter(c => c && c.id && clean(c.email) === te);
  }
  for (const c of customers.slice(0, 4)) {
    const r = await api("/api/paylink?pms=" + encodeURIComponent(c.id)).catch(() => ({}));
    const pm = (r.pms || r.data || [])[0];
    if (pm && pm.id) {
      const card = pm.card || pm;
      return { has: true, customerId: c.id, pm: pm.id, brand: card.brand || "card", last4: card.last4 || "", label: `${String(card.brand || "card").toUpperCase()} •• ${card.last4 || "????"}`, via: "stripe" };
    }
  }
  return { has: false };
}

// Charge the card on file. Mirrors Mo's page: the route depends on the offer.
export async function chargeCard({ offer, email, name, amount, card, plan = "", installments = 0 }) {
  const te = clean(email); amount = Math.round(+amount || 0);
  if (!te) throw new Error("add their email first");
  if (!amount) throw new Error("the amount is 0");
  let U;
  if (isOb(offer) && /^life/.test(offer.id)) U = await api("/api/lifetime", { action: "charge", email: te, source: "call", credit_to: REP_EMAIL, amount, ...(plan ? { plan } : {}), ...(installments ? { installments } : {}) });
  else if (isOb(offer) && card && card.trialing === false) U = await api("/api/revive", { action: "charge_year", email: te, price: amount, closer: "Killian" });
  else if (isOb(offer)) U = await api("/api/upgrade", { email: te, bonus: Math.max(0, Math.min(349, 399 - amount)), source: "call", clicked_by: "onboarder", offer_shown: true });
  else if (isPlan(offer)) U = await api("/api/plan-upgrade", { action: "charge", email: te, plan: offer.id, name: name || "", clicked_by: "onboarder" });
  else {
    if (!card || !card.customerId || !card.pm) throw new Error("no card on file for " + te);
    U = await api("/api/paylink", { action: "charge", customerId: card.customerId, paymentMethod: card.pm, productId: offer.stripeProduct || "", productName: offer.name || "", items: [{ type: "one_time", amount }], customerEmail: te });
  }
  if (U && U.skipped) return { ok: true, practice: true };
  const declined = U && (U.charged === false || U.declined || (U.ok === false && /declin|insufficient|card|funds|do not honor|expired/i.test(String(U.error || ""))));
  if (U && U.no_card) return { ok: false, noCard: true, error: "no card on file" };
  if (declined || (U && U.ok === false)) {
    let fix = U.pay_url || (U.invoice && U.invoice.pay_url) || "";
    if (!fix && /^life/.test(offer.id)) fix = (await api("/api/lifetime", { action: "checkout", email: te, hosted: true, amount, clicked_by: "customer", name: name || "", ...(plan ? { plan } : {}) }).catch(() => ({}))).url || "";
    if (!fix) fix = ((await api("/api/cardfix?email=" + encodeURIComponent(te)).catch(() => ({}))).fix || {}).pay_url || "";
    return { ok: false, declined: true, error: U.error || (U.declined ? "Card declined: " + U.declined : "Card declined"), fix };
  }
  return { ok: true, raw: U };
}

// Poppy's link catalog uses its own ids: plan:<id>, service:<stripe product>, lifetime, none.
export function catalogId(offer, processor = "stripe") {
  if (!offer || offer.id === "other") return "";
  if (isPlan(offer)) return "plan:" + offer.id;
  if (offer.id === "life") return "lifetime";
  if (offer.id === "renew") return "plan:basic";
  if (processor === "whop") return offer.whopProduct || "";
  return offer.stripeProduct ? "service:" + offer.stripeProduct : "";
}
// What Poppy's server accepts (checked in test mode, 2026-10-27):
//  service products: one_time · plans on Stripe: recurring yearly (or monthly) · plans on Whop: one_time with term "12"
//  2/3/6 payments: recurring monthly with charges N · lifetime: the Lifetime checkout with an email, or the group link
export function itemsFor({ offer, amount, how = "full", n = 1, every = "month", processor = "stripe" }) {
  amount = Math.round(+amount || 0);
  if (how === "monthly") return [{ type: "recurring", amount, every: 1, period: "month", charges: 0 }];
  if (how === "yearly") return [{ type: "recurring", amount, every: 1, period: "year", charges: 0 }];
  if (how === "custom") return [{ type: "recurring", amount: Math.ceil(amount / Math.max(1, n) * 100) / 100, every: 1, period: every, charges: Math.max(1, n) }];
  if (/^\d+$/.test(String(how)) && +how > 1) {
    if (processor === "whop") return [{ type: "one_time", amount, term: isPlan(offer) ? "12" : undefined }];
    return [{ type: "recurring", amount: Math.ceil(amount / +how * 100) / 100, every: 1, period: "month", charges: +how }];
  }
  if (isPlan(offer)) return processor === "whop" ? [{ type: "one_time", amount, term: "12" }] : [{ type: "recurring", amount, every: 1, period: "year", charges: 0 }];
  return [{ type: "one_time", amount }];
}

// Make a pay link. OB group link via /api/pay, Life via the hosted checkout, everything else via /api/paylink.
export async function makeLink({ offer, email, name, amount, processor = "stripe", how = "full", n = 1, every = "month", productId, productName = "", note = "", lifetimeCredits, plan = "" }) {
  const te = clean(email); amount = Math.round(+amount || 0);
  if (!amount) throw new Error("the amount is 0");
  const inst = /^\d+$/.test(String(how)) && +how > 1;
  // Creator / Power for Life: always the Lifetime checkout with the plan, so the right plan is granted.
  if (/^life./.test(offer.id) && processor === "stripe") {
    if (!te) throw new Error("add their email first: Life plans need the account email");
    const r = await api("/api/lifetime", { action: "checkout", email: te, hosted: true, amount, clicked_by: "customer", name: name || "", ...(plan ? { plan } : {}) });
    if (!r.url) throw new Error(r.error || "could not make the lifetime link");
    return { url: r.url, note: r.lifetime_note || "" };
  }
  if (isOb(offer) && processor === "whop") {
    const life = offer.id === "life";
    if (life && !te) throw new Error("Whop Life links need their email");
    const r = await api("/api/paylink", { action: "link", processor: "whop", productId: life ? "lifetime" : "plan:basic", productName: (offer.name || "Poppy") + (inst ? " · pick Splitit at checkout" : "") + (note ? " · " + note : ""), items: [{ type: "one_time", amount, ...(life ? {} : { term: "12" }) }], customerEmail: te || undefined });
    if (!r.url) throw new Error(r.error || "Whop gave no link");
    return { url: r.url, note: life ? "Whop can't switch Lifetime on by itself: tap ✓ They paid when it lands." : "" };
  }
  if (isOb(offer) && how === "full" && (offer.id !== "life" || !te) && processor === "stripe") {
    const r = await api("/api/pay", { action: "create", mode: "same", offer: { kind: offer.id === "life" ? "life" : "year", amount }, minutes: 60, room: "cadence", note: name || "" });
    if (!r.url) throw new Error(r.error || "could not make the link");
    return { url: r.url, code: r.code || "", note: "group link, good for 60 minutes" };
  }
  if (offer.id === "life" && how === "full" && processor === "stripe") {
    const r = await api("/api/lifetime", { action: "checkout", email: te, hosted: true, amount, clicked_by: "customer", name: name || "" });
    if (!r.url) throw new Error(r.error || "could not make the lifetime link");
    return { url: r.url, note: r.lifetime_note || "" };
  }
  const pid = productId != null ? productId : catalogId(offer, processor);
  const items = itemsFor({ offer, amount, how, n, every, processor });
  const pname = (productName || offer.name || "Poppy") + (note ? " · " + note : "") + (processor === "whop" && inst ? " · pick Splitit at checkout" : "");
  const r = await api("/api/paylink", { action: "link", processor, productId: pid, productName: pname, items, lifetimeCredits, customerEmail: te || undefined });
  if (!r.url) throw new Error(r.error || (processor === "whop" ? "Whop gave no link" : "Stripe gave no link"));
  const notes = [r.lifetime_note, !pid && processor === "stripe" ? "Custom name, no catalog product: it takes the money but switches nothing on in the app by itself." : "", r.access_warning ? "⚠️ " + r.access_warning : r.access_plan ? "✅ Unlocks " + r.access_plan + " by itself when paid" : "", processor === "whop" && offer.id === "life" ? "Whop can't switch Lifetime on by itself: mark paid when it lands." : ""].filter(Boolean);
  return { url: r.url, note: notes.join(" · ") };
}

export const bootProducts = () => api("/api/paylink?boot=1").then(r => ({ stripe: r.stripeProducts || [], whop: r.whopProducts || [] }));
export const searchCustomers = (q) => api("/api/paylink?q=" + encodeURIComponent(q)).then(r => (r.customers || r.data || []).filter(c => c && c.email));
