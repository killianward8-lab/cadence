// Live data from Poppy's server, the same door Mo's page uses.
// Needs a machine key, kept in this browser only (localStorage kc:key). Never in the repo.
import { S, store, save, toast, uid } from "./core.js";

export const API = "https://getpoppy.ai";
export const WHO = "killian";
export const key = () => store.get("kc:key", "");
export const hasKey = () => !!key();
export function setKey(k) { store.set("kc:key", String(k || "").trim()); }
export function keyFromUrl() {
  try {
    const u = new URL(location.href); const k = u.searchParams.get("key");
    if (k) { setKey(k); u.searchParams.delete("key"); history.replaceState(null, "", u.pathname + (u.search || "") + u.hash); toast("Poppy connected"); }
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
    trialStart: trial.ends ? minus(trial.ends, 7) : "", renews: renew.at || trial.ends || "", renewAmount: renew.amount || "", offerId: "renew",
    join: c.join || "", notOnCalendar: !!c.notOnCalendar, channel: c.channel || "", sop: c.sop || [],
    brief: { problem: notes.problem || "", flags: brief.flags || [], lines: brief.lines || [] },
    sections, open: {},
  };
}
