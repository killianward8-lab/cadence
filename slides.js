// The slides, built with Mo's markup and class names (deck-light.css is his stylesheet, made light).
// Ported from Mo's deck as of Oct 27, 2026: Year / Life / Both, Creator / Sprint / Power for Life,
// two bonuses, the proof strip, the credits explainer, the comparison slide, the new pay slide.
import { h, S, offer, offerById, dealPrice, firstName, copy, setCall, render, toast } from "./core.js";
import { hasKey, findCard, clean, api } from "./poppy.js";
import { charge, link, lookupCard, cardInfo } from "./deck.js";

// ---------- small helpers ----------
const Fe = (n) => (n || n === 0) && !isNaN(+n) && +n > 0 ? "$" + Math.round(+n).toLocaleString("en-US") : "";
const d = () => S.deck.ob;
const ui = () => (S.ui = S.ui || {});
const setUI = (patch) => { Object.assign(ui(), patch); render(); };
const stop = (e) => e && e.stopPropagation();
const nm = () => (S.call.mode === "one" && S.call.name ? firstName(S.call.name) : "");
const isLifeId = (id) => /^(lifec|lifecs|lifep|lifecoh)$/.test(id || "");
const isLife = () => /^life/.test(S.call.offerId || "");
const isOb = () => offer().deck === "ob";
// Cohort: Starter or Creator for life, their pick. Starter = the plain lifetime (no plan name sent).
export const cohortStarter = () => S.call.cohortPlan === "starter";
export const planKeyOf = (id) => id === "lifecoh" ? (cohortStarter() ? "" : "creator") : ({ lifec: "creator", lifecs: "creator", lifep: "power" })[id] || "";
const fmtShort = (iso) => { if (!iso) return ""; const t = new Date(String(iso).slice(0, 10) + "T12:00:00"); return isNaN(t) ? iso : t.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
const QR = (url, size = 420) => "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size + "&margin=0&color=0B0A12&bgcolor=FFFFFF&data=" + encodeURIComponent(url);

// Renewal: the cover shows their REAL renewal, and the year on the call is $25 under it.
export const renewAt = () => +S.call.renewAmount > 0 ? +S.call.renewAmount : (offerById("renew") || {}).list || 399;
export const yearPrice = () => +S.call.renewAmount > 0 ? Math.max(50, +S.call.renewAmount - 25) : (offerById("renew") || {}).today || 374;
export const todayOf = (id) => { const p = +(S.call.prices || {})[id] || 0; return p > 0 ? p : id === "renew" ? yearPrice() : (offerById(id) || {}).today || 0; };
export const dueOf = (id) => Math.max(todayOf(id) - (+S.call.paid || 0), 0);

// Payment plans. Year: Whop 6 months / Clarity 12-24. Life plans: native Stripe, 6 or 12 payments.
export function planInfo(due = dealPrice().due) {
  const p = S.call.payPlan || "full";
  if (p === "full" || !due) return null;
  if (isLifeId(S.call.offerId)) { const n = p === "whop" ? 6 : 12, per = Math.ceil(due / n); return { native: true, count: n, per, big: Fe(per) + "/mo", sub: n + " monthly payments, then it's yours for life" }; }
  if (p === "whop") { const per = Math.ceil(due / 6); return { id: "whop", months: 6, per, big: Fe(per) + "/mo", sub: "6 months, 0% interest" }; }
  const r = Math.ceil(due / 12), o = Math.ceil(due / 24);
  return { id: "clarity", per: o, big: Fe(o) + "/mo", sub: "24 months, or " + Fe(r) + "/mo for 12" };
}
const cyclePlan = (e) => { stop(e); const ids = ["full", "whop", "clarity"]; setCall({ payPlan: ids[(ids.indexOf(S.call.payPlan || "full") + 1) % ids.length], payUrl: "", whopUrl: "", linkTried: false }); };

// ---------- which slides, in which order ----------
const TIERS = {
  lifec: { planName: "Creator", planYear: 2268, credits: "8,000", plan: [["⚡", "8,000", "credits a month"], ["👥", "3", "team seats"], ["🏷️", "10", "brand profiles"], ["🎬", "Landing", "page builder"], ["🧩", "All", "templates"]],
    pillars: [{ n: "Strategy", dl: [["90-min call with a content coach", "strategy + build"], ["90-day content plan", "planned with you"], ["Viral Content Academy", "every play, on video"]] },
      { n: "Build", dl: [["Your Poppy system", "built in your voice"], ["Content boards", "hooks, scripts, captions"], ["3 team seats", "10 brand profiles"]] },
      { n: "Own", big: "8,000", dl: [["Creator plan", "for life"], ["8,000 credits", "every month"], ["Every new feature", "no renewal, ever"]] }] },
  lifecs: { planName: "Creator", planYear: 2268, credits: "8,000", weeks: true, plan: [["⚡", "8,000", "credits a month"], ["👥", "3", "team seats"], ["🏷️", "10", "brand profiles"], ["🎬", "Landing", "page builder"], ["🧩", "All", "templates"]],
    pillars: [{ n: "Short form", wk: "Week 1", coachId: "charan", dl: [["Viral hooks", "from your niche"], ["A week of posts", "in your voice"]], lines: ["Reels, TikToks and Shorts", "Hooks from what's already viral in your niche"] },
      { n: "Long form", wk: "Week 2", coachId: "christian", dl: [["A YouTube video", "title, hook, outline"], ["Trust that sells", "so they're ready to buy"]], lines: ["YouTube and long-form", "One video planned: title, hook, outline"] },
      { n: "Ads", wk: "Week 3", coachId: "christian", dl: [["3 ad scripts", "ready to run"], ["A feedback loop", "every ad beats the last"]], lines: ["Paid ads from your winners", "3 ad scripts ready to run"] },
      { n: "Conversion", wk: "Week 4", coachId: "charan", dl: [["Your landing page", "in the page builder"], ["Views into buyers", "a page to send them to"]], lines: ["Funnels and landing pages", "Your page written in the page builder"] },
      { n: "Own", wk: "Forever", big: "8,000", dl: [["Creator plan", "for life"], ["8,000 credits", "every month"], ["Every new feature", "no renewal, ever"]] }] },
  lifep: { planName: "Power User", planYear: 4788, credits: "16,000", plan: [["⚡", "16,000", "credits a month"], ["👥", "5", "team seats"], ["🏷️", "Unlimited", "brand profiles"], ["🤖", "APIs", "+ agents"], ["🧩", "All", "templates"]],
    pillars: [{ n: "Strategy", dl: [["2 × 90-min with a content coach", "strategy + build"], ["90-day plan", "planned, then reviewed"], ["Viral Content Academy", "every play, on video"]] },
      { n: "Build", dl: [["Your Poppy system", "built in your voice"], ["Boards for every brand", "clients included"], ["5 team seats", "unlimited brand profiles"]] },
      { n: "Optimize", rep: true, dl: [["90-min AI session", "AI built into your content"], ["APIs, MCP + agents", "connected for you"], ["The Poppy Vault", "prompts, videos, answers"]] },
      { n: "Own", big: "16,000", dl: [["Power User plan", "for life"], ["16,000 credits", "every month"], ["Every new feature", "no renewal, ever"]] }] },
};
// The Creator Cohort: lifetime plan + 4 live group calls (one a week), starting a week after they pay.
function cohortTier() {
  const st = cohortStarter(), planName = st ? "Starter" : "Creator", credits = st ? "4,000" : "8,000";
  return { planName, planYear: st ? 1188 : 2268, credits, weeks: true, cohort: true,
    plan: st ? [["⚡", "4,000", "credits a month"], ["👥", "2", "team seats"], ["🏷️", "5", "brand profiles"], ["🧩", "All", "templates"]]
      : [["⚡", "8,000", "credits a month"], ["👥", "3", "team seats"], ["🏷️", "10", "brand profiles"], ["🎬", "Landing", "page builder"], ["🧩", "All", "templates"]],
    pillars: [{ n: "Short-form", wk: "Week 1", dl: [["Viral hooks", "from your niche"], ["A week of posts", "in your voice"]] },
      { n: "Long-form", wk: "Week 2", dl: [["A YouTube video", "title, hook, outline"], ["Trust that sells", "so they're ready to buy"]] },
      { n: "Paid ads", wk: "Week 3", dl: [["3 ad scripts", "from your winners"], ["A feedback loop", "every ad beats the last"]] },
      { n: "Funnels", wk: "Week 4", dl: [["Your funnel mapped", "from post to purchase"], ["Views into buyers", "a page to send them to"]] },
      { n: "Own", wk: "Forever", big: credits, dl: [[planName + " plan", "for life"], [credits + " credits", "every month"], ["The Academy", "course, prompts, boards"]] }] };
}
const PILL = { "Short-form": ["📱", "#A78BFA"], "Long-form": ["🎬", "#60A5FA"], "Paid ads": ["📣", "#F472B6"], Funnels: ["💰", "#34D399"], Strategy: ["🧭", "#A78BFA"], Build: ["🛠️", "#60A5FA"], Optimize: ["⚡", "#34D399"], Own: ["💎", "#F5C64F"], "Short form": ["📱", "#A78BFA"], "Long form": ["🎬", "#60A5FA"], Ads: ["📣", "#F472B6"], Conversion: ["💰", "#34D399"] };
const COACHES = {
  charan: { id: "charan", name: "Charan Singh", handle: "@trainwithcharan", followers: "50K", photo: "assets/charan.jpg", lines: ["Content strategist at The School of Hard Knockz", "Helps brands, businesses and creators post with clarity", "Builds your content system with you, 1:1"] },
  christian: { id: "christian", name: "Christian Santos", handle: "@christiangotvision", followers: "", photo: "assets/christian.jpg", lines: ["Built the Poppy systems on this deck: ads, VSLs, webinars, YouTube, LinkedIn", "Took a client from 2K to 10K TikTok followers in one month, first video past 100K", "Runs your build 1:1, call by call, until it's producing"] },
};

const tierDeck = () => !S.call.payBoth && isLifeId(S.call.offerId) && (S.call.offerId === "lifecoh" ? cohortTier() : TIERS[S.call.offerId]);
export function slideList() {
  const t = tierDeck();
  const mid = t ? ["intro", "pillars", ...(t.weeks && !t.cohort ? ["coaches"] : []), "plan", "normal", "deal"] : ["anchor", "offer"];
  const paid = !!S.call.paidAt || S.call.party;
  return ["cover", ...mid, "pay", paid ? "celebrate" : "gameplan", "review"];
}
export const slideId = (i = S.slide) => { const l = slideList(); return l[Math.max(0, Math.min(i, l.length - 1))]; };
const stepsFor = (id) => {
  if (id === "offer") return S.call.payBoth ? 1 : isOb() ? d().bonuses.length + 1 : 0;
  if (id === "pillars") { const t = tierDeck(); return t ? t.pillars.length : 0; }
  return 0;
};

// ---------- steps: ArrowRight / click right half ----------
export function step(dir) {
  const u = ui();
  if (u.bonusOpen || u.creditsOpen || u.proofOpen || u.deepOpen || u.jackpot) { setUI({ bonusOpen: "", creditsOpen: false, proofOpen: "", deepOpen: "", jackpot: false }); return; }
  const id = slideId(), n = stepsFor(id), last = slideList().length - 1;
  if (dir > 0) {
    if (n && (S.step || 0) < n) { S.step = (S.step || 0) + 1; return applyStep(); }
    if (S.slide < last) { S.slide++; S.step = 0; return render(); }
    return;
  }
  if (n && (S.step || 0) > 0) { S.step--; return applyStep(); }
  if (S.slide > 0) { S.slide--; S.step = stepsFor(slideId()); render(); }
}
export const jump = (i) => { S.slide = Math.max(0, Math.min(i, slideList().length - 1)); S.step = 0; render(); };
// Steps flip classes on the same elements so Mo's CSS transitions play (flip, slide up, open).
export function applyStep() {
  const st = S.step || 0;
  const roots = document.querySelectorAll(".dk-offer3, .dk-cmp, .dk-p4");
  if (!roots.length) return render();
  roots.forEach(box => {
    if (box.classList.contains("dk-offer3")) {
      const L = d().bonuses.length + 1;
      box.querySelectorAll(".bonus").forEach((b, i) => b.classList.toggle("open", st > i));
      box.classList.toggle("priced", st >= L);
      const pr = box.querySelector(".o-price"); if (pr) pr.classList.toggle("in", st >= L);
    } else if (box.classList.contains("dk-cmp")) box.classList.toggle("priced", st >= 1);
    else if (box.classList.contains("dk-p4")) {
      box.querySelectorAll(".st").forEach((el, i) => el.classList.toggle("open", i < st));
      box.querySelectorAll(".arr").forEach((el, i) => el.classList.toggle("on", i + 1 < st));
    }
  });
  const back = document.querySelector("#present .dk-tools .nav .ic"); if (back) back.disabled = S.slide === 0 && !st;
  if (window.__cadenceBroadcast) window.__cadenceBroadcast();
}

// ---------- the frame every slide shares ----------
const wrap = (cls, body) => h("div", { class: "dk-slide " + cls },
  h("i", { class: "dk-orb a" }), h("i", { class: "dk-orb b" }),
  h("div", { class: "dk-top" },
    h("span", { class: "dk-brand" }, h("img", { src: "assets/poppy-mark.png", alt: "" }), "Poppy"),
    h("span", { class: "dk-for" }, nm() ? nm() + " × Poppy" : "getpoppy.ai")),
  h("div", { class: "dk-body" }, body));

export function renderSlide(i = S.slide) {
  const id = slideId(i);
  const map = {
    cover: () => wrap("cover", cover()), anchor: () => wrap("", anchor()), offer: () => wrap("", S.call.payBoth ? compare() : isOb() ? offerOb() : offerOther()),
    intro: () => wrap("", intro()), pillars: () => wrap("", pillars()), coaches: () => wrap("", coaches()), plan: () => wrap("", planSlide()),
    normal: () => wrap("", normal()), deal: () => wrap("", deal()), pay: () => wrap("", pay()),
    gameplan: () => wrap("center gp", gameplan()), celebrate: () => wrap("center party", party()), review: () => wrap("", review()),
  };
  return (map[id] || map.cover)();
}
export const sayItKey = () => { const id = slideId(); if (id === "offer" && S.call.payBoth) return "compare"; if (id === "intro" && tierDeck() && tierDeck().weeks) return tierDeck().cohort ? "introCohort" : "introSprint"; return id; };
export const slideLabel = (id) => ({ cover: "cover", anchor: "anchor", offer: "offer", intro: "problem", pillars: "pillars", coaches: "coaches", plan: "plan", normal: "normally", deal: "today", pay: "pay", gameplan: "gameplan", celebrate: "celebrate", review: "review" })[id] || id;

// ---------- popovers shared by several slides ----------
function overlays() {
  const u = ui(), out = [];
  if (u.proofOpen === "plans") out.push(h("div", { class: "bx-wrap", onclick: (e) => { stop(e); setUI({ proofOpen: "" }); } },
    h("div", { class: "pf", onclick: stop }, h("img", { src: "assets/plans-pricing.jpg", alt: "Poppy plans and prices" }),
      h("div", { class: "pf-t" }, h("span", {}, d().plansProof), h("button", { class: "bx-close", onclick: () => setUI({ proofOpen: "" }) }, "Got it")))));
  const b = d().bonuses.find(x => x.k === u.bonusOpen);
  if (b) {
    const pic = Math.max(0, Math.min(u.bonusPic || 0, b.pics.length - 1));
    out.push(h("div", { class: "bx-wrap", onclick: (e) => { stop(e); setUI({ bonusOpen: "", bonusPic: 0 }); } },
      h("div", { class: "bx", onclick: stop },
        h("div", { class: "bx-pic" }, b.pics.length ? h("img", { src: b.pics[pic], alt: "" }) : h("div", { class: "bx-art", style: { background: b.art.bg } }, b.art.e),
          b.pics.length > 1 ? h("div", { class: "bx-dots" }, b.pics.map((_, i) => h("i", { class: i === pic ? "on" : "", onclick: () => setUI({ bonusPic: i }) }))) : null,
          b.pics.length > 1 ? h("button", { class: "bx-next", onclick: () => setUI({ bonusPic: (pic + 1) % b.pics.length }) }, "›") : null),
        h("div", { class: "bx-t" }, h("small", {}, `${b.tag} · ${b.value}`), h("h3", {}, b.title), h("p", {}, b.line),
          h("ul", {}, b.points.map(p => h("li", {}, h("i", {}, "✓"), p))),
          b.link ? h("a", { class: "bx-link", href: b.link[0], target: "_blank", rel: "noopener", onclick: stop }, b.link[1] + " ↗") : null,
          b.note ? h("em", {}, b.note) : null,
          h("button", { class: "bx-close", onclick: () => setUI({ bonusOpen: "", bonusPic: 0 }) }, "Got it")))));
  }
  if (u.creditsOpen || u.deepOpen === "credits") out.push(creditsPop(u.deepOpen === "credits" ? tierDeck() : null));
  return out;
}
function creditsPop(t) {
  const days = (n, cls) => h("div", { class: "ce-days " + cls }, Array.from({ length: 30 }, (_, i) => h("i", { class: i < n ? "on" : "", style: { animationDelay: i * 35 + "ms" } })));
  const close = () => setUI({ creditsOpen: false, deepOpen: "" });
  const power = t && t.planName === "Power User";
  return h("div", { class: "bx-wrap ce-wrap", onclick: (e) => { stop(e); close(); } }, h("div", { class: "ce", onclick: stop },
    h("small", { class: "ce-eye" }, "How credits work"), h("h3", {}, "Every chat uses a little bit of credits"),
    h("p", { class: "ce-sub" }, "The more you connect to a chat (videos, docs, brand profiles), the more each message uses. Disconnect what you don't need and your credits go further."),
    h("div", { class: "ce-rows" },
      h("div", { class: "ce-row" }, h("div", { class: "ce-l" }, h("b", {}, "2,000"), h("span", {}, "a month · your plan now")), days(t ? (power ? 7 : 12) : 18, "now"), h("em", {}, t ? "runs out partway through the month" : "about 15 to 20 days of content")),
      h("div", { class: "ce-row life" }, h("div", { class: "ce-l" }, h("b", {}, t ? t.credits : "4,000"), h("span", {}, "a month · " + (t ? offer().name : "Poppy for Life"))), days(30, "life"), h("em", {}, t ? (power ? "every day, all month, room to grow" : "every day, all month, room to spare") : "the whole month, every day"))),
    h("div", { class: "ce-perks" },
      h("div", {}, h("i", {}, "×" + (t ? (power ? 8 : 4) : 2)), h("b", {}, t ? (power ? "8×" : "4×") + " the credits" : "Double the credits"), h("span", {}, "every month, forever")),
      h("div", {}, h("i", {}, "∞"), h("b", {}, "Never renews"), h("span", {}, t ? "one payment, for life" : "no $1,188 every year")),
      h("div", {}, h("i", {}, "🔒"), h("b", {}, "Grandfathered"), h("span", {}, "prices go up, yours never does"))),
    h("button", { class: "bx-close", onclick: close }, "Got it")));
}
function proofStrip() {
  const p = d().proof;
  return h("div", { class: "col proof pf2" },
    h("div", { class: "pf-row" }, h("div", { class: "pf-faces" }, p.faces.map(([src, alt]) => h("img", { src, alt, title: alt })), h("i", {}, "+13K")),
      h("div", { class: "pf-who" }, h("b", {}, p.line))),
    h("div", { class: "pf-tp" }, h("img", { class: "pf-tplogo", src: "assets/trustpilot.svg", alt: "Trustpilot" }), h("span", { class: "pf-stars" }, [0, 1, 2, 3, 4].map(() => h("i", {}, "★")))),
    h("span", { class: "pf-tpl" }, h("b", {}, p.tp), " · " + p.reviews),
    h("span", { class: "gu guar" }, p.guarantee));
}
const creditLine = (text) => /credit/i.test(text)
  ? h("li", { class: "tap", title: "tap: how credits work", onclick: (e) => { stop(e); setUI({ creditsOpen: true }); } }, h("i", {}, "✓"), h("span", {}, text), h("em", { class: "tapi" }, "i"))
  : h("li", {}, h("i", {}, "✓"), h("span", {}, text));
function bonusArt(b) {
  if (b.k === "vca") return h("div", { class: "ba-vca" }, h("span", { class: "ba-cap" }, "🎓"), h("span", { class: "ba-plus" }, "+"), h("span", { class: "ba-sk", style: { backgroundImage: "url(assets/skool.png)" } }));
  if (b.k === "prompts") return h("div", { class: "ba-vault2" }, h("div", { class: "bar" }, h("i", {}, "✨"), h("span", { class: "typed" }, "10 viral hooks"), h("span", { class: "caret" }), h("b", {}, "↑")));
  return b.art.e;
}

// ---------- 1 · cover ----------
function cover() {
  const c = S.call, n = nm();
  const facts = [["Trial started", fmtShort(c.trialStart)], ["Renews", fmtShort(c.renews)], isLifeId(c.offerId) ? ["Your credits", "2,000 / mo"] : ["Renews at", Fe(renewAt())]];
  if (isOb()) return h("div", { class: "dk-obcover" },
    h("p", { class: "dk-eye" }, n ? `${n}, where you're at` : "Where you're at"),
    h("h1", {}, n ? `${n}, you're on the $1 trial.` : "You're on the $1 trial."),
    c.trialStart || c.renews ? h("div", { class: "facts" }, facts.map(([k, v]) => h("div", {}, h("small", {}, k), h("b", {}, v || "—")))) : h("p", { class: "sub" }, "It renews at " + Fe(renewAt()) + "."),
    h("p", { class: "bridge" }, "Since we're on the call, I can do one thing for you →"));
  return h("div", { class: "dk-obcover" },
    h("p", { class: "dk-eye" }, n ? `${n}, where you're at` : "Where you're at"),
    h("h1", {}, n ? `${n}, here's where you're at.` : "Here's where you're at."),
    c.deal ? h("div", { class: "pills" }, c.deal.split("\n").filter(Boolean).slice(0, 4).map(s => h("span", {}, s))) : null,
    h("p", { class: "bridge" }, "Since we're on the call, I can do one thing for you →"));
}

// ---------- anchor: what it costs to hire (Joey's slide) ----------
function anchor() {
  const a = d().anchor || {}, n = nm();
  return h("div", { class: "dk-anchor" },
    h("div", { class: "dk-l" },
      h("p", { class: "dk-eye" }, a.eye),
      h("h2", {}, n ? `${n}, ${a.head.charAt(0).toLowerCase() + a.head.slice(1)}` : a.head),
      h("div", { class: "receipt" }, (a.rows || []).map(([k, v]) => h("div", { class: v === "✓" ? "ck" : "" }, h("span", {}, k), h("b", {}, v))))),
    h("div", { class: "dk-r" },
      h("div", { class: "today" }, h("small", {}, a.bigLabel), h("b", {}, a.big), h("em", {}, a.bigSub)),
      a.alt ? h("div", { class: "alt" }, h("small", {}, a.altLabel), h("b", {}, a.alt), h("em", {}, a.altSub)) : null));
}

// ---------- 2 · offer (Year / Life) ----------
function offerOb() {
  const o = offer(), c = S.call, ob = d(), life = c.offerId === "life", due = dealPrice().due;
  const st = S.step || 0, L = ob.bonuses.length + 1;
  const stack = (o.stack || "").split("\n").filter(Boolean);
  const plan = planInfo(due);
  const per = !life && due ? "that's $" + Math.round(due / 12) + " a month" : "";
  return h("div", { class: "dk-offer3" + (st >= L ? " priced" : "") },
    h("div", { class: "o-l" },
      h("p", { class: "dk-eye gold" }, "Only on this call"),
      h("h2", {}, life ? "Poppy for Life" : "Poppy for the year"),
      h("p", { class: "tagline" }, life ? ob.taglines.life : ob.taglines.renew),
      h("ul", { class: "core" }, stack.map(creditLine))),
    h("div", { class: "o-r" }, h("p", { class: "bh" }, ob.bonusHead),
      ob.bonuses.map((b, i) => h("div", { class: "bonus" + (st > i ? " open" : "") },
        h("div", { class: "lock" }, h("span", {}, "🎁"), h("b", {}, b.tag)),
        h("div", { class: "face" },
          h("div", { class: "art art-" + b.k, style: { background: b.art.bg }, onclick: (e) => { stop(e); setUI({ bonusOpen: b.k, bonusPic: 0 }); } }, bonusArt(b)),
          h("div", { class: "t" }, h("small", {}, `${b.tag} · ${b.value}`), h("b", {}, b.title), h("span", {}, b.line)))))),
    h("div", { class: "o-price choice" + (st >= L ? " in" : "") },
      h("div", { class: "path wait" },
        h("small", {}, life ? ob.wait.life.small : ob.wait.renew.small),
        h("b", { class: life ? "proof" : "", title: life ? "tap: our plans page, the real prices" : "", onclick: life ? (e) => { stop(e); setUI({ proofOpen: "plans" }); } : null }, life ? ob.wait.life.big : Fe(renewAt())),
        h("span", {}, life ? ob.wait.life.sub : c.renews ? "on " + fmtShort(c.renews) + ", when your trial ends" : "in a week, when your trial ends"),
        h("em", {}, life ? ob.wait.life.em : ob.wait.renew.em)),
      h("div", { class: "vs" }, "or"),
      h("div", { class: "path today", title: "tap to switch the payment plan", onclick: cyclePlan },
        h("small", {}, ob.today.small),
        plan ? [h("b", {}, plan.big), h("span", {}, plan.sub)] : [h("b", {}, Fe(due), life ? h("i", {}, " once") : null), h("span", {}, life ? "One payment. Never renews." : per)],
        h("em", {}, life ? ob.today.emLife : ob.today.em)),
      proofStrip()),
    overlays());
}

// ---------- 2b · Both: the comparison slide ----------
const CMP = () => ({
  renew: { plan: "Basic", term: "for the year", price: dueOf("renew"), per: "for the year", calls: null, rows: ["2,000", "–", "–", "Every year · " + Fe((offerById("renew") || {}).list || 399)] },
  life: { plan: "Starter", term: "for life", price: dueOf("life") || 997, per: "once", calls: null, rows: ["4,000", "2", "5", "Never"] },
  lifec: { plan: "Creator", term: "for life", price: dueOf("lifec") || 2268, per: "once", calls: ["90-min strategy call"], rows: ["8,000", "3", "10", "Never"] },
  lifep: { plan: "Power User", term: "for life", price: dueOf("lifep") || 4788, per: "once", calls: ["2 × 90-min strategy calls", "+ 90-min AI session"], rows: ["16,000", "5", "Unlimited", "Never"] },
});
export const compareIds = () => (S.call.compare && S.call.compare.length >= 2 ? S.call.compare : ["renew", "life"]).filter(id => CMP()[id]);
function compare() {
  const T = CMP(), ids = compareIds(), star = ids.includes(S.call.compareStar) ? S.call.compareStar : ids.includes(S.call.offerId) ? S.call.offerId : ids[ids.length - 1];
  const labels = [["⚡", "Credits a month"], ["🎓", "Calls with a coach"], ["👥", "Team seats"], ["🏷️", "Brand profiles"], ["🔁", "Renews"]];
  const rowsOf = (t) => [t.rows[0], t.calls, t.rows[1], t.rows[2], t.rows[3]];
  return h("div", { class: "dk-cmp v2 n" + ids.length + ((S.step || 0) >= 1 ? " priced" : "") },
    h("div", { class: "ch" }, h("p", { class: "dk-eye gold" }, "Only on this call"), h("h2", {}, "Pick your ", h("span", {}, "Poppy."))),
    h("div", { class: "grid", style: { "--n": String(ids.length) } },
      h("div", { class: "lab" }, h("div", { class: "hd" }), labels.map(([i, l]) => h("div", { class: "cell" }, h("i", {}, i), l)), h("div", { class: "pr" })),
      ids.map(id => { const t = T[id]; return h("div", { class: "col" + (id === star ? " star" : "") + (t.term === "for life" ? " forlife" : ""), onclick: (e) => { stop(e); setCall({ compareStar: id, offerId: id, list: "", today: "", payUrl: "", whopUrl: "", linkTried: false }); } },
        id === star ? h("em", { class: "rib" }, "★ Best value") : null,
        h("div", { class: "hd" }, h("b", {}, t.plan), h("span", { class: "term" + (t.term === "for life" ? " life" : "") }, t.term)),
        rowsOf(t).map((v, i) => i === 1 ? h("div", { class: "cell calls" + (v ? "" : " no") }, v ? h("div", {}, v.map(x => h("span", {}, x))) : "–")
          : h("div", { class: "cell" + (v === "–" ? " no" : "") + (i === 4 && v === "Never" ? " good" : "") }, i === 4 && v === "Never" ? "✓ Never" : v)),
        h("div", { class: "pr" }, h("b", {}, Fe(t.price)), h("i", {}, t.per))); })),
    h("p", { class: "foot" }, "Every plan includes the Viral Content Academy and the Poppy Vault."),
    h("p", { class: "foot gu guar" }, "🛡️ 30-day money-back guarantee"),
    overlays());
}

// ---------- lifetime decks (Creator / Sprint / Power for Life) ----------
function intro() {
  const t = tierDeck();
  if (t.weeks) {
    const crew = [...new Set(t.pillars.map(p => p.coachId).filter(Boolean))].map(id => COACHES[id]);
    const logos = ["icons8-youtube-logo-100.png", "icons8-tiktok-144.png", "icons8-instagram-144.png", "icons8-linkedin-96.png"];
    return h("div", { class: "dk-in4" },
      h("div", { class: "l" }, h("div", { class: "logos" }, logos.map(f => h("img", { src: "https://getpoppy.ai/logos/" + f, alt: "" }))),
        h("p", { class: "kick" }, "Posting isn't the problem."), h("h2", {}, "Getting ", h("span", {}, "paid"), " from it is."),
        h("div", { class: "eq" }, h("b", {}, "Get seen"), h("i", {}, "+"), h("b", {}, "Build trust"), h("i", {}, "+"), h("b", {}, "Scale"), h("i", {}, "+"), h("b", {}, "Convert"), h("i", {}, "="), h("em", {}, "Money"))),
      h("div", { class: "r" }, h("div", { class: "crew" }, crew.map((c, i) => h("img", { src: c.photo, alt: "", style: { "--i": String(i) } })), h("img", { class: "masc sm", src: "assets/poppy-mascot-hd.png", alt: "" }))));
  }
  return h("div", { class: "dk-in5 calm" },
    h("h2", {}, "Most people pay for AI every year. ", h("span", {}, "Almost none get a system out of it.")),
    h("div", { class: "vs" },
      h("div", { class: "side no" }, h("small", {}, "Most people"), h("div", { class: "chat" }, ["write me 10 hooks", "make it sound more like me", "no, try again"].map((x, i) => h("p", { style: { "--i": String(i) } }, x)))),
      h("div", { class: "mid" }, "→"),
      h("div", { class: "side yes" }, h("small", {}, "You, after today"),
        h("div", { class: "hub" }, h("div", { class: "core" }, h("img", { src: "assets/poppy-mascot-hd.png", alt: "" })),
          [["🧬", "Your voice"], ["🔥", "Viral hooks"], ["✍️", "Scripts"], ["🗓️", "Your plan"]].map(([i, b], k) => h("div", { class: "nd n" + k, style: { "--i": String(k) } }, h("i", {}, i), h("b", {}, b)))))),
    h("p", { class: "turn" }, "Today you leave with one. ", h("b", {}, "For life.")));
}
const deepFor = (p) => p.coachId ? "coach" : p.n === "Build" ? "build" : p.rep ? "optimize" : p.big ? "credits" : "";
function deepOverlay() {
  const t = tierDeck(), u = ui(); if (!t || !u.deepOpen) return null;
  const p = t.pillars[+u.deepPill || 0] || t.pillars[0];
  const close = (e) => { stop(e); setUI({ deepOpen: "" }); };
  if (u.deepOpen === "coach" && COACHES[p.coachId]) {
    const c = COACHES[p.coachId];
    return h("div", { class: "bx-wrap", onclick: close }, h("div", { class: "dv coachv", onclick: stop }, h("img", { class: "ph", src: c.photo, alt: "" }),
      h("div", { class: "tx" }, h("small", {}, "Your " + p.n.toLowerCase() + " coach"), h("h3", {}, c.name), h("p", { class: "hd" }, c.handle + (c.followers ? " · " + c.followers + " followers" : "")),
        h("ul", {}, c.lines.map(l => h("li", {}, h("i", {}, "✓"), l))), h("div", { class: "on" }, h("b", {}, p.wk + " · group call"), h("span", {}, (p.lines || []).join(" · "))),
        h("button", { class: "bx-close", onclick: close }, "Got it"))));
  }
  if (u.deepOpen === "build") return h("div", { class: "bx-wrap", onclick: close }, h("div", { class: "dv buildv", onclick: stop }, h("small", {}, "What we build with you"), h("h3", {}, "Systems like these, built around your business"),
    h("div", { class: "sys six" }, ["brand.jpg", "vsl.jpg", "scripting.jpg", "shortform.jpg", "ads.jpg", "yt-tof.jpg"].map(f => h("img", { src: "assets/systems/" + f, alt: "" }))), h("button", { class: "bx-close", onclick: close }, "Got it")));
  if (u.deepOpen === "optimize") return h("div", { class: "bx-wrap", onclick: close }, h("div", { class: "dv optv", onclick: stop }, h("div", { class: "oh" }, h("div", {}, h("small", {}, "Your AI session · 90 min"), h("h3", {}, "AI, built into your content"))),
    h("div", { class: "og" }, [["🔍", "AI content audit", "Where AI fits in how you make content today"], ["🔗", "Your accounts connected", "Your socials and tools hooked up to Poppy, live"], ["🧩", "APIs + MCP", "Poppy inside the other AI tools you already use"], ["🤖", "Content agents", "Agents that research, draft and repurpose for you"]].map(([i, b, s]) => h("div", { class: "ob" }, h("i", {}, i), h("div", {}, h("b", {}, b), h("span", {}, s))))),
    h("button", { class: "bx-close", onclick: close }, "Got it")));
  if (u.deepOpen === "credits") return creditsPop(t);
  return null;
}
function pillars() {
  const t = tierDeck(), st = S.step || 0;
  return h("div", { class: "dk-p4" },
    h("div", { class: "mh" }, t.cohort ? [h("p", { class: "dk-eye gold" }, "The Creator Cohort · starts a week after you join"), h("h2", {}, "4 live calls, one a week. ", h("span", {}, "Poppy for life."))]
      : t.weeks ? [h("p", { class: "dk-eye gold" }, "The 30-Day Content Sprint"), h("h2", {}, "30 days with us. ", h("span", {}, "Then it's yours for life."))]
      : [h("p", { class: "dk-eye gold" }, "Only on this call"), h("h2", {}, "We build the system ", h("span", {}, "around your business."))]),
    h("div", { class: "steps" + (t.pillars.length === 3 ? " three" : t.pillars.length === 5 ? " five" : "") }, t.pillars.map((p, i) => {
      const open = i < st, [ic, ac] = PILL[p.n] || ["✦", "#A78BFA"], deep = deepFor(p), coach = COACHES[p.coachId];
      return [i > 0 ? h("div", { class: "arr" + (i < st ? " on" : "") }, "⇢") : null,
        h("div", { class: "st" + (open ? " open" : "") + (p.big ? " own" : "") + (deep ? " tap" : ""), style: { "--ac": ac }, onclick: deep ? (e) => { stop(e); if (e.currentTarget.classList.contains("open")) setUI({ deepOpen: deep, deepPill: i }); } : null },
          h("div", { class: "ic" }, ic), h("small", {}, p.wk || "0" + (i + 1)), h("div", { class: "nm" }, p.n),
          h("div", { class: "body" }, h("ul", { class: "dl" }, p.dl.map(([b, s]) => h("li", {}, h("i", {}, "✓"), h("div", {}, h("b", {}, b), h("span", {}, s))))),
            coach ? h("div", { class: "who" }, h("img", { src: coach.photo, alt: "" }), h("span", {}, "with ", h("b", {}, firstName(coach.name)), " · group")) : null))];
    })),
    deepOverlay());
}
function coaches() {
  const t = tierDeck(), crew = [...new Set(t.pillars.map(p => p.coachId).filter(Boolean))].map(id => COACHES[id]);
  return h("div", { class: "dk-crew" },
    h("div", { class: "mh" }, h("p", { class: "dk-eye gold" }, "Your coaches"), h("h2", {}, "Every call, run by ", h("span", {}, "someone who's done it."))),
    h("div", { class: "cards" }, crew.map(c => h("div", { class: "cc" }, h("img", { src: c.photo, alt: "" }),
      h("div", { class: "tx" }, h("div", { class: "wks" }, t.pillars.filter(p => p.coachId === c.id).map(p => h("span", { style: { "--ac": (PILL[p.n] || [0, "#A78BFA"])[1] } }, p.wk + " · " + p.n))),
        h("b", {}, c.name), h("small", {}, c.handle + (c.followers ? " · " + c.followers : "")), h("ul", {}, c.lines.slice(0, 2).map(l => h("li", {}, l))))))));
}
function planSlide() {
  const t = tierDeck();
  return h("div", { class: "dk-pl4" },
    h("div", { class: "l" }, h("p", { class: "dk-eye gold" }, "What you get"), h("h2", {}, "The " + t.planName + " plan.", h("br"), h("span", {}, "For life.")), h("p", { class: "sub" }, "Everything in it, every month, forever. No renewal, ever.")),
    h("div", { class: "card" },
      h("div", { class: "hd" }, h("img", { src: "assets/poppy-mascot-hd.png", alt: "" }), h("div", {}, h("b", {}, "Poppy " + t.planName), h("span", {}, "for life")), h("em", {}, "★ Lifetime")),
      h("div", { class: "feats" }, t.plan.map(([i, b, s]) => { const tap = /credit/.test(s); return h("div", { class: "ft" + (tap ? " tap" : ""), onclick: tap ? (e) => { stop(e); setUI({ deepOpen: "credits" }); } : null }, h("i", {}, i), h("b", {}, b), h("span", {}, s)); }))),
    deepOverlay());
}
function normal() {
  const t = tierDeck(), five = t.planYear * 5;
  return h("div", { class: "dk-nw" },
    h("div", { class: "ih" }, h("p", { class: "dk-eye" }, "The " + t.planName + " plan, the normal way"), h("h2", {}, "It renews. ", h("span", {}, "Every single year."))),
    h("div", { class: "line" }, [1, 2, 3, 4, 5].map(y => h("div", { class: "yr", style: { "--d": y * 0.18 + "s", "--h": String((y - 1) / 4) } },
      h("div", { class: "dot" }), h("small", {}, "Year " + y), h("div", { class: "chg" }, h("i", {}, "💳"), h("b", {}, Fe(t.planYear)), h("span", {}, "charged")), h("em", {}, Fe(t.planYear * y) + " so far")))),
    h("div", { class: "tot" }, h("span", {}, "Five years, the normal way"), h("b", {}, Fe(five)),
      h("p", {}, "Same plan, same credits, ", h("span", { class: "proof", onclick: (e) => { stop(e); setUI({ proofOpen: "plans" }); } }, "charged again every year"), ".")),
    overlays());
}
function deal() {
  const t = tierDeck(), o = offer(), due = dealPrice().due, five = t.planYear * 5, keep = Math.max(0, five - due), plan = planInfo(due);
  const inc = t.cohort ? [["🎓", "4 live group calls, one a week", "short-form · long-form · paid ads · funnels"], ["📅", "Starts a week after you join", "so you're set up before call 1"], ["💎", t.credits + " credits a month", "the " + t.planName + " plan, for life"]]
    : t.weeks ? [["🎓", "4 weekly group coaching calls", "short form · long form · ads · conversion"], ["💎", t.credits + " credits a month", "the " + t.planName + " plan, for life"]]
    : t.pillars.map(p => [(PILL[p.n] || ["✦"])[0], p.big ? t.credits + " credits a month" : p.dl[0][0], p.big ? "the " + t.planName + " plan, for life" : p.dl[0][1]]);
  return h("div", { class: "dk-px" },
    h("div", { class: "l" }, h("p", { class: "dk-eye gold" }, "Today, on this call"), h("h2", {}, o.name + ".", h("br"), h("span", {}, "Paid once.")),
      h("ul", { class: "inc" }, inc.map(([i, b, s]) => h("li", {}, h("i", {}, i), h("div", {}, h("b", {}, b), h("span", {}, s)))))),
    h("div", { class: "card" },
      h("div", { class: "chip" }, h("img", { src: "assets/poppy-mascot-hd.png", alt: "" }), h("b", {}, "Poppy " + t.planName), h("em", {}, "★ for life")),
      h("div", { class: "now tap", onclick: cyclePlan, title: "tap: in full · 6 months · 12 months" },
        plan ? [h("small", {}, plan.count + " monthly payments"), h("b", {}, plan.big), h("span", {}, "then it's yours for life")]
          : [h("small", {}, "One payment"), h("b", {}, Fe(due)), h("span", {}, "then never again")]),
      h("div", { class: "save2" }, h("div", {}, h("small", {}, "Normally, over 5 years"), h("s", {}, Fe(five))), h("i"), h("div", { class: "kp" }, h("small", {}, "You keep"), h("b", {}, Fe(keep)))),
      h("div", { class: "trust" }, proofStrip())),
    overlays());
}

// Non-OB offers (plans, coaching, build): the same offer layout without the bonus reveal.
function offerOther() {
  const o = offer(), price = dealPrice(), ob = d();
  const stack = (o.stack || "").split("\n").filter(Boolean).map(s => s.replace("[coach]", "your coach").replace("[calls]", o.calls || "").replace("[the build]", "Your build"));
  const once = o.deck === "coached" || o.deck === "build";
  return h("div", { class: "dk-offer3 priced" },
    h("div", { class: "o-l" }, h("p", { class: "dk-eye gold" }, "Only on this call"), h("h2", {}, o.name), h("p", { class: "tagline" }, o.who || ""), h("ul", { class: "core" }, stack.map(creditLine))),
    h("div", { class: "o-r" }, o.optional && o.optional.length ? [h("p", { class: "bh" }, "If it came up on the call"), h("ul", { class: "core" }, o.optional.slice(0, 4).map(s => h("li", {}, h("i", {}, "+"), h("span", {}, s.replace(/\s*\(only if.*\)$/, "")))))] : null),
    h("div", { class: "o-price choice in" },
      h("div", { class: "path wait" }, h("small", {}, "Full price"), h("b", {}, Fe(price.list)), h("span", {}, once ? "" : o.months ? `every ${o.months} months` : ""), h("em", {}, "")),
      h("div", { class: "vs" }, "or"),
      h("div", { class: "path today", onclick: cyclePlan }, h("small", {}, ob.today.small), h("b", {}, Fe(price.due), once ? h("i", {}, " once") : null), h("span", {}, price.paid ? `${Fe(price.paid)} already paid` : o.months ? `for ${o.months} months` : ""), h("em", {}, "✓ " + (o.range || o.name))),
      proofStrip()),
    overlays());
}

// ---------- 3 · pay ----------
// A group = everyone booked into the same group slot as this call.
export function groupPeople() {
  const me = S.calls.find(x => x.id === S.call.id);
  if (!me || !/group/i.test(me.type) || S.call.mode !== "group") return null;
  const g = S.calls.filter(x => x.date === me.date && x.time === me.time && /group/i.test(x.type) && x.email);
  return g.length > 1 ? g : null;
}
let chargeTimer = null, cardSeen = "";
const rechecked = new Set();
function pay() {
  const c = S.call, o = offer(), P = d().pay, due = dealPrice().due, life = isLife(), n = nm(), plan = planInfo(due);
  const plk = planKeyOf(c.offerId), ci = cardInfo(), people = groupPeople();
  const payEmail = c.payEmail || c.email || "";
  const paid = !!c.paidAt;
  const sub = plan ? plan.sub : !life && due ? "that's $" + Math.round(due / 12) + " a month" : life ? "one payment · never renews" : "";
  const shield = () => h("svg", { viewBox: "0 0 24 24", html: '<path d="M12 3.2 19 6v5.2c0 4.3-2.9 8-7 9.6-4.1-1.6-7-5.3-7-9.6V6l7-2.8Z"></path><path d="m8.8 12.2 2.2 2.2 4.3-4.6"></path>' });

  const pls = { sprint: [["Short form", "Short form", "Week 1 · group call"], ["Long form", "Long form", "Week 2 · group call"], ["Ads", "Ads", "Week 3 · group call"], ["Conversion", "Conversion", "Week 4 · group call"], ["Own", "8,000 credits a month", "the Creator plan, for life"]],
    creator: [["Strategy", "90-min call with a content coach", "strategy + build"], ["Build", "Your Poppy system", "built in your voice · 3 seats · 10 brands"], ["Own", "8,000 credits a month", "the Creator plan, for life"]],
    cohort: [["Short-form", "Short-form", "Week 1 · live call"], ["Long-form", "Long-form", "Week 2 · live call"], ["Paid ads", "Paid ads", "Week 3 · live call"], ["Funnels", "Funnels", "Week 4 · live call"], ["Own", (cohortStarter() ? "4,000" : "8,000") + " credits a month", "the " + (cohortStarter() ? "Starter" : "Creator") + " plan, for life · calls start a week after you join"]],
    power: [["Strategy", "2 × 90-min calls with a content coach", "strategy + build, then reviewed"], ["Build", "Your Poppy system", "built in your voice · 5 seats · unlimited brands"], ["Optimize", "90-min AI session", "AI audit · APIs, MCP + agents"], ["Own", "16,000 credits a month", "the Power User plan, for life"]] }[c.offerId === "lifecs" ? "sprint" : c.offerId === "lifecoh" ? "cohort" : plk] || null;
  const paidCount = people ? people.filter(p => (c.paidBy || {})[clean(p.email)]).length : 0;
  const left = h("div", { class: "l" },
    S.practice ? h("span", { class: "pr-tag" }, "🧪 PRACTICE · test money") : null,
    h("h2", {}, people ? "Let's get you in" : n ? `${n}, let's get you in` : "Let's get you in"),
    people ? h("div", { class: "people" }, people.map(p => {
      const e = clean(p.email), pd = (c.paidBy || {})[e];
      return h("button", { class: (e === clean(payEmail) ? "on" : "") + (pd ? " paid" : ""), onclick: (ev) => { stop(ev); setCall({ payEmail: p.email, cardInfo: null, cardFor: "", payUrl: "", whopUrl: "", linkTried: false, payFix: false }); lookupCard(p.email); } },
        h("i", { class: "av" }, pd ? "✓" : (firstName(p.name || p.email)[0] || "?").toUpperCase()), firstName(p.name || p.email));
    })) : null,
    people ? h("button", { class: "gbonus" + (paidCount ? " on" : ""), onclick: (e) => { stop(e); setUI({ jackpot: true }); } },
      h("span", { class: "gb-l" }, "🎁 ", h("b", {}, "Group bonus")),
      h("span", { class: "gb-m" }, paidCount ? ["Everyone in gets ", h("b", {}, "+" + (Math.min(paidCount, 3) * 500).toLocaleString()), " credits/mo"] : ["Every person who joins = ", h("b", {}, "+500"), " credits/mo for all of you"]),
      h("span", { class: "gb-r" }, paidCount + "/" + people.length + " in ›")) : null,
    people && ui().jackpot ? jackpot(people) : (jpClosed(), null),
    h("div", { class: "rc rc2" + (pls ? " has-plan" : "") },
      h("div", { class: "rc-top" }, h("img", { class: "rc-logo", src: "assets/poppy-mascot-hd.png", alt: "" }),
        h("div", {}, h("b", {}, o.name), h("small", {}, life ? "Your content system, every update, for good." : "Your content system, all year")),
        h("em", { class: "rc-pill" + (life ? " gold" : "") }, life ? "Lifetime" : "12 months")),
      pls ? h("div", { class: "rc-pls" + (c.offerId === "lifecs" || c.offerId === "lifecoh" ? " sprint" : plk === "creator" ? " three" : "") }, pls.map(([k, b, s]) =>
        h("div", { class: "pl2", style: { "--ac": (PILL[k] || [0, "#A78BFA"])[1] } }, h("span", { class: "ic" }, (PILL[k] || ["✦"])[0]), h("div", {}, h("b", {}, b), h("span", {}, s)))))
        : h("div", { class: "rc-bon" }, h("small", {}, "+ 2 bonuses, today only"), h("div", { class: "tiles" }, d().bonuses.map(b =>
          h("div", { class: "tile" }, h("div", { class: "pic" }, h("img", { src: b.tile, alt: "" }), h("span", { class: "art", style: { background: b.art.bg } }, b.art.e)),
            h("div", { class: "tx" }, h("span", {}, b.tileLabel), h("div", { class: "val" }, b.k === "vca" ? [h("s", {}, "$997"), h("b", {}, "included")] : [h("i", {}, "1-on-1 clients only"), h("b", {}, "included")])))))),
      h("div", { class: "rc-tot" }, h("small", {}, plan ? "Monthly" : "Today"), h("div", {}, h("b", {}, plan ? plan.big : Fe(due)), sub ? h("span", { class: "pm" }, sub) : null)),
      h("div", { class: "rc-gu guar" }, shield(), "30-day money-back guarantee")));

  const holder = (people ? (people.find(p => clean(p.email) === clean(payEmail)) || {}).name : c.name) || "";
  const ghost = (text, none) => h("div", { class: "float" }, h("div", { class: "cc ghost" + (none ? " none" : "") },
    h("div", { class: "cc-top" }, h("span", { class: "chip" }), h("span", { class: "bm" }, " ")), h("div", { class: "cc-num" }, text),
    h("div", { class: "cc-bot" }, h("div", {}, h("span", {}, holder.toUpperCase()))), h("i", { class: "sweep" })));
  const realCard = () => {
    const brand = String(ci.brand || ci.label || "").toLowerCase(), lk = ci.kind === "link" || /link/.test(brand);
    const bm = lk ? h("span", { class: "bm link" }, "link") : /visa/.test(brand) ? h("span", { class: "bm visa" }, "VISA") : /master/.test(brand) ? h("span", { class: "bm mc" }, h("i"), h("i")) : /amex|american/.test(brand) ? h("span", { class: "bm amex" }, "AMEX") : h("span", { class: "bm" }, (ci.brand || "POPPY").toUpperCase());
    const last4 = ci.last4 || (String(ci.label || "").match(/(\d{4})(?!.*\d{4})/) || [])[1] || "••••";
    // the card rises in once per card, not on every redraw
    const key = clean(payEmail) + ":" + last4, rise = cardSeen !== key; cardSeen = key;
    const bName = lk ? "Link" : /visa/.test(brand) ? "Visa" : /master/.test(brand) ? "Mastercard" : /amex|american/.test(brand) ? "Amex" : /discover/.test(brand) ? "Discover" : "Card";
    return h("div", { class: "float" + (rise ? " rise" : "") }, h("div", { class: "cc" + (lk ? " is-link" : /visa/.test(brand) ? " is-visa" : /master/.test(brand) ? " is-mc" : /amex|american/.test(brand) ? " is-amex" : "") },
      h("div", { class: "cc-top" }, h("span", { class: "chip" }), bm),
      lk ? h("div", { class: "lk-mid" }, h("small", {}, "Saved with Link"), h("span", {}, ci.linkEmail || payEmail)) : h("div", { class: "cc-num num" }, "•••• •••• •••• ", h("b", { class: "l4" }, last4)),
      h("div", { class: "cc-bot" }, h("div", {}, h("span", {}, holder ? holder.toUpperCase() : "CARD ON FILE")),
        !lk && ci.exp ? h("div", { class: "exp" }, h("small", {}, "EXPIRES"), h("span", {}, ci.exp)) : h("b", { class: "num" }, Fe(due))),
      h("i", { class: "sweep" }), h("i", { class: "gloss" })),
      h("p", { class: "cc-cap" }, "💳 ", lk ? "Link · " + (ci.linkEmail || payEmail) : bName + " ending in ", lk ? null : h("b", {}, last4), !lk && ci.exp ? " · expires " + ci.exp : ""));
  };
  const links = () => {
    if (hasKey() && !c.linkTried && !c.linkBusy && !(c.payUrl && c.whopUrl)) { c.linkTried = true; setTimeout(() => link(), 0); }
    const rows = [
      { k: "stripe", logo: "assets/stripe.svg", name: "Stripe", sub: plan && plan.native ? plan.count + " monthly payments of " + Fe(plan.per) : "any card, Apple Pay, Google Pay", url: c.payUrl, hide: plan && !plan.native },
      { k: "whop", logo: "assets/whop.png", name: "Whop", sub: plan && plan.id === "whop" ? "6 monthly payments of " + Fe(plan.per) + " · 0% interest" : plan && plan.id === "clarity" ? "12 or 24 months, on approval" : "card, PayPal, crypto, Affirm", url: c.whopUrl, hide: plan && plan.native },
    ].filter(r => !r.hide);
    const ready = rows.filter(r => r.url), lead = ready.find(r => r.k === (ui().qrRail || "stripe")) || ready[0] || null;
    return h("div", { class: "float" }, h("div", { class: "cc paylink" + (lead ? "" : " wait") },
      h("div", { class: "pl-top" },
        lead ? h("img", { class: "pl-qr", alt: "Scan to pay", src: QR(lead.url, 300) }) : h("div", { class: "pl-qr blank" }, h("span", {}, !hasKey() ? "Connect Poppy" : c.payErr ? "No link yet" : "Making your link…")),
        h("div", { class: "pl-txt" }, h("small", {}, lead ? "Scan to pay" + (ready.length > 1 ? " · " + lead.name : "") : c.payErr ? "Link didn't load" : "One second"),
          h("b", {}, plan ? plan.big : Fe(due)), h("span", {}, o.name + (plan ? " · " + plan.sub : life ? " · one payment, never renews" : due ? " · that's $" + Math.round(due / 12) + " a month" : "")),
          h("em", {}, lead ? lead.sub : c.payErr || "your secure pay page is on its way"))),
      rows.map(r => {
        const isLead = lead && lead.k === r.k;
        return h("div", { class: "pl-link" + (r.url ? "" : " wait") + (isLead ? " lead" : ""), onclick: (e) => { stop(e); if (r.url && !isLead) setUI({ qrRail: r.k }); } },
          h("i", { class: "logo" }, h("img", { src: r.logo, alt: r.name })),
          h("span", {}, r.url ? r.url.replace(/^https?:\/\//, "").replace(/\?.*$/, "") : c.payErr ? "Link didn't load" : "Making the link…"),
          r.url && ready.length > 1 ? h("em", { class: "qrtag" }, isLead ? "QR ✓" : "show QR") : null,
          r.url ? h("button", { onclick: (e) => { stop(e); copy(r.url, "Link copied"); } }, "Copy link")
            : c.payErr ? h("button", { class: "ghostbtn", onclick: (e) => { stop(e); setCall({ payErr: "", payUrl: "", whopUrl: "", linkTried: false }); } }, "Retry") : null);
      })));
  };
  const quiet = (extra) => h("div", { class: "links calm" },
    ui().trialFind ? h("div", { class: "trialfind" }, h("div", { class: "tf-row" },
      h("input", { value: ui().tfEmail || "", placeholder: life ? "The email their card is under" : "Their $1 trial email", onclick: stop, oninput: (e) => { ui().tfEmail = e.target.value; }, onkeydown: (e) => { e.stopPropagation(); if (e.key === "Enter") findOther(); if (e.key === "Escape") setUI({ trialFind: false }); } }),
      h("button", { onclick: (e) => { stop(e); findOther(); } }, ui().tfMsg === "looking" ? "Finding…" : "Find"),
      h("button", { class: "x", onclick: (e) => { stop(e); setUI({ trialFind: false, tfMsg: "" }); } }, "✕")),
      ui().tfMsg && ui().tfMsg !== "looking" ? h("span", { class: "tf-msg" }, ui().tfMsg) : null) : null,
    h("div", { class: "quiet" },
      !ui().trialFind ? h("button", { onclick: (e) => { stop(e); setUI({ trialFind: true, tfMsg: "" }); } }, life ? "Different email" : "Different trial email") : null,
      h("button", { onclick: (e) => { stop(e); differentCard(); } }, "Different card"),
      extra));
  let right;
  if (paid) {
    right = [h("div", { class: "float paidwrap" }, h("div", { class: "pd-halo" }), h("div", { class: "cc paid" },
        h("div", { class: "pd-burst" }, Array.from({ length: 18 }, (_, b) => h("i", { style: { "--x": String(6 + b * 29 % 88), "--d": (b % 9 * 0.07) + "s", "--c": ["#4ADE97", "#F5C64F", "#A78BFA", "#FF8FA3", "#F4F2FF"][b % 5], "--r": (b * 47 % 360) + "deg" } }))),
        h("div", { class: "pd-top" }, h("div", { class: "pd-ring", html: '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"></circle><path d="M15.5 27.5l7 6.5 14-15"></path></svg>' }), h("span", { class: "pd-stamp" }, "Paid")),
        h("div", { class: "pd-mid" }, h("b", { "data-countup": String(Math.round(due)) }, "$0"), h("span", {}, o.name)),
        h("div", { class: "pd-bot" }, h("span", {}, ci && ci.has && !/marked|they paid/i.test(c.paidHow || "") ? "💳 " + (ci.label || "card on file") : (c.paidHow || "paid")), h("span", {}, new Date(c.paidAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }))),
        h("i", { class: "shine" }))),
      h("h3", { class: "pd-in" }, n ? `${n}, you're in.` : "You're in."),
      h("p", { class: "pd-next" }, "Account updated · the welcome email is next ", h("b", {}, "→")),
      h("button", { class: "tiny undo", onclick: (e) => { stop(e); setCall({ paidAt: 0, paidHow: "", party: false, paidBy: Object.fromEntries(Object.entries(c.paidBy || {}).filter(([k]) => k !== clean(payEmail))) }); } }, "Not paid? Undo")];
  } else if (c.payBusy) {
    const stepN = Math.min(c.chargeStep || 0, P.steps.length - 1);
    if (!chargeTimer) chargeTimer = setInterval(() => { if (!S.call.payBusy) { clearInterval(chargeTimer); chargeTimer = null; return; } S.call.chargeStep = Math.min((S.call.chargeStep || 0) + 1, P.steps.length - 1); render(); }, 1300);
    right = h("div", { class: "dk-charging" },
      h("div", { class: "cc-stage" }, h("div", { class: "cc" }, h("div", { class: "cc-top" }, h("span", { class: "chip" }), h("b", {}, (ci && ci.brand ? ci.brand : "POPPY").toUpperCase())),
        h("div", { class: "cc-num num" }, "•••• •••• •••• ", (ci && ci.last4) || "••••"), h("div", { class: "cc-bot" }, h("span", {}, holder ? holder.toUpperCase() : "CARD ON FILE"), h("b", { class: "num" }, Fe(due))), h("i", { class: "sweep" }))),
      h("div", { class: "cg-side" }, h("div", { class: "cg-steps" }, P.steps.map((s, i) => h("div", { class: i < stepN ? "done" : i === stepN ? "now" : "" }, h("i", {}, i < stepN ? "✓" : ""), s))), h("div", { class: "cg-bar" }, h("b"))));
  } else if (c.payFix) {
    right = h("div", { class: "fixbox warn" },
      h("div", { class: "fx-h" }, h("div", {}, h("b", {}, c.fixHello ? "Add a card once" : "Let's try another card"), h("span", {}, c.fixHello ? "Type it on the secure page, takes 20 seconds." : "Totally normal, takes 20 seconds."), c.payErr ? h("em", { class: "fx-why" }, (c.fixHello ? "" : "🏦 Bank said: ") + c.payErr) : null)),
      c.fixUrl ? h("div", { class: "fx-body" },
        h("div", { class: "fx-qrw" }, h("img", { class: "fx-qr", alt: "Scan to pay", src: QR(c.fixUrl, 220) }), h("small", {}, "Scan with your phone")),
        h("div", { class: "fx-side" }, h("a", { class: "fx-go", href: c.fixUrl, target: "_blank", rel: "noreferrer", onclick: stop }, "Pay on the secure page ", h("span", {}, "→")),
          h("div", { class: "fx-acts" }, h("button", { onclick: (e) => { stop(e); copy(c.fixUrl, "Link copied"); } }, "Copy link"), !c.fixHello ? h("button", { onclick: (e) => { stop(e); setCall({ payFix: false, payErr: "" }); charge(); } }, "Retry this card") : null)))
        : h("div", { class: "fx-body wait" }, c.payErr && c.fixHello ? "No secure page this time." : "Making your secure link…"),
      h("small", { class: "fx-foot" }, "🔒 Secure Stripe checkout · turns green the moment it goes through"),
      h("button", { class: "tiny", onclick: (e) => { stop(e); setCall({ payFix: false, fixHello: false, payErr: "" }); } }, "← Back"));
  } else if (!hasKey()) {
    right = [ghost("Connect Poppy to charge", true), h("p", { class: "cardline why" }, "Connect Poppy (top right) and the card on file shows here.")];
  } else if (c.cardBusy || (!ci && payEmail)) {
    if (!c.cardBusy && !ci && payEmail) setTimeout(() => lookupCard(payEmail), 0);
    right = ghost(P.finding);
  } else if (ci && ci.has && !c.showLinks && !(plan && !plan.native)) {
    // a card saved before last4 was read: look it up once more (Link cards never have digits)
    if (!ci.last4 && ci.kind !== "link" && !/\d{4}/.test(ci.label || "") && !rechecked.has(clean(payEmail))) { rechecked.add(clean(payEmail)); setTimeout(() => lookupCard(payEmail), 0); }
    right = [realCard(),
      h("button", { class: "pay" + (ui().glow ? " glow" : ""), disabled: !!c.payBusy, onclick: (e) => { stop(e); charge(); } }, (life ? P.lockLife : P.lock) + " · " + (plan ? plan.big : Fe(due)), h("span", { class: "ar" }, "→")),
      c.payErr ? h("em", { class: "bad" }, c.payErr) : null,
      quiet(h("button", { onclick: (e) => { stop(e); setCall({ showLinks: true }); } }, "Send a pay link")),
      h("p", { class: "cardline" }, "On file under ", h("b", {}, payEmail))];
  } else {
    right = [links(),
      h("p", { class: "cardline why" }, ci && ci.has ? ["Card on file under ", h("b", {}, payEmail), ". ", h("a", { href: "#", onclick: (e) => { e.preventDefault(); stop(e); setCall({ showLinks: false, payPlan: "full" }); } }, "Back to the card")]
        : payEmail ? ["No card saved under ", h("b", {}, payEmail), " yet.", !life ? " Started your $1 trial with another email? Use Different trial email." : ""] : "Pick a call or type their email to find the card."),
      quiet(h("button", { onclick: (e) => { stop(e); setCall({ cardInfo: null, cardFor: "" }); lookupCard(payEmail); } }, "Check again"))];
  }
  const theyPaid = !paid && !c.payBusy ? h("button", { class: "tiny theypaid", onclick: (e) => { stop(e); markPaidNow("they paid"); } }, "✓ They paid") : null;
  return h("div", { class: "dk-pay one", onclick: stop }, left, h("div", { class: "r" }, right, theyPaid));
}
export function markPaidNow(how) {
  const e = clean(S.call.payEmail || S.call.email || "");
  setCall({ paidAt: Date.now(), paidHow: how, party: true, paidBy: { ...(S.call.paidBy || {}), [e || "_"]: Date.now() } });
}
async function findOther() {
  const em = clean(ui().tfEmail || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return setUI({ tfMsg: "Type a full email" });
  setUI({ tfMsg: "looking" });
  try {
    const info = await findCard({ email: em, name: S.call.name, ob: true });
    if (info && info.has) { setCall({ payEmail: em, cardInfo: info, cardFor: em, showLinks: false, payUrl: "", whopUrl: "", linkTried: false }); setUI({ trialFind: false, tfMsg: "", glow: true }); setTimeout(() => setUI({ glow: false }), 4000); return; }
    const fx = await api("/api/cardfix?email=" + encodeURIComponent(em)).catch(() => ({}));
    if (fx && fx.fix && fx.fix.pay_url) { setCall({ payEmail: em, payFix: true, fixUrl: fx.fix.pay_url, payErr: fx.fix.reason || "" }); setUI({ trialFind: false, tfMsg: "" }); return; }
    setUI({ tfMsg: "No live $1 trial or saved card on " + em });
  } catch (e) { setUI({ tfMsg: "Lookup failed: " + e.message }); }
}
async function differentCard() {
  const em = S.call.payEmail || S.call.email || "";
  if (!hasKey()) return toast("Connect Poppy first");
  if (!em) return toast("Add their email first");
  setCall({ payFix: true, fixHello: true, fixUrl: "", payErr: "" });
  try {
    let url = "";
    if (isLife()) url = (await api("/api/lifetime", { action: "checkout", email: clean(em), hosted: true, amount: Math.round(dealPrice().due), clicked_by: "customer", name: S.call.name || "", ...(planKeyOf(S.call.offerId) ? { plan: planKeyOf(S.call.offerId) } : {}) }).catch(() => ({}))).url || "";
    if (!url) url = ((await api("/api/cardfix?email=" + encodeURIComponent(clean(em))).catch(() => ({}))).fix || {}).pay_url || "";
    if (!url) { await link(); url = S.call.payUrl || ""; }
    setCall({ fixUrl: url, payErr: url ? "" : "Couldn't make a secure page for this one" });
  } catch (e) { setCall({ payErr: String(e.message || e) }); }
}
// Mo's group bonus (getpoppy.ai/mo/cadence, 2026-10-28): rocket climbs, credits count up, coins burst, ladder of names
let jp = null; // { lv, at, n, from: {at, w, n}, changedAt, openedAt, coinAt } while the meter is open
export const jpClosed = () => { jp = null; };
function jackpot(people) {
  const paidBy = S.call.paidBy || {}, inP = people.filter(p => paidBy[clean(p.email)]), inN = inP.length, cap = Math.min(people.length, 3), lv = Math.min(inN, cap), total = Math.max(lv, 1) * 500;
  const pts = [[7, 90], [38, 74], [64, 52], [88, 32]].slice(0, cap + 1), at = pts[Math.min(lv, cap)] || pts[pts.length - 1];
  const path = "M 0 100 L " + pts.map(([x, y]) => x + " " + y).join(" L ");
  const now = Date.now(), n = lv ? total : 0;
  // this deck redraws everything on each change, so the meter remembers where it was and animates from there
  if (!jp) jp = { lv, at, n, from: { at, w: lv ? at[0] : 0, n: 0 }, changedAt: now, openedAt: now, coinAt: lv ? now + 450 : 0 };
  else if (jp.lv !== lv) jp = { ...jp, from: { at: jp.at, w: jp.lv ? jp.at[0] : 0, n: jp.n }, lv, at, n, changedAt: now, coinAt: lv > jp.lv ? now : jp.coinAt };
  const fresh = now - jp.changedAt < 300, st = fresh ? jp.from : { at, w: lv ? at[0] : 0, n };
  if (fresh) {
    const t0 = jp.changedAt, a = jp.from.n, b = n;
    setTimeout(() => {
      document.querySelectorAll(".jp.cr .cr-rocket").forEach(r => { r.style.left = at[0] + "%"; r.style.top = at[1] + "%"; });
      document.querySelectorAll(".jp.cr #crc rect").forEach(c => c.setAttribute("width", lv ? at[0] : 0));
    }, 40);
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / 1300), v = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)));
      document.querySelectorAll(".jp.cr .cr-mult b .n").forEach(el => { el.textContent = v.toLocaleString(); });
      if (k < 1 && jp) setTimeout(tick, 16);
    };
    setTimeout(tick, 0);
  }
  if (jp.coinAt > now) setTimeout(() => { if (jp && ui().jackpot) render(); }, jp.coinAt - now + 10);
  const coins = lv && jp.coinAt && now >= jp.coinAt && now - jp.coinAt < 1600, stay = now - jp.openedAt > 300;
  const rungs = Array.from({ length: cap }).map((_, i) => cap - 1 - i).map(r => {
    const who = inP[r], on = r < lv, next = r === lv;
    return h("div", { class: "cr-rung" + (on ? " on" : next ? " next" : "") + (r ? "" : " last") + (on ? " lit" : "") },
      h("div", { class: "cr-dot" }, on ? "✓" : ""),
      h("div", { class: "cr-rt" }, h("b", {}, "+" + ((r + 1) * 500).toLocaleString(), h("small", {}, "/mo")),
        h("span", {}, on ? firstName(who.name || who.email) + " is in" : next ? (r ? "the next one in" : "the first one in") : (r + 1) + " people in")));
  });
  return h("div", { class: "jp cr lv" + (lv >= cap && cap > 1 ? 3 : Math.min(lv, 2)) + (stay ? " stay" : ""), onclick: (e) => { stop(e); setUI({ jackpot: false }); } },
    h("div", { class: "cr-box" },
      h("div", { class: "cr-sky" }, h("div", { class: "cr-stars" }), h("div", { class: "cr-live" }, h("i"), "LIVE · " + inN + " of " + people.length + " in"),
        h("svg", { class: "cr-svg", viewBox: "0 0 100 100", preserveAspectRatio: "none", html: '<defs><linearGradient id="crg" x1="0" x2="1"><stop offset="0" stop-color="#4ADE97" stop-opacity=".2"></stop><stop offset="1" stop-color="#4ADE97"></stop></linearGradient><clipPath id="crc"><rect x="0" y="0" height="100" width="' + st.w + '" style="transition:width 1.6s cubic-bezier(.3,1,.3,1)"></rect></clipPath></defs><path d="' + path + '" class="cr-ghost"></path><path d="' + path + '" class="cr-line" clip-path="url(#crc)"></path>' }),
        h("div", { class: "cr-rocket", style: { left: st.at[0] + "%", top: st.at[1] + "%" } }, h("span", {}, "🚀")),
        h("div", { class: "cr-mult" }, h("b", {}, "+", h("span", { class: "n" }, st.n.toLocaleString()), h("small", {}, "/mo")), h("span", {}, lv ? "bonus credits for everyone in" : "the first person in unlocks +500")),
        coins ? h("div", { class: "jk-coins", style: { left: at[0] + "%", top: at[1] + "%" } }, Array.from({ length: 12 }).map((_, i) => h("i", { style: { "--a": i * 30 + "deg", "--d": (i % 3) * 60 + "ms" } }, i % 2 ? "🪙" : "✨"))) : null),
      h("div", { class: "cr-alt cr-lad" }, h("div", { class: "cr-althead" }, "Bonus levels"), h("div", { class: "cr-rungs" }, rungs)),
      h("div", { class: "cr-foot" },
      h("div", { class: "cr-rule" }, "Each person who joins adds ", h("b", {}, "+500 credits a month"), ", for ", h("b", {}, "everyone"), " in the group."),
      h("div", { class: "cr-players" }, people.map(p => { const on = !!paidBy[clean(p.email)]; return h("div", { class: "cr-p" + (on ? " on" : "") }, h("i", {}, on ? "✓" : (firstName(p.name || p.email) || "?")[0]), h("b", {}, firstName(p.name || p.email)), h("small", {}, on ? "in" : "not yet")); })),
      h("div", { class: "cr-next" }, lv >= cap ? ["🎉 Everyone gets ", h("b", {}, "+" + total.toLocaleString() + "/mo")] : lv ? ["One more in → everyone gets ", h("b", {}, "+" + ((lv + 1) * 500).toLocaleString() + "/mo")] : ["First one in → ", h("b", {}, "+500/mo")]))));
}

// ---------- 4 · gameplan / celebrate ----------
const mailto = (to, subject, body) => `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
function gameplan() {
  const g = d().gameplan, n = nm();
  const body = [g.title, "", ...g.cards.map(c => `${c.i} ${c.b}: ${c.s}`), "", g.promise, "", "Killian"].join("\n");
  return h("div", { class: "dk-gp", onclick: stop },
    h("img", { class: "mascot sec", src: "assets/poppy-mascot-hd.png", alt: "", onclick: () => setCall({ party: true }) }),
    h("h1", {}, n ? `${n}, ${g.title.replace("Here's", "here's")}` : g.title),
    h("div", { class: "cards" }, g.cards.map(c => h("div", { class: "c", style: { "--d": c.d } }, h("i", {}, c.i), h("div", {}, h("b", {}, c.b), h("span", {}, c.s))))),
    h("p", { class: "promise" }, g.promise),
    h("div", { class: "send" }, h("a", { href: mailto(S.call.payEmail || S.call.email, "Your game plan", body), target: "_blank", rel: "noreferrer" }, g.send)));
}
function party() {
  const p = d().party, n = nm(), people = groupPeople();
  return h("div", { class: "dk-party ob" },
    h("div", { class: "confetti" }, Array.from({ length: 48 }, (_, i) => h("i", { style: { "--x": String(i * 37 % 100), "--d": (i % 12 * 0.16) + "s", "--c": ["#A78BFA", "#F5C64F", "#4ADE97", "#FF8FA3"][i % 4], "--r": (i * 53 % 360) + "deg" } }))),
    h("img", { class: "mascot sec", src: "assets/poppy-mascot-hd.png", alt: "", onclick: (e) => { stop(e); setCall({ party: false }); } }),
    h("h1", {}, (people ? "You're all in" : n ? `${n}, you're in` : p.title) + " 🎉"),
    h("p", {}, p.sub),
    h("div", { class: "pills" }, p.pills.map(x => h("span", {}, x))),
    h("div", { class: "dk-welcome" }, h("a", { href: mailto(S.call.payEmail || S.call.email, "Welcome to Poppy", `${n ? n + ", y" : "Y"}ou're in. Your account is live. The Academy and your resources are on the way.\n\nKillian`), target: "_blank", rel: "noreferrer" }, "💌 Send the welcome email · Academy + resources")));
}

// ---------- 5 · review ----------
function review() {
  const r = d().review, n = nm(), c = S.call, url = r.url;
  const phone = c.phone || "";
  const sms = phone ? `sms:${phone}&body=${encodeURIComponent(r.sms.replace("{name}", n || "Hey").replace("{url}", url))}` : "";
  return h("div", { class: "dk-review" },
    h("div", { class: "dk-l" }, h("p", { class: "dk-eye gold" }, r.eye), h("h2", {}, r.title), h("p", { class: "ask" }, r.ask),
      h("div", { class: "acts" }, h("button", { onclick: (e) => { stop(e); copy(url, "Review link copied"); } }, r.copy), sms ? h("a", { class: "ghost", href: sms, onclick: stop }, r.text.replace("{name}", n || "them")) : null)),
    h("div", { class: "dk-r" }, h("img", { class: "tp", src: "assets/trustpilot.svg", alt: "Trustpilot" }),
      h("div", { class: "qr" }, h("img", { src: QR(url, 520), alt: "Scan to review" }), h("small", {}, r.scan))));
}
