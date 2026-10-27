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

  // 1 · calls (or the practice call)
  const todays = S.calls.filter(x => x.date === todayISO());
  const step1 = h("section", { class: "card step" }, h("h3", {}, h("i", {}, "1"), P ? "Practice call" : "Your calls"),
    P ? h("div", { class: "prac" },
      h("p", {}, "A made-up group call. Run the whole close: offer, bonuses, pay, celebrate. Test money only, nobody real is charged, emailed or logged."),
      h("div", { class: "who" }, d.practice.people.map(p => h("span", {}, p.name))),
      h("p", { class: "fake" }, "Fake card: ", h("b", {}, d.practice.card)),
      h("button", { class: "pill", onclick: startPractice }, "↺ Start the practice call over"))
    : h("div", {},
      todays.length ? todays.map(x => h("button", { class: "callBtn" + (x.id === c.id ? " on" : ""), onclick: () => { setCall({ id: x.id, name: x.name, email: x.email, trialStart: x.trialStart, renews: x.renews, offerId: x.offerId || c.offerId, mode: /group/i.test(x.type) ? "group" : "one", paidNow: false, party: false, payUrl: "", payErr: "", payNote: "", payFix: false, cardInfo: null, cardFor: "" }); lookupCard(); } },
          h("b", {}, x.time || "—"), h("span", {}, x.name, h("small", {}, x.type)), h("em", {}, "prep →")))
        : h("p", { class: "muted"}, "No calls loaded for today. Add them on the Pre-call tab, or fill the call in below."),
      h("button", { class: "chip small", onclick: () => setTab("precall") }, "Pre-call tab →")));

  // 2 · the call
  const step2 = h("section", { class: "card step" }, h("h3", {}, h("i", {}, "2"), "The call"),
    h("div", { class: "row" },
      field("Their name", c.name, (v) => setCall({ name: v }), { ph: "First name" }),
      field("Email", c.email, (v) => setCall({ email: v }), { ph: "optional" })),
    h("div", { class: "row" },
      field("Trial started", c.trialStart, (v) => setCall({ trialStart: v }), { type: "date" }),
      field("Renews on", c.renews, (v) => setCall({ renews: v }), { type: "date" })),
    field("The deal, in your words", c.deal, (v) => setCall({ deal: v }), { textarea: true, rows: 3, ph: "VCS at 8k with Malu, she needs her course built, already paid 997" }),
    h("div", { class: "muted small" }, "Lines you write here show on the Offer slide as \"For you\". Mo's page writes these from the transcript; here you write them."));

  // 3 · the deal
  const step3 = h("section", { class: "card step" }, h("h3", {}, h("i", {}, "3"), "The deal"),
    eyebrow("Presentation"),
    seg([["group", "Group · generic, share the screen"], ["one", "1-on-1 · their info on the slides"]], c.mode, (v) => setCall({ mode: v }), "col"),
    eyebrow("Offer"),
    h("div", { class: "offers" }, content().offers.map(x => h("button", { class: "offerBtn" + (x.id === o.id ? " on" : ""), onclick: () => setCall({ offerId: x.id, list: "", today: "", paid: "" }) },
      h("span", {}, h("b", {}, x.name), h("small", {}, x.who || "")), h("span", { class: "price" }, money(x.today))))),
    h("div", { class: "row three" },
      field("Full price", c.list !== "" ? c.list : o.list, (v) => setCall({ list: v }), { type: "number" }),
      field("Paid", c.paid, (v) => setCall({ paid: v }), { type: "number", ph: "0" }),
      field("Today", c.today !== "" ? c.today : o.today, (v) => setCall({ today: v }), { type: "number" })),
    h("div", { class: "muted" }, price.paid ? `${money(price.today)} today, ${money(price.paid)} already paid → ${money(price.due)} due` : `${money(price.today)} today`),
    h("div", { class: "row" }, eyebrow("Pay plan"), planSeg()),
    moneyBlock());

  // 4 · log the call
  const step4 = h("section", { class: "card step" }, h("h3", {}, h("i", {}, "4"), "Log the call"),
    h("p", { class: "muted" }, "Who showed, what happened, what's next. Mo's page logs straight to the tracker. Here it keeps a note in this browser and copies a line you can paste into the tracker."),
    h("div", { class: "chips" }, d.outcomes.map(x => h("button", { class: "chip small" + (c.outcome === x ? " on" : ""), onclick: () => setCall({ outcome: x }) }, x))),
    h("div", { class: "row" }, field("Cash collected", c.cc, (v) => setCall({ cc: v }), { type: "number", ph: "0" }), field("Follow-up date", c.fu, (v) => setCall({ fu: v }), { type: "date" })),
    field("Note", c.note, (v) => setCall({ note: v }), { textarea: true, rows: 2, ph: "What held them back, what you promised" }),
    h("div", { class: "row" },
      h("button", { class: "pill", disabled: P, onclick: logCall }, P ? "Not logged in practice" : "Log it"),
      h("button", { class: "chip small", onclick: () => copy(logLine(), "Copied for the tracker") }, "⧉ copy a line")),
    S.log.length ? h("div", { class: "loglist" }, eyebrow("Logged in this browser"), S.log.slice(-5).reverse().map(l => h("div", { class: "muted small" }, l))) : null);

  const left = h("div", { class: "cl-side" }, step1, step2, step3, step4);

  const brief = S.calls.find(x => x.id === c.id);
  const before = brief && (brief.sections.close || brief.sections.putOut) ? h("details", { class: "before" }, h("summary", {}, "Before you join ", h("small", {}, brief.sections.who || "")),
    h("p", {}, h("b", {}, "The problem: "), brief.sections.putOut), h("p", {}, h("b", {}, "To close: "), brief.sections.close)) : null;

  const right = h("div", {},
    h("div", { class: "row" },
      seg(slideList().map((id, i) => [i, { cover: "Cover", offer: "Offer", pay: "Pay", gameplan: "Gameplan", celebrate: "Celebrate", review: "Review" }[id]]), S.slide, (i) => jump(i)),
      h("button", { class: "presentBtn", onclick: openPresent }, "▶ Present")),
    before,
    c.mode === "one" && !c.name ? h("div", { class: "notice" }, h("b", {}, "Standard pitch: "), "no name yet, so the slides use your standard version. Fill in the call to make it theirs.") : null,
    h("div", { class: "dk-frame", onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); step(e.clientX - r.left > r.width / 2 ? 1 : -1); } }, renderMoSlide(S.slide)),
    h("div", { class: "sayit" }, h("b", {}, "Say it: "), d.sayIt[slideId()] || ""),
    h("div", { class: "hint" }, "In Present: ", h("kbd", {}, "←"), h("kbd", {}, "→"), " slides · ", h("kbd", {}, "O"), " offer · ",
      Object.values(d.plans).map(p => [h("kbd", {}, p.key), " " + p.label + " · "]), h("kbd", {}, "D"), " draw · ", h("kbd", {}, "E"), " text · ", h("kbd", {}, "C"), " clear · ", h("kbd", {}, "M"), " music · ", h("kbd", {}, "G"), " party · ", h("kbd", {}, "F"), " fullscreen · ", h("kbd", {}, "Esc"), " close"));
  return h("div", { class: "deck" }, left, right);
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
  return h("div", { class: "moneyblock" },
    eyebrow("Card on file"),
    live ? h("div", { class: "row tight" },
      c.cardBusy ? h("span", { class: "muted small" }, "Looking in Stripe…")
        : ci ? (ci.has ? h("span", { class: "st ok small" }, "💳 " + (ci.label || "card on file") + (ci.trialing ? ` · trial day ${ci.day}` : "")) : h("span", { class: "st bad small" }, ci.error ? ci.error : "No card on file"))
        : h("span", { class: "muted small" }, c.email ? "Not checked yet" : "Add their email"),
      h("button", { class: "chip small", disabled: !c.email || c.cardBusy, onclick: lookupCard }, ci ? "Check again" : "Find the card"))
      : seg([[true, "Yes"], [false, "No"]], c.card, (v) => setCall({ card: v })),
    live ? h("div", { class: "row tight" },
      h("button", { class: "chip small", disabled: c.linkBusy, onclick: link }, c.linkBusy ? "Making the link…" : "🔗 Make the link"),
      h("button", { class: "chip small danger", disabled: c.payBusy || c.paidNow, onclick: charge }, c.payBusy ? "Charging…" : c.paidNow ? "Paid ✓" : "💳 Charge the card")) : null,
    c.payErr ? h("div", { class: "st bad small" }, c.payErr) : null,
    c.payNote ? h("div", { class: "muted small" }, c.payNote) : null,
    field("Pay link", c.payUrl, (v) => setCall({ payUrl: v, payFix: false, payNote: "" }), { ph: live ? "Make the link, or paste one" : "https://…" }));
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
