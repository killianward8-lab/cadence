import { h, S, save, render, setTab, setCall, uid, todayISO, copy, toast, store } from "./core.js";
import { hasKey, setKey, live, refreshCalls } from "./poppy.js";
import { pickCall } from "./deck.js";

// Pre-call briefs live in this browser only (kc:calls). Live ones come from Poppy (poppy.js).
export const blankCall = () => ({
  id: uid(), date: todayISO(), time: "", type: "Group onboarding", name: "", email: "", phone: "", bio: "", calendar: "", instagram: "",
  confirmed: "unknown", score: "", late: false, trialStart: "", renews: "", offerId: "renew",
  sections: { confirmed: "", reach: "", who: "", putOut: "", usePoppy: "", close: "", soFar: "" }, open: {},
});
const update = (c, patch) => { Object.assign(c, patch); save(); render(); };
const toDeck = (c) => { pickCall(c); setTab("deck"); };
const dayLabel = (d) => { const t = todayISO(); if (d === t) return "Today"; const tm = new Date(t + "T12:00:00"); tm.setDate(tm.getDate() + 1); return d === tm.toISOString().slice(0, 10) ? "Tomorrow" : d; };

export function renderPrecall() {
  const view = store.get("kc:pcview", "cards");
  const calls = [...S.calls].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = calls.filter(c => c.date === todayISO());
  const confirmedN = today.filter(c => c.confirmed === "yes").length;
  if (hasKey() && !live.busy && !live.error && Date.now() - live.at > 10 * 60e3) refreshCalls().then(ok => ok && render());
  const ago = live.at ? Math.max(0, Math.round((Date.now() - live.at) / 60e3)) : null;
  const status = !hasKey() ? "not connected to Poppy" : live.busy ? "checking Poppy…" : live.error ? live.error : `live · ${ago < 1 ? "just now" : ago + " min ago"}`;

  const top = h("div", { class: "pc-top" },
    h("div", {}, h("h1", {}, "Pre-call"), h("p", {}, today.length ? `${confirmedN} of ${today.length} confirmed` : "No calls today", " · ", h("span", { class: live.error ? "bad" : "" }, status))),
    h("div", { class: "pc-headr" },
      h("div", { class: "pc-seg" }, h("button", { class: view === "sheet" ? "on" : "", onclick: () => { store.set("kc:pcview", "sheet"); render(); } }, "Sheet"), h("button", { class: view === "cards" ? "on" : "", onclick: () => { store.set("kc:pcview", "cards"); render(); } }, "Cards")),
      hasKey() ? h("button", { class: "pc-refresh", disabled: live.busy, onclick: async () => { render(); await refreshCalls(true); render(); toast(live.error || "Updated from Poppy"); } }, "Check again")
        : h("button", { class: "pc-refresh", onclick: connect }, "Connect Poppy"),
      h("button", { class: "pc-refresh ghost", onclick: () => { S.calls.push(blankCall()); save(); render(); } }, "+ Add"),
      h("button", { class: "pc-refresh ghost", onclick: pasteBrief }, "Paste a brief")));

  const wrap = h("div", { class: "pc" }, top);
  if (!calls.length) {
    wrap.append(h("section", { class: "pc-day" }, h("div", { class: "pc-empty" },
      h("b", {}, hasKey() ? "No calls on Poppy for the next days" : "Connect Poppy to see your calls"),
      h("p", {}, hasKey() ? "When bookings land they show up here, with the brief. Hit Check again any time." : "Click Connect Poppy and paste your machine key once. It stays in this browser. Then today's calls, trial dates, reach-out drafts and the brief load straight from Poppy."))));
    return wrap;
  }
  let day = null, sec = null;
  for (const c of calls) {
    if (c.date !== day) { day = c.date; sec = h("section", { class: "pc-day" }, h("h2", {}, dayLabel(day))); wrap.append(sec); if (view === "sheet") sec.append(sheet(calls.filter(x => x.date === day))); }
    if (view === "cards") sec.append(card(c));
  }
  return wrap;
}

function connect() {
  const k = prompt("Paste your Poppy machine key (it stays in this browser):");
  if (k == null) return;
  setKey(k); live.at = 0;
  if (!k.trim()) { toast("Disconnected"); render(); return; }
  render(); refreshCalls(true).then(() => { render(); toast(live.error || "Connected to Poppy"); });
}
function pasteBrief() {
  const txt = prompt("Paste the brief JSON (one call or a list of calls):");
  if (!txt) return;
  try {
    let v = JSON.parse(txt); if (!Array.isArray(v)) v = [v];
    for (const raw of v) {
      const c = Object.assign(blankCall(), raw); c.sections = Object.assign(blankCall().sections, raw.sections || {});
      const i = S.calls.findIndex(x => (c.email && x.email === c.email && x.date === c.date) || x.id === c.id);
      if (i >= 0) S.calls[i] = Object.assign(S.calls[i], c, { id: S.calls[i].id }); else S.calls.push(c);
    }
    save(); render(); toast(`${v.length} call${v.length === 1 ? "" : "s"} loaded`);
  } catch { toast("That wasn't valid JSON"); }
}

const tone = (c) => c.confirmed === "yes" ? "tone-g" : c.confirmed === "no" ? "tone-r" : "";
const typeShort = (t) => /group/i.test(t) ? "Group" : /1-on-1/i.test(t) ? "1-on-1" : /clos/i.test(t) ? "Closing" : "Set";
const typeCls = (t) => /group/i.test(t) ? "t-group" : /1-on-1/i.test(t) ? "t-ob" : /clos/i.test(t) ? "t-close" : "t-set";

function sheet(rows) {
  return h("div", { class: "oc-wrap" }, h("table", { class: "fixed oc-table pcs-table" },
    h("colgroup", {}, ["80px", "300px", "110px", "160px", "", "120px"].map(w => h("col", { style: w ? `width:${w}` : "" }))),
    h("thead", {}, h("tr", {}, ["When", "Who", "Type", "Confirmed", "Who they are", ""].map(t => h("th", {}, t)))),
    h("tbody", {}, rows.map(c => h("tr", { class: "row pcs " + tone(c) },
      h("td", { class: "num" }, c.time || "—"),
      h("td", { class: "name pcs-name" }, h("b", {}, c.name || "(no name)"), c.email ? h("small", { title: "click to copy", onclick: () => copy(c.email) }, c.email) : null),
      h("td", {}, h("span", { class: "pill type " + typeCls(c.type) }, typeShort(c.type))),
      h("td", {}, h("span", { class: "pill " + (c.confirmed === "yes" ? "won" : c.confirmed === "no" ? "dead" : "ghost") }, c.score ? `${c.score} · ${c.confirmed}` : c.confirmed)),
      h("td", { class: "dimtxt", title: c.sections.who || "" }, (c.sections.who || "").split("\n")[0]),
      h("td", {}, h("button", { class: "pc-refresh ghost", onclick: () => toDeck(c) }, "deck →")))))));
}

function card(c) {
  const sec = S.deck.precall.sections;
  const editing = !!c.editing;
  const social = [];
  if (c.instagram) social.push(h("a", { href: c.instagram, target: "_blank", rel: "noreferrer", title: "Instagram" }, h("img", { src: "https://getpoppy.ai/logos/icons8-instagram-144.png", alt: "" }), "Instagram"));
  const head = h("header", { class: "pc-head" },
    h("div", { class: "pc-when" },
      editing ? h("input", { class: "cd-efield", value: c.time, placeholder: "9pm", onchange: (e) => update(c, { time: e.target.value }) }) : h("b", {}, c.time || "—"),
      editing ? h("select", { class: "cd-efield sel", onchange: (e) => update(c, { type: e.target.value }) }, S.deck.precall.types.map(t => h("option", { value: t, selected: t === c.type }, t))) : h("span", {}, c.type)),
    h("div", { class: "pc-who" },
      editing ? h("input", { class: "cd-efield big", value: c.name, placeholder: "Name", onchange: (e) => update(c, { name: e.target.value }) }) : h("h3", {}, c.name || "(no name)"),
      editing ? h("input", { class: "cd-efield", value: c.bio, placeholder: "One line about them", onchange: (e) => update(c, { bio: e.target.value }) }) : c.bio ? h("p", {}, c.bio) : null,
      editing ? h("input", { class: "cd-efield", value: c.calendar, placeholder: "Calendar title", onchange: (e) => update(c, { calendar: e.target.value }) }) : c.calendar ? h("p", { class: "pc-cal" }, "📅 " + c.calendar) : null,
      editing ? h("div", { class: "pc-editrow" },
        h("input", { class: "cd-efield", value: c.instagram, placeholder: "Instagram URL", onchange: (e) => update(c, { instagram: e.target.value }) }),
        h("input", { class: "cd-efield", value: c.email, placeholder: "email", onchange: (e) => update(c, { email: e.target.value }) }),
        h("input", { class: "cd-efield", value: c.phone, placeholder: "phone", onchange: (e) => update(c, { phone: e.target.value }) }),
        h("input", { class: "cd-efield", type: "date", value: c.date, onchange: (e) => update(c, { date: e.target.value }) }),
        h("input", { class: "cd-efield", type: "date", value: c.trialStart, title: "trial started", onchange: (e) => update(c, { trialStart: e.target.value }) }),
        h("input", { class: "cd-efield", type: "date", value: c.renews, title: "renews", onchange: (e) => update(c, { renews: e.target.value }) }))
        : social.length ? h("div", { class: "pc-social" }, social) : null),
    h("div", { class: "pc-headr" },
      h("div", { class: "pc-status " + (c.confirmed === "yes" ? "yes" : c.confirmed === "no" ? "no" : ""), onclick: () => update(c, { confirmed: c.confirmed === "yes" ? "no" : c.confirmed === "no" ? "unknown" : "yes" }), title: "tap to change" }, c.confirmed === "yes" ? "Confirmed" : c.confirmed === "no" ? "Not confirmed" : "Unknown"),
      h("button", { class: "pc-nsbtn" + (c.late ? " on" : " live"), onclick: () => update(c, { late: !c.late }) }, c.late ? "⏰ Late, texted" : "They're late?"),
      h("button", { class: "pc-nsbtn", onclick: () => update(c, { editing: !editing }) }, editing ? "Done" : "Edit"),
      !c.live ? h("button", { class: "pc-nsbtn", onclick: () => { if (confirm(`Remove ${c.name || "this call"}?`)) { S.calls = S.calls.filter(x => x.id !== c.id); save(); render(); } } }, "×") : null));

  const secs = sec.map(s => {
    const v = c.sections[s.id] || "";
    const open = !!c.open[s.id] || editing;
    const first = v.split("\n")[0];
    const el = h("div", { class: "pc-sec" + (s.id === "reach" ? " pc-act" : "") + (open ? "" : " closed") },
      h("h4", { onclick: () => { c.open[s.id] = !c.open[s.id]; save(); render(); } }, h("i", {}, open ? "▾" : "▸"), h("b", { class: "pc-ico" }, s.emoji), h("span", { class: "pc-ttl" }, s.title), !open ? h("small", {}, first || "—") : null));
    if (open) {
      if (editing) el.append(h("textarea", { class: "cd-efield", rows: 3, placeholder: s.title, onchange: (e) => { c.sections[s.id] = e.target.value; save(); } }, v));
      else if (s.id === "reach" && v) {
        const parts = v.split(/\n\n+/);
        el.append(h("div", { class: "pc-drafts" }, parts.map(p => {
          const text = p.replace(/^(Text|Email):\s*/i, ""); const isText = /^Text:/i.test(p);
          return h("div", { class: "pc-draft" }, h("small", {}, isText ? "Text" : /^Email:/i.test(p) ? "Email" : "Draft"), h("p", {}, text),
            h("div", { class: "pc-btns" },
              isText && c.phone ? h("a", { class: "ghost", href: `sms:${c.phone}&body=${encodeURIComponent(text)}` }, "Open in Messages") : null,
              isText && c.phone ? h("a", { class: "ghost", href: `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, target: "_blank", rel: "noreferrer" }, "Open in WhatsApp") : null,
              !isText && c.email ? h("a", { class: "ghost", href: `mailto:${c.email}?subject=${encodeURIComponent("Today")}&body=${encodeURIComponent(text)}` }, "Open in Mail") : null,
              h("button", { onclick: () => copy(text) }, "Copy")));
        })));
      } else el.append(h("p", {}, v || "—"));
    }
    return el;
  });

  const foot = h("footer", { class: "pc-foot" },
    h("button", { onclick: () => toDeck(c) }, "Open the deck →"),
    c.join ? h("a", { href: "#", onclick: (e) => { e.preventDefault(); copy(c.join, "Room link copied"); } }, "Copy the room link") : null,
    c.email || c.phone ? h("span", {}, [c.email, c.phone].filter(Boolean).join(" · ")) : null);
  return h("article", { class: "pc-card " + tone(c) }, head, secs, foot);
}
