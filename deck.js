import { h, $, S, content, save, render, setTab, setCall, offer, coachName, dealPrice, planMonths, money, fmtDay, firstName, todayISO, field, seg, copy, toast, eyebrow, uid } from "./core.js";
import { hasKey, findCard, chargeCard, makeLink, isOb, clean } from "./poppy.js";
import { renderSlide as renderMoSlide, slideList, slideId, step, jump } from "./slides.js";

export const SLIDES = [
  { id: "cover", label: "Cover" }, { id: "offer", label: "Offer" }, { id: "pay", label: "Pay" }, { id: "gameplan", label: "Gameplan" }, { id: "review", label: "Review" },
];

// ---------- deck tab ----------
export function renderDeck() {
  const d = S.deck, c = S.call, o = offer();
  const P = S.practice;
  const price = dealPrice();
  const f = (label, key, type = "text", ph = "") => h("label", { class: "cl-f" }, h("small", {}, label), h("input", { type, value: c[key] || "", placeholder: ph, onchange: (e) => setCall({ [key]: e.target.value }) }));
  const moneyF = (label, key, val, ph = "") => h("label", { class: "cl-f money" }, h("small", {}, label), h("i", {}, "$"), h("input", { inputmode: "numeric", value: val, placeholder: ph, onchange: (e) => setCall({ [key]: e.target.value }) }));

  // 1 · your calls (or the practice call)
  const upcoming = [...S.calls].filter(x => x.date >= todayISO()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 8);
  const days = [...new Set(upcoming.map(x => x.date))];
  const dayLabel = (dt) => { const t = todayISO(); if (dt === t) return "Today"; const tm = new Date(t + "T12:00:00"); tm.setDate(tm.getDate() + 1); return dt === tm.toISOString().slice(0, 10) ? "Tomorrow" : dt; };
  const kind = (t) => /group/i.test(t) ? ["group", "Group OB"] : /1-on-1/i.test(t) ? ["ob", "1-on-1 OB"] : /clos/i.test(t) ? ["close", "Closing"] : ["set", "Set"];
  const step1 = h("section", { class: "cl-card step" }, h("h3", {}, h("i", {}, "1"), P ? "Practice call" : "Your calls"),
    P ? h("div", { class: "cl-prac" },
      h("p", {}, "A made-up group call. Run the whole close: offer, bonuses, pay, celebrate. Test money only, nobody real is charged, emailed or logged."),
      h("div", { class: "who" }, d.practice.people.map(pp => h("span", {}, pp.name))),
      h("p", { class: "card" }, "Fake card: ", h("b", {}, d.practice.card)),
      h("button", { class: "lnk", onclick: startPractice }, "↺ Start the practice call over"))
    : [h("div", { class: "cl-search" }, h("span", {}, "🔎"), h("input", { placeholder: "Search your calls, or anyone by name or email", value: S.callQ || "", oninput: (e) => { S.callQ = e.target.value; render(); } })),
      h("div", { class: "cl-calls" }, days.length ? days.map(dt => h("div", { class: "cl-day" }, h("small", {}, dayLabel(dt)),
        upcoming.filter(x => x.date === dt && (!S.callQ || (x.name + " " + x.email).toLowerCase().includes(S.callQ.toLowerCase()))).map(x => {
          const [k, kl] = kind(x.type);
          return h("button", { class: "cl-callrow" + (x.id === c.id ? " on" : ""), onclick: () => { setCall({ id: x.id, name: x.name, email: x.email, phone: x.phone || "", trialStart: x.trialStart, renews: x.renews, offerId: x.offerId || c.offerId, mode: /group/i.test(x.type) ? "group" : "one", paidNow: false, party: false, payUrl: "", payErr: "", payNote: "", payFix: false, cardInfo: null, cardFor: "", showLinks: false, linkTried: false }); lookupCard(); } },
            h("span", { class: "t" }, h("b", {}, x.time || "—"), h("i", { class: "kind " + k }, kl)),
            h("span", { class: "who" }, h("b", {}, x.name || "(no name)"), h("em", {}, x.email || "")),
            h("span", { class: "st" }, h("i", { class: "go" }, x.id === c.id ? "on deck" : "prep →")));
        })))
        : h("p", { class: "cl-hint" }, hasKey() ? "No calls loaded yet. Pre-call → Check again." : "Connect Poppy (○ Poppy, top right) and your calls show up here."))]);

  // 2 · the call
  const step2 = h("section", { class: "cl-card step" }, h("h3", {}, h("i", {}, "2"), "The call"),
    h("div", { class: "cl-tq" + (c.name ? " has" : "") }, h("span", { class: "dot" + (c.name ? " on" : "") }), h("span", { class: "m" }, h("b", {}, c.name ? `${c.name}${c.email ? " · " + c.email : ""}` : "No call picked yet"), h("em", {}, c.name ? `${c.mode === "group" ? "Group" : "1-on-1"}${c.trialStart ? " · trial started " + fmtDay(c.trialStart) : ""}${c.renews ? " · renews " + fmtDay(c.renews) : ""}` : "pick one above, or type it in"))),
    h("div", { class: "cl-row" }, f("Their name", "name", "text", "First name"), f("Email", "email", "text", "optional")),
    h("div", { class: "cl-row" }, f("Trial started", "trialStart", "date"), f("Renews on", "renews", "date")),
    h("label", { class: "cl-f" }, h("small", {}, "The deal, in your words"), h("textarea", { rows: 2, placeholder: "VCS at 8k with Malu, she needs her course built, already paid 997", onchange: (e) => setCall({ deal: e.target.value }) }, c.deal || "")),
    h("div", { class: "cl-under" }, h("span", { class: "ok" }, "✓ Deck ready · 5 slides"), h("span", { class: "lnk dim" }, "lines you write show on the Offer slide as \"For you\"")));

  // 3 · the deal
  const full = c.list !== "" && c.list != null ? c.list : o.list;
  const today = c.today !== "" && c.today != null ? c.today : o.today;
  const step3 = h("section", { class: "cl-card step" }, h("h3", {}, h("i", {}, "3"), "The deal"),
    h("label", { class: "cl-f" }, h("small", {}, "Presentation"), h("div", { class: "cl-seg" },
      h("button", { class: c.mode === "group" ? "on" : "", onclick: () => setCall({ mode: "group" }) }, "Group · generic, share the screen"),
      h("button", { class: c.mode === "one" ? "on" : "", onclick: () => setCall({ mode: "one" }) }, "1-on-1 · their info on the slides"))),
    h("label", { class: "cl-f" }, h("small", {}, "Offer"), h("select", { onchange: (e) => setCall({ offerId: e.target.value, list: "", today: "", paid: "" }) }, content().offers.map(x => h("option", { value: x.id, selected: x.id === o.id }, x.name)))),
    h("div", { class: "cl-row" }, moneyF("Full price", "list", full), moneyF("Paid", "paid", c.paid || "", "0"), moneyF("Today", "today", today)),
    h("div", { class: "cl-line" }, h("label", { class: "cl-check" }, h("input", { type: "checkbox", checked: +today === +full, onchange: (e) => setCall({ today: e.target.checked ? full : o.today }) }), " Full price today"), h("b", {}, `${money(price.due)} today`)),
    h("label", { class: "cl-f" }, h("small", {}, "Pay plan"), h("div", { class: "cl-seg" }, Object.entries(d.plans).map(([id, pl]) => h("button", { class: c.payPlan === id ? "on" : "", onclick: () => setCall({ payPlan: id }) }, pl.label)))),
    moneyBlock());

  // 4 · log the call
  const step4 = h("section", { class: "cl-card step cl-log" }, h("h3", {}, h("i", {}, "4"), "Log the call"),
    h("p", { class: "cl-hint" }, "Who showed, what happened, what's next. Kept in this browser, and a line you can paste into the tracker."),
    h("div", { class: "cl-seg wrap" }, d.outcomes.map(x => h("button", { class: c.outcome === x ? "on" : "", onclick: () => setCall({ outcome: x }) }, x))),
    h("div", { class: "cl-row" }, moneyF("Cash collected", "cc", c.cc || "", "0"), f("Follow-up date", "fu", "date")),
    h("label", { class: "cl-f" }, h("small", {}, "Note"), h("textarea", { rows: 2, placeholder: "What held them back, what you promised", onchange: (e) => setCall({ note: e.target.value }) }, c.note || "")),
    h("div", { class: "cl-under" }, h("button", { class: "cl-go", disabled: P, onclick: logCall }, P ? "Not logged in practice" : "Log it"), h("button", { class: "lnk", onclick: () => copy(logLine(), "Copied for the tracker") }, "copy a line")),
    S.log.length ? h("div", { class: "cl-loglist" }, S.log.slice(-5).reverse().map(l => h("small", {}, l))) : null);

  const left = h("div", { class: "cl-side" }, step1, step2, step3, step4);

  const brief = S.calls.find(x => x.id === c.id);
  const hasBrief = brief && (brief.sections.close || brief.sections.putOut);
  const briefOpen = !!S.briefOpen;
  const before = hasBrief ? h("section", { class: "cl-card brief" + (briefOpen ? "" : " closed") },
    h("h3", { class: "cl-fold", onclick: () => { S.briefOpen = !briefOpen; render(); } }, h("i", {}, briefOpen ? "▾" : "▸"), "Before you join", h("small", {}, [brief.brief && brief.brief.problem ? "problem" : "", brief.brief && brief.brief.flags.length ? `${brief.brief.flags.length} flags` : "", brief.sections.who ? brief.sections.who.split("\n")[0] : ""].filter(Boolean).join(" · "))),
    briefOpen ? h("div", { class: "cl-briefbody" }, h("p", {}, h("b", {}, "The problem: "), brief.sections.putOut), h("p", {}, h("b", {}, "To close: "), brief.sections.close)) : null) : null;

  const labels = { cover: "cover", offer: "offer", pay: "pay", gameplan: "gameplan", celebrate: "celebrate", review: "review" };
  const right = h("div", { class: "cl-main" },
    before,
    h("div", { class: "cl-bar" },
      h("div", { class: "cl-thumbs" }, slideList().map((id, i) => h("button", { class: i === S.slide ? "on" : "", onclick: () => jump(i) }, labels[id]))),
      h("button", { class: "cl-present", onclick: openPresent }, "▶ Present")),
    c.mode === "one" && !c.name ? h("p", { class: "cl-notes" }, h("b", {}, "Standard pitch: "), "no name yet, so the slides use your standard version. Fill in the call to make it theirs.") : null,
    h("div", { class: "dk-frame", onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); step(e.clientX - r.left > r.width / 2 ? 1 : -1); } }, renderMoSlide(S.slide)),
    h("p", { class: "cl-notes" }, h("b", {}, "Say it: "), d.sayIt[slideId()] || ""));
  return h("div", { class: "cl-grid" }, left, right);
}

// ---------- money (card on file, charge, link) ----------
export const cardInfo = () => (S.call.cardInfo && S.call.cardFor === clean(S.call.email)) ? S.call.cardInfo : null;
export async function lookupCard() {
  const c = S.call; if (!hasKey() || !c.email) return;
  setCall({ cardBusy: true, payErr: "" });
  try { const info = await findCard({ email: c.email, name: c.name, ob: isOb(offer()) }); setCall({ cardInfo: info, cardFor: clean(c.email), card: !!info.has, cardBusy: false }); }
  catch (e) { setCall({ cardInfo: { has: false, error: String(e.message || e) }, cardFor: clean(c.email), cardBusy: false }); }
}
export async function charge() {
  const c = S.call, o = offer(), price = dealPrice();
  if (!hasKey()) return toast("Connect Poppy first");
  if (c.payPlan !== "full") return toast("Payment plans go through a Whop link, not the card. Make the link.");
  if (!c.email) return toast("Add their email first");
  if (!confirm(`Charge ${money(price.due)} to the card on file for ${c.email}?${S.practice ? " (Practice: nothing is charged)" : ""}`)) return;
  setCall({ payBusy: true, payErr: "", chargeStep: 0, payFix: false });
  try {
    const r = await chargeCard({ offer: o, email: c.email, name: c.name, amount: price.due, card: cardInfo() });
    if (r.ok) { setTimeout(() => { setCall({ payBusy: false, paidNow: true, party: true, paidHow: r.practice ? "practice, nothing charged" : "card on file", payErr: "" }); toast(r.practice ? "Practice: charge skipped" : "Paid ✓"); }, 1500); }
    else { setCall({ payBusy: false, payErr: r.error || "Card declined", payUrl: r.fix || c.payUrl, payFix: !!r.fix }); toast(r.error || "Declined"); }
  } catch (e) { setCall({ payBusy: false, payErr: String(e.message || e) }); }
}
export async function link() {
  const c = S.call, o = offer(), price = dealPrice();
  if (!hasKey()) return toast("Connect Poppy first");
  setCall({ linkBusy: true, payErr: "" });
  try {
    const months = S.deck.plans[c.payPlan] ? S.deck.plans[c.payPlan].months : 1;
    const r = await makeLink({ offer: o, email: c.mode === "group" && !c.email ? "" : c.email, name: c.name, amount: price.due, processor: months > 1 ? "whop" : "stripe", how: months > 1 ? String(months) : "full", note: c.payPlan === "clarity" ? "pick Clarity Pay at checkout" : "" });
    setCall({ linkBusy: false, payUrl: r.url, payNote: r.note || "", payFix: false }); toast("Link on the pay slide");
  } catch (e) { setCall({ linkBusy: false, payErr: String(e.message || e) }); }
}
function moneyBlock() {
  const c = S.call, ci = cardInfo(), live = hasKey();
  return h("div", { class: "cl-money" },
    h("label", { class: "cl-f" }, h("small", {}, "Card on file"),
      live ? h("div", { class: "cl-line" },
        c.cardBusy ? h("span", { class: "dim" }, "Looking in Stripe…")
          : ci ? (ci.has ? h("span", { class: "ok" }, "💳 " + (ci.label || "card on file") + (ci.trialing ? ` · trial day ${ci.day}` : "")) : h("span", { class: "bad" }, ci.error ? ci.error : "No card on file"))
          : h("span", { class: "dim" }, c.email ? "Not checked yet" : "Add their email"),
        h("button", { class: "lnk", disabled: !c.email || c.cardBusy, onclick: lookupCard }, ci ? "check again" : "find the card"))
      : h("div", { class: "cl-seg" }, h("button", { class: c.card ? "on" : "", onclick: () => setCall({ card: true }) }, "Yes"), h("button", { class: !c.card ? "on" : "", onclick: () => setCall({ card: false }) }, "No"))),
    live ? h("div", { class: "cl-row" },
      h("button", { class: "cl-go ghost", disabled: c.linkBusy, onclick: link }, c.linkBusy ? "Making the link…" : "🔗 Make the link"),
      h("button", { class: "cl-go", disabled: c.payBusy || c.paidNow, onclick: charge }, c.payBusy ? "Charging…" : c.paidNow ? "Paid ✓" : "💳 Charge the card")) : null,
    c.payErr ? h("p", { class: "cl-hint bad" }, c.payErr) : null,
    c.payNote ? h("p", { class: "cl-hint" }, c.payNote) : null,
    h("label", { class: "cl-f" }, h("small", {}, "Pay link"), h("input", { value: c.payUrl || "", placeholder: live ? "Make the link, or paste one" : "https://…", onchange: (e) => setCall({ payUrl: e.target.value, payFix: false, payNote: "" }) })));
}

function startPractice() {
  const p = S.deck.practice.people[0];
  const t = new Date(); const start = new Date(t); start.setDate(t.getDate() - 4); const renew = new Date(t); renew.setDate(t.getDate() + 3);
  setCall({ id: "practice", name: firstName(p.name), email: p.email, trialStart: start.toISOString().slice(0, 10), renews: renew.toISOString().slice(0, 10), offerId: "renew", payPlan: "full", mode: "group", deal: "", list: "", paid: "", today: "", paidNow: false, party: false, outcome: "", cc: "", fu: "", note: "", payUrl: "", payErr: "", payNote: "", payFix: false, cardInfo: null, cardFor: "" });
  S.slide = 0; toast("Practice call ready");
}
export function togglePractice() {
  S.practice = !S.practice; save();
  if (S.practice) startPractice(); else { setCall({ id: "", name: "", email: "", trialStart: "", renews: "", paidNow: false, party: false }); }
  render();
}
const logLine = () => {
  const c = S.call, o = offer();
  return `${todayISO()} · ${c.name || "(no name)"}${c.email ? " <" + c.email + ">" : ""} · ${c.outcome || "no outcome"} · ${o.name} · CC ${money(+c.cc || 0)}${c.fu ? " · FU " + c.fu : ""}${c.note ? " · " + c.note : ""}`;
};
function logCall() {
  if (!S.call.outcome) return toast("Pick an outcome first");
  S.log.push(logLine()); save(); render(); toast("Logged in this browser");
}
export function planSeg() {
  return seg(Object.entries(S.deck.plans).map(([id, p]) => [id, p.label, "key " + p.key]), S.call.payPlan, (id) => setCall({ payPlan: id }));
}
export function offerSeg() {
  return seg(content().offers.map(x => [x.id, S.deck.short[x.id] || x.name, x.name + " · " + money(x.today)]), S.call.offerId, (id) => setCall({ offerId: id, list: "", today: "" }));
}

// ---------- slides ----------
export function renderSlide(i) {
  const o = offer(), d = S.deck, c = S.call;
  const named = c.mode === "one" && c.name;
  const nm = named ? firstName(c.name) : "";
  const who = named ? `${nm} × Poppy` : "Poppy";
  const price = dealPrice();
  const head = [h("div", { class: "poppy" }, "🐷 Poppy"), h("div", { class: "who" }, who)];
  const id = SLIDES[i].id;
  const renew = content().offers.find(x => x.id === "renew");
  if (c.party) return h("div", { class: "slide party" }, head, h("div", { class: "confetti", "data-confetti": "1" }), h("div", { class: "eyebrow" }, nm ? `${nm}, welcome in` : "Welcome in"),
    h("h2", {}, d.celebrate.title), h("div", { class: "note" }, d.celebrate.sub));
  if (id === "cover") {
    const trial = o.deck === "ob";
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, (nm ? nm + ", " : "") + d.cover.eyebrow.toLowerCase()),
      h("h2", {}, trial ? (nm ? d.cover.trialNamed.replace("{name}", nm) : d.cover.trial) : (nm ? `${nm}, ${d.cover.other.toLowerCase()}` : d.cover.other)),
      trial ? h("div", { class: "stats" },
        stat("Trial started", fmtDay(c.trialStart)), stat("Renews", fmtDay(c.renews)), stat("Renews at", renew ? `${money(renew.list)} for the year` : "")) : null,
      h("div", { class: "gold" }, d.cover.next));
  }
  if (id === "offer") {
    const stack = (o.stack || "").split("\n").filter(Boolean).map(s => s.replace("[coach]", (o.coaches || [])[0] ? coachName(o.coaches[0]) : "your coach").replace("[calls]", o.calls || "").replace("[the build]", "Your build"));
    const bonuses = d.bonuses[o.id] || [];
    const forYou = named && c.deal ? c.deal.split("\n").filter(Boolean) : [];
    const once = o.id === "life" || o.deck === "coached" || o.deck === "build";
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, "Today, on this call"),
      h("h2", { class: "mid" }, o.name),
      h("div", { class: "two" },
        h("div", {}, h("ul", { class: "stack" }, stack.map(s => h("li", {}, s))),
          forYou.length ? h("div", { class: "foryou" }, h("small", {}, `For you${nm ? ", " + nm : ""}`), forYou.map(s => h("div", {}, s))) : null,
          bonuses.map(b => h("div", { class: "bonus" }, h("b", {}, b.t), h("span", {}, b.d)))),
        h("div", {},
          price.list > price.today ? h("div", { class: "strike" }, `${money(price.list)}${o.id === "life" ? " every year for Starter" : o.months ? " / " + o.months + " months" : ""}`) : null,
          h("div", { class: "price" }, money(price.today), h("small", {}, once ? "once. No renewal." : o.months ? `for ${o.months} months` : "")),
          price.paid ? h("div", { class: "note" }, `${money(price.paid)} already paid → ${money(price.due)} today`) : null,
          h("div", { class: "guar" }, d.guarantee))));
  }
  if (id === "pay") {
    const m = planMonths();
    const per = price.due / m;
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, "Let's get you in"),
      h("h2", { class: "mid" }, o.name),
      h("div", { class: "plan" }, m === 1 ? "Paid in full today" : `${m} payments`),
      h("div", { class: "price" + (c.paidNow ? " green" : "") }, money(per), h("small", {}, m === 1 ? (c.paidNow ? "paid ✓" : "today") : `a month · ${money(price.due)} total`)),
      h("div", { class: "two" },
        h("div", {},
          h("div", { class: "note" }, c.paidNow ? "Paid. Welcome in." : c.payFix ? "Card didn't go through. Scan the link to fix it, stay on the call." : (cardInfo() ? cardInfo().has : c.card) ? d.pay.card : d.pay.nocard),
          c.payUrl ? h("div", { class: "note linkline" }, c.payUrl.replace(/^https?:\/\//, "")) : null,
          h("div", { class: "guar" }, d.guarantee)),
        c.payUrl && !c.paidNow ? h("div", { class: "qr" }, h("img", { src: "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + encodeURIComponent(c.payUrl), alt: "pay link" })) : null));
  }
  if (id === "gameplan") {
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, nm ? `${nm}'s next 4 weeks` : "The next 4 weeks"),
      h("h2", { class: "mid" }, nm ? `${nm}, ${d.gameplan.title.replace("Here's", "here's")}` : d.gameplan.title),
      h("ol", { class: "plan" }, d.gameplan.items.map(s => h("li", {}, s))));
  }
  if (id === "review") {
    const url = d.review.url;
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, "One last thing"),
      h("h2", { class: "mid" }, d.review.title),
      h("div", { class: "two" },
        h("div", {}, h("div", { class: "note" }, d.review.sub), h("div", { class: "big-ok" }, "You're in.")),
        h("div", { class: "qr" }, url ? h("img", { src: "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + encodeURIComponent(url), alt: "QR" }) : "Add the review link in deck.json → review.url")));
  }
}
const stat = (l, v) => h("div", { class: "stat" }, h("small", {}, l), h("b", {}, v));

// ---------- present mode ----------
const PR = { draw: false, text: false, color: "#F5C64F", strokes: {}, texts: {}, music: false, track: 0 };
const COLORS = ["#F5C64F", "#A78BFA", "#4ADE97", "#FF8FA3"];
export function openPresent() { S.present = true; S.slide = 0; S.step = 0; S.zoom = null; render(); }
export function closePresent() { S.present = false; PR.draw = PR.text = false; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); render(); }
export const go = (d) => step(d);
export const toggleDraw = () => { PR.draw = !PR.draw; PR.text = false; render(); };
export const toggleText = () => { PR.text = !PR.text; PR.draw = false; render(); };
export const clearInk = () => { PR.strokes[S.slide] = []; PR.texts[S.slide] = []; render(); };
export const setColor = (i) => { PR.color = COLORS[i]; render(); };
export const toggleMusic = () => { PR.music = !PR.music; render(); };
export const nextTrack = () => { const n = (S.deck.music.playlists || []).filter(p => p.url).length; if (n) { PR.track = (PR.track + 1) % n; PR.music = true; render(); } };
export const toggleParty = () => setCall({ party: !S.call.party });
export const markPaid = () => { setCall({ paidNow: true, party: true, paidHow: "marked by hand" }); };
export function toggleFull() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch {} }

export function renderPresent() {
  const p = $("#present");
  p.hidden = !S.present;
  if (!S.present) { p.innerHTML = ""; p.className = "dk-present"; return; }
  const key = slideId() + ":" + (S.call.party ? "p" : "g");
  p.className = "dk-present" + (PR.draw ? " drawing" : "") + (PR.text ? " editing" : "");
  p.onclick = (e) => { if (PR.draw || PR.text) return; if (e.target.closest(".dk-tools, .musicdock, button, a, .path, .bonus, .bx-wrap, .dk-label")) return; step(e.clientX > innerWidth / 2 ? 1 : -1); };
  let stage = p.querySelector(".dk-stage");
  if (!stage) { p.innerHTML = ""; stage = h("div", { class: "dk-stage" }); p.append(stage, h("div", { class: "dk-dots" }), h("div", { class: "dk-tools" })); }
  // Like Mo's: a straight cut between slides (the motion lives inside each slide).
  const slide = renderMoSlide(S.slide); slide.dataset.key = key;
  stage.querySelectorAll(".dk-slide, .dk-ink, .dk-label").forEach(el => el.remove());
  stage.append(slide, ...inkLayer(stage));
  p.querySelector(".dk-dots").replaceWith(h("div", { class: "dk-dots" }, slideList().map((_, i) => h("i", { class: i === S.slide ? "on" : "" }))));
  const n = 5;
  const lists = (S.deck.music.playlists || []).filter(x => x.url);
  p.querySelector(".dk-tools").replaceWith(h("div", { class: "dk-tools" + (PR.draw || PR.text ? " open" : "") },
    h("div", { class: "grp nav" },
      h("button", { class: "ic", disabled: S.slide === 0 && !(S.step > 0), title: "← back", onclick: (e) => { e.stopPropagation(); step(-1); } }, "‹"),
      h("span", { class: "cnt" }, String(S.slide + 1), h("small", {}, "/" + n)),
      h("button", { class: "ic", disabled: S.slide === n - 1, title: "→ next", onclick: (e) => { e.stopPropagation(); step(1); } }, "›")),
    h("div", { class: "grp" },
      h("button", { class: PR.draw ? "on" : "", title: "D", onclick: (e) => { e.stopPropagation(); toggleDraw(); } }, h("span", {}, "✏️"), "Draw"),
      PR.draw ? h("span", { class: "dk-colors" }, COLORS.map((col, i) => h("i", { style: { background: col }, class: col === PR.color ? "on" : "", title: String(i + 1), onclick: (e) => { e.stopPropagation(); setColor(i); } }))) : null,
      h("button", { class: PR.text ? "on" : "", title: "E", onclick: (e) => { e.stopPropagation(); toggleText(); } }, h("span", {}, "✍️"), "Text"),
      (PR.strokes[S.slide] || []).length || (PR.texts[S.slide] || []).length ? h("button", { title: "C", onclick: (e) => { e.stopPropagation(); clearInk(); } }, "clear") : null),
    h("div", { class: "grp" },
      h("button", { class: PR.music ? "on" : "", title: lists.length ? "M" : "Add playlists in deck.json → music", onclick: (e) => { e.stopPropagation(); lists.length ? toggleMusic() : toast("Add a Spotify playlist link in deck.json → music"); } }, h("span", {}, "🎵"), "Music"),
      h("button", { class: "ic", title: lists.length > 1 ? "N · next playlist" : "your songs", onclick: (e) => { e.stopPropagation(); nextTrack(); } }, "🎧")),
    h("div", { class: "grp offer" }, h("span", { class: "lbl" }, "Offer"), offerSeg()),
    h("div", { class: "grp seg", title: "payment plan · P / W / K" }, Object.entries(S.deck.plans).map(([id, pl]) => h("button", { class: S.call.payPlan === id ? "on" : "", onclick: (e) => { e.stopPropagation(); setCall({ payPlan: id }); } }, pl.label))),
    h("div", { class: "grp" },
      h("button", { class: S.call.party ? "on" : "", title: "G · party", onclick: (e) => { e.stopPropagation(); toggleParty(); } }, "🎉"),
      h("button", { class: "ic", title: "F · fullscreen", onclick: (e) => { e.stopPropagation(); toggleFull(); } }, "⛶"),
      h("button", { class: "ic", title: "Esc · close", onclick: (e) => { e.stopPropagation(); closePresent(); } }, "✕"))));
  const old = p.querySelector(".musicdock"); if (old) old.remove();
  if (PR.music && lists.length) p.append(h("div", { class: "musicdock" }, h("iframe", { src: embedUrl(lists[PR.track % lists.length].url), width: "300", height: "80", frameborder: "0", allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture", loading: "lazy" })));
}
const embedUrl = (u) => { const m = String(u).match(/open\.spotify\.com\/(playlist|album|track)\/([A-Za-z0-9]+)/); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : u; };

// Drawing + text labels, kept per slide, in memory for this Present session.
function inkLayer(stage) {
  const cv = h("canvas", { class: "dk-ink" });
  const strokes = PR.strokes[S.slide] = PR.strokes[S.slide] || [];
  const texts = PR.texts[S.slide] = PR.texts[S.slide] || [];
  const ctx = cv.getContext("2d");
  const paint = () => {
    const r = stage.getBoundingClientRect(); cv.width = r.width; cv.height = r.height;
    ctx.lineCap = ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, r.width / 300);
    for (const s of strokes) { ctx.strokeStyle = s.c; ctx.beginPath(); s.p.forEach(([x, y], i) => i ? ctx.lineTo(x * r.width, y * r.height) : ctx.moveTo(x * r.width, y * r.height)); ctx.stroke(); }
  };
  requestAnimationFrame(paint); window.addEventListener("resize", paint, { once: true });
  let cur = null;
  const pos = (e) => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  cv.style.pointerEvents = PR.draw || PR.text ? "auto" : "none";
  cv.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (PR.draw) { cur = { c: PR.color, p: [pos(e)] }; strokes.push(cur); cv.setPointerCapture(e.pointerId); }
    else if (PR.text) { const [x, y] = pos(e); texts.push({ x, y, t: "", c: PR.color }); render(); setTimeout(() => { const last = $("#present .dk-label:last-of-type"); last && last.focus(); }, 0); }
  });
  cv.addEventListener("pointermove", (e) => { if (cur) { cur.p.push(pos(e)); paint(); } });
  cv.addEventListener("pointerup", () => { cur = null; });
  const labels = texts.map((t, i) => h("div", { class: "dk-label", contenteditable: "true", style: { left: t.x * 100 + "%", top: t.y * 100 + "%", color: t.c }, onclick: (e) => e.stopPropagation(), oninput: (e) => { t.t = e.target.textContent; }, onblur: (e) => { if (!e.target.textContent.trim()) { texts.splice(i, 1); render(); } } }, t.t));
  return [cv, ...labels];
}
function confetti(root) {
  const cv = h("canvas", { class: "confetti-cv" }); root.append(cv);
  const ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
  const bits = Array.from({ length: 160 }, () => ({ x: Math.random() * cv.width, y: -Math.random() * cv.height, r: 4 + Math.random() * 6, c: COLORS[Math.floor(Math.random() * 4)], v: 2 + Math.random() * 3, w: Math.random() * 2 - 1 }));
  let alive = true;
  const tick = () => { if (!alive || !cv.isConnected) return; ctx.clearRect(0, 0, cv.width, cv.height); for (const b of bits) { b.y += b.v; b.x += b.w; if (b.y > cv.height) { b.y = -10; b.x = Math.random() * cv.width; } ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, b.r, b.r * 0.6); } requestAnimationFrame(tick); };
  tick(); setTimeout(() => { alive = false; cv.remove(); }, 9000);
}
export const PRESENT = PR;
