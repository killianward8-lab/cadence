import { h, S, save, render, setTab, setCall, uid, todayISO, field, seg, copy, toast, store } from "./core.js";

// Pre-call briefs live in this browser only (kc:calls). Nothing here goes to the repo.
// Shape: see tools/PREP.md. Claude can generate a day's briefs from Poppy and paste them in.

export const blankCall = () => ({
  id: uid(), date: todayISO(), time: "", type: "Group onboarding", name: "", email: "", phone: "", bio: "", calendar: "", instagram: "",
  confirmed: "unknown", score: "", late: false, trialStart: "", renews: "", offerId: "renew",
  sections: { confirmed: "", reach: "", who: "", putOut: "", usePoppy: "", close: "", soFar: "" }, open: {},
});

export function renderPrecall() {
  const view = store.get("kc:pcview", "cards");
  const calls = [...S.calls].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = calls.filter(c => c.date === todayISO());
  const confirmedN = today.filter(c => c.confirmed === "yes").length;

  const head = h("div", { class: "pc-head" },
    h("div", {}, h("h1", { class: "big" }, "Pre-call"), h("div", { class: "sub" }, today.length ? `${confirmedN} of ${today.length} confirmed today` : "No calls loaded for today")),
    h("div", { class: "row" },
      seg([["sheet", "Sheet"], ["cards", "Cards"]], view, (v) => { store.set("kc:pcview", v); render(); }),
      h("button", { class: "pill", onclick: () => { S.calls.push(blankCall()); save(); render(); } }, "+ Add a call"),
      h("button", { class: "pill", onclick: pasteBrief }, "Paste a brief"),
      S.calls.length ? h("button", { class: "pill", onclick: () => { if (confirm("Clear every call from this browser?")) { S.calls = []; save(); render(); } } }, "Clear") : null));

  const wrap = h("div", { class: "precall" }, head);
  if (!calls.length) {
    wrap.append(h("div", { class: "card note" },
      h("b", {}, "How calls get here"), h("p", {}, "This page can't see Poppy's calendar on its own. Ask Claude to \"prep today's calls\": it pulls the bookings and the background from Poppy, writes the briefs, and drops them in here. Or add a call by hand and fill the sections yourself."),
      h("p", {}, "Everything on this tab stays in this browser. Nothing is sent anywhere.")));
    return wrap;
  }
  let day = null;
  for (const c of calls) {
    if (c.date !== day) { day = c.date; wrap.append(h("div", { class: "eyebrow day" }, day === todayISO() ? "Today" : day)); }
    wrap.append(view === "sheet" ? sheetRow(c) : card(c));
  }
  return wrap;
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

const CONF = { yes: ["Confirmed", "ok"], no: ["Not confirmed", "bad"], unknown: ["Unknown", ""] };
const update = (c, patch) => { Object.assign(c, patch); save(); render(); };
const toDeck = (c) => { setCall({ id: c.id, name: c.name, email: c.email, trialStart: c.trialStart, renews: c.renews, offerId: c.offerId || "renew", mode: /group/i.test(c.type) ? "group" : "one" }); setTab("deck"); };

function sheetRow(c) {
  return h("div", { class: "pc-row" },
    h("b", {}, c.time || "—"), h("span", { class: "type" }, c.type),
    h("span", { class: "name" }, c.name || "(no name)", h("small", {}, c.bio)),
    h("span", { class: "st " + CONF[c.confirmed][1] }, CONF[c.confirmed][0]),
    h("span", { class: "muted" }, c.sections.who || ""),
    h("button", { class: "chip small", onclick: () => toDeck(c) }, "deck →"));
}

function card(c) {
  const sec = S.deck.precall.sections;
  const editing = !!c.editing;
  const top = h("div", { class: "pc-top" },
    h("div", { class: "when" }, editing ? h("input", { class: "inline", value: c.time, placeholder: "9pm", onchange: (e) => update(c, { time: e.target.value }) }) : h("b", {}, c.time || "—"),
      editing ? h("select", { onchange: (e) => update(c, { type: e.target.value }) }, S.deck.precall.types.map(t => h("option", { value: t, selected: t === c.type }, t))) : h("small", {}, c.type)),
    h("div", { class: "whom" },
      editing ? h("input", { class: "inline big", value: c.name, placeholder: "Name", onchange: (e) => update(c, { name: e.target.value }) }) : h("h3", {}, c.name || "(no name)"),
      editing ? h("input", { class: "inline", value: c.bio, placeholder: "One line about them", onchange: (e) => update(c, { bio: e.target.value }) }) : h("div", { class: "muted" }, c.bio),
      editing ? h("input", { class: "inline", value: c.calendar, placeholder: "Calendar title", onchange: (e) => update(c, { calendar: e.target.value }) }) : c.calendar ? h("div", { class: "muted small" }, "📅 " + c.calendar) : null,
      h("div", { class: "row tight" },
        editing ? h("input", { class: "inline", value: c.instagram, placeholder: "Instagram URL", onchange: (e) => update(c, { instagram: e.target.value }) })
          : c.instagram ? h("a", { class: "chip small", href: c.instagram, target: "_blank", rel: "noreferrer" }, "Instagram") : null,
        editing ? h("input", { class: "inline", value: c.email, placeholder: "email", onchange: (e) => update(c, { email: e.target.value }) }) : null,
        editing ? h("input", { class: "inline", value: c.phone, placeholder: "phone", onchange: (e) => update(c, { phone: e.target.value }) }) : null,
        editing ? h("input", { class: "inline", type: "date", value: c.date, onchange: (e) => update(c, { date: e.target.value }) }) : null,
        editing ? h("input", { class: "inline", type: "date", value: c.trialStart, title: "trial started", onchange: (e) => update(c, { trialStart: e.target.value }) }) : null,
        editing ? h("input", { class: "inline", type: "date", value: c.renews, title: "renews", onchange: (e) => update(c, { renews: e.target.value }) }) : null)),
    h("div", { class: "pc-right" },
      seg([["yes", "Confirmed"], ["no", "Not confirmed"], ["unknown", "?"]], c.confirmed, (v) => update(c, { confirmed: v }), "small"),
      h("button", { class: "chip small" + (c.late ? " on" : ""), onclick: () => update(c, { late: !c.late }) }, c.late ? "⏰ Late, texted" : "They're late?"),
      h("button", { class: "chip small", onclick: () => update(c, { editing: !editing }) }, editing ? "Done" : "Edit"),
      h("button", { class: "chip small danger", onclick: () => { if (confirm(`Remove ${c.name || "this call"}?`)) { S.calls = S.calls.filter(x => x.id !== c.id); save(); render(); } } }, "×")));

  const rows = sec.map(s => {
    const v = c.sections[s.id] || "";
    const open = !!c.open[s.id] || editing;
    const first = v.split("\n")[0];
    return h("div", { class: "pc-sec" + (open ? " open" : "") },
      h("button", { class: "pc-sh", onclick: () => { c.open[s.id] = !c.open[s.id]; save(); render(); } }, h("span", { class: "tri" }, open ? "▾" : "▸"), s.emoji + " ", h("span", { class: "sect" }, s.title),
        !open ? h("span", { class: "muted one" }, first || "—") : null),
      open ? (editing
        ? h("textarea", { class: "edit", rows: 3, placeholder: s.title, onchange: (e) => { c.sections[s.id] = e.target.value; save(); } }, v)
        : h("div", { class: "pc-body" }, v || h("span", { class: "muted" }, "—"), v && s.id === "reach" ? h("button", { class: "cp", onclick: () => copy(v) }, "⧉") : null)) : null);
  });

  const foot = h("div", { class: "row" },
    h("button", { class: "openDeck", onclick: () => toDeck(c) }, "Open the deck →"),
    c.email ? h("span", { class: "muted small" }, c.email, c.phone ? " · " + c.phone : "") : null);

  return h("article", { class: "pc-card " + CONF[c.confirmed][1] }, top, rows, foot);
}
