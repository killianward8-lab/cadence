// The slides, built with Mo's exact markup and classes (deck-mo.css is his stylesheet).
import { h, S, content, offer, dealPrice, planMonths, money, fmtDay, firstName, copy, setCall, render, toast } from "./core.js";
import { hasKey, clean } from "./poppy.js";
import { charge, link, lookupCard, cardInfo } from "./deck.js";

export const slideList = () => ["cover", "offer", "pay", S.call.party ? "celebrate" : "gameplan", "review"];
export const slideId = (i = S.slide) => slideList()[Math.max(0, Math.min(i, 4))];
const d = () => S.deck.ob;
const nm = () => (S.call.mode === "one" && S.call.name ? firstName(S.call.name) : "");
const isLife = () => offer().id === "life";
const isOb = () => offer().deck === "ob";

// ---------- steps: ArrowRight / click right half ----------
// The offer slide reveals bonus 1, 2, 3, then the price, one press each. Everything else moves a slide.
export function step(dir) {
  const id = slideId();
  if (dir > 0) {
    if (id === "offer" && isOb()) {
      if ((S.step || 0) < 4) { S.step = (S.step || 0) + 1; return applyStep(); }
    }
    if (S.slide < 4) { S.slide++; S.step = 0; S.zoom = null; return render(); }
    return;
  }
  if (id === "offer" && (S.step || 0) > 0) { S.step--; return applyStep(); }
  if (S.slide > 0) { S.slide--; S.step = slideId() === "offer" ? 4 : 0; S.zoom = null; render(); }
}
// A step inside the offer slide must not rebuild the slide: the bonus flip and the price
// slide-up are CSS transitions, and they only play when the class changes on the same element.
function applyStep() {
  const boxes = document.querySelectorAll(".dk-offer3");
  if (!boxes.length) return render();
  const st = S.step || 0;
  boxes.forEach(box => {
    box.querySelectorAll(".bonus").forEach((b, i) => b.classList.toggle("open", st > i));
    box.classList.toggle("priced", st >= 4);
    const pr = box.querySelector(".o-price"); if (pr) pr.classList.toggle("in", st >= 4);
  });
  document.querySelectorAll("#present .dk-tools .nav .ic").forEach((b, i) => { if (i === 0) b.disabled = S.slide === 0 && !(st > 0); });
}
export const jump = (i) => { S.slide = Math.max(0, Math.min(i, 4)); S.step = 0; S.zoom = null; render(); };

// ---------- the frame every slide shares ----------
const wrap = (cls, body) => h("div", { class: "dk-slide " + cls },
  h("i", { class: "dk-orb a" }), h("i", { class: "dk-orb b" }),
  h("div", { class: "dk-top" },
    h("span", { class: "dk-brand" }, h("img", { src: "assets/poppy-mark.png", alt: "" }), "Poppy"),
    h("span", { class: "dk-for" }, nm() ? nm() + " × Poppy" : "getpoppy.ai")),
  h("div", { class: "dk-body" }, body));

export function renderSlide(i = S.slide) {
  const id = slideId(i);
  if (id === "cover") return wrap("cover", cover());
  if (id === "offer") return wrap("", isOb() ? offerOb() : offerOther());
  if (id === "pay") return wrap("", pay());
  if (id === "gameplan") return wrap("center gp", gameplan());
  if (id === "celebrate") return wrap("center party", party());
  return wrap("", review());
}

// ---------- 1 · cover ----------
function cover() {
  const c = S.call, o = offer(), renew = content().offers.find(x => x.id === "renew");
  const n = nm();
  if (isOb()) return h("div", { class: "dk-obcover" },
    h("p", { class: "dk-eye" }, n ? `${n}, where you're at` : "Where you're at"),
    h("h1", {}, n ? `${n}, you're on the $1 trial.` : "You're on the $1 trial."),
    h("div", { class: "facts" },
      h("div", {}, h("small", {}, "Trial started"), h("b", {}, fmtDay(c.trialStart))),
      h("div", {}, h("small", {}, "Renews"), h("b", {}, fmtDay(c.renews))),
      h("div", {}, h("small", {}, "Renews at"), h("b", {}, `${money(renew ? renew.list : 399)} for the year`))),
    h("p", { class: "bridge" }, S.deck.cover.next));
  return h("div", { class: "dk-obcover" },
    h("p", { class: "dk-eye" }, n ? `${n}, where you're at` : "Where you're at"),
    h("h1", {}, n ? `${n}, here's where you're at.` : "Here's where you're at."),
    c.deal ? h("div", { class: "pills" }, c.deal.split("\n").filter(Boolean).slice(0, 4).map(s => h("span", {}, s))) : null,
    h("p", { class: "bridge" }, S.deck.cover.next));
}

// ---------- 2 · offer (OB: year / life, with the bonus reveal) ----------
function planWords() {
  const p = S.call.payPlan, price = dealPrice();
  if (p === "whop") return { big: money(Math.ceil(price.today / 6)) + "/mo", sub: "6 months, 0% interest" };
  if (p === "clarity") return { big: money(Math.ceil(price.today / 24)) + "/mo", sub: `24 months, or ${money(Math.ceil(price.today / 12))}/mo for 12` };
  return null;
}
function cyclePlan() {
  const ids = Object.keys(S.deck.plans); setCall({ payPlan: ids[(ids.indexOf(S.call.payPlan) + 1) % ids.length] });
}
function offerOb() {
  const o = offer(), c = S.call, ob = d(), price = dealPrice(), life = isLife();
  const step = S.step || 0;
  const stack = (o.stack || "").split("\n").filter(Boolean);
  const wait = life ? ob.wait.life : ob.wait.renew;
  const plan = planWords();
  const bonuses = ob.bonuses.map((b, i) => h("div", { class: "bonus" + (step > i ? " open" : "") },
    h("div", { class: "lock" }, h("span", {}, "🎁"), h("b", {}, b.tag)),
    h("div", { class: "face" },
      h("div", { class: "art", style: { background: b.art.bg }, onclick: (e) => { e.stopPropagation(); if (b.pics.length) { S.zoom = { k: b.k, pic: 0 }; render(); } } }, b.art.e),
      h("div", { class: "t" }, h("small", {}, `${b.tag} · ${b.value}`), h("b", {}, b.title), h("span", {}, b.line)))));
  const priceBox = h("div", { class: "o-price choice" + (step >= 4 ? " in" : "") },
    h("div", { class: "path wait" }, h("small", {}, wait.small), h("b", {}, wait.big),
      h("span", {}, life ? wait.sub : (c.renews ? wait.sub.replace("{renews}", fmtDay(c.renews)) : wait.subNoDate)), h("em", {}, wait.em)),
    h("div", { class: "vs" }, "or"),
    h("div", { class: "path today", title: "tap to switch the payment plan", onclick: (e) => { e.stopPropagation(); cyclePlan(); } },
      h("small", {}, ob.today.small),
      plan ? [h("b", {}, plan.big), h("span", {}, plan.sub)]
        : [h("b", {}, money(price.today), life ? h("i", {}, " once") : null), h("span", {}, life ? ob.today.lifeSub : ob.today.renewSub.replace("{monthly}", String(Math.round(price.today / 12))))],
      h("em", {}, ob.today.em)),
    h("div", { class: "col proof" },
      h("div", { class: "faces" }, ob.proof.faces.map(u => h("img", { src: u, alt: "" }))),
      h("span", { class: "st" }, ob.proof.stars + " ", h("b", {}, ob.proof.creators)),
      h("span", { class: "gu" }, ob.proof.guarantee)));
  const el = h("div", { class: "dk-offer3" + (step >= 4 ? " priced" : "") },
    h("div", { class: "o-l" },
      h("p", { class: "dk-eye gold" }, "Only on this call"),
      h("h2", {}, o.name),
      h("p", { class: "tagline" }, ob.taglines[o.id] || ""),
      h("ul", { class: "core" }, stack.map(s => h("li", {}, h("i", {}, "✓"), h("span", {}, s))))),
    h("div", { class: "o-r" }, h("p", { class: "bh" }, ob.bonusHead), bonuses),
    priceBox);
  if (S.zoom) el.append(zoomBox());
  return el;
}
function zoomBox() {
  const b = d().bonuses.find(x => x.k === S.zoom.k); if (!b) return null;
  const pic = Math.max(0, Math.min(S.zoom.pic || 0, b.pics.length - 1));
  return h("div", { class: "bx-wrap", onclick: (e) => { e.stopPropagation(); S.zoom = null; render(); } },
    h("div", { class: "bx", onclick: (e) => e.stopPropagation() },
      h("div", { class: "bx-pic" }, b.pics.length ? h("img", { src: b.pics[pic], alt: "", onclick: () => { S.zoom.pic = (pic + 1) % b.pics.length; render(); } }) : null,
        b.pics.length > 1 ? h("div", { class: "bx-dots" }, b.pics.map((_, i) => h("i", { class: i === pic ? "on" : "" }))) : null),
      h("div", { class: "bx-t" },
        h("small", {}, `${b.tag} · ${b.value}`), h("b", {}, b.title), h("p", {}, b.note || b.line),
        h("ul", {}, b.points.map(p => h("li", {}, p))),
        b.link ? h("a", { href: b.link[0], target: "_blank", rel: "noreferrer", onclick: (e) => e.stopPropagation() }, b.link[1]) : null,
        h("button", { class: "x", onclick: () => { S.zoom = null; render(); } }, "✕"))));
}
// Non-OB offers (plans, coaching, build): the same slide without the bonus reveal.
function offerOther() {
  const o = offer(), price = dealPrice(), ob = d();
  const stack = (o.stack || "").split("\n").filter(Boolean).map(s => s.replace("[coach]", (o.coaches || [])[0] ? firstName(content().coaches.find(c => c.id === o.coaches[0])?.name || "") : "your coach").replace("[calls]", o.calls || "").replace("[the build]", "Your build"));
  const once = o.deck === "coached" || o.deck === "build";
  return h("div", { class: "dk-offer3 priced" },
    h("div", { class: "o-l" }, h("p", { class: "dk-eye gold" }, "Only on this call"), h("h2", {}, o.name), h("p", { class: "tagline" }, o.who || ""),
      h("ul", { class: "core" }, stack.map(s => h("li", {}, h("i", {}, "✓"), h("span", {}, s))))),
    h("div", { class: "o-r" }, o.optional && o.optional.length ? [h("p", { class: "bh" }, "If it came up on the call"), h("ul", { class: "core" }, o.optional.slice(0, 4).map(s => h("li", {}, h("i", {}, "+"), h("span", {}, s.replace(/\s*\(only if.*\)$/, "")))))] : null),
    h("div", { class: "o-price choice in" },
      h("div", { class: "path wait" }, h("small", {}, "Full price"), h("b", {}, money(price.list)), h("span", {}, once ? "" : o.months ? `every ${o.months} months` : ""), h("em", {}, "")),
      h("div", { class: "vs" }, "or"),
      h("div", { class: "path today", title: "tap to switch the payment plan", onclick: (e) => { e.stopPropagation(); cyclePlan(); } },
        h("small", {}, ob.today.small), h("b", {}, money(price.due), once ? h("i", {}, " once") : null),
        h("span", {}, planWords() ? planWords().sub : price.paid ? `${money(price.paid)} already paid` : o.months ? `for ${o.months} months` : ""), h("em", {}, "✓ " + (o.range || o.name))),
      h("div", { class: "col proof" }, h("div", { class: "faces" }, ob.proof.faces.map(u => h("img", { src: u, alt: "" }))),
        h("span", { class: "st" }, ob.proof.stars + " ", h("b", {}, ob.proof.creators)), h("span", { class: "gu" }, ob.proof.guarantee))));
}

// ---------- 3 · pay ----------
let chargeTimer = null;
function pay() {
  const c = S.call, o = offer(), P = d().pay, price = dealPrice(), life = isLife(), n = nm();
  const ci = cardInfo();
  const plan = planWords();
  const left = h("div", { class: "l" },
    S.practice ? h("span", { class: "pr-tag" }, "🧪 PRACTICE · test money") : null,
    h("h2", {}, n ? `${n}, let's get you in` : P.title),
    h("div", { class: "rc" },
      h("div", { class: "ln" }, h("span", {}, o.name), h("b", { class: "ok" }, "✓")),
      isOb() ? h("div", { class: "ln bn" }, h("span", {}, P.bonusLine), h("b", {}, P.included)) : null,
      h("div", { class: "ln tot" }, h("span", {}, P.todayLabel), h("b", {}, plan ? plan.big : money(price.due))),
      h("div", { class: "pm" }, plan ? plan.sub : life ? d().today.lifeSub : isOb() ? d().today.renewSub.replace("{monthly}", String(Math.round(price.today / 12))) : price.paid ? `${money(price.paid)} already paid` : ""),
      h("div", { class: "rc-gu" }, h("svg", { viewBox: "0 0 24 24", html: '<path d="M12 3.2 19 6v5.2c0 4.3-2.9 8-7 9.6-4.1-1.6-7-5.3-7-9.6V6l7-2.8Z"></path><path d="m8.8 12.2 2.2 2.2 4.3-4.6"></path>' }), P.guarantee)));

  const ghost = (text, none) => h("div", { class: "float" }, h("div", { class: "cc ghost" + (none ? " none" : "") },
    h("div", { class: "cc-top" }, h("span", { class: "chip" }), h("span", { class: "bm" }, " ")),
    h("div", { class: "cc-num" }, text),
    h("div", { class: "cc-bot" }, h("div", {}, h("span", {}, (c.name || "").toUpperCase())))));
  const brandClass = (b) => /visa/i.test(b) ? "visa" : /master|mc/i.test(b) ? "mc" : /amex|american/i.test(b) ? "amex" : /link/i.test(b) ? "link" : "";
  const realCard = () => {
    const bc = brandClass(ci.brand || ci.label || "");
    return h("div", { class: "float" }, h("div", { class: "cc" + (bc ? " is-" + bc : "") },
      h("div", { class: "cc-top" }, h("span", { class: "chip" }),
        bc === "mc" ? h("span", { class: "bm mc" }, h("i"), h("i")) : h("span", { class: "bm " + bc }, bc === "visa" ? "VISA" : bc === "amex" ? "AMEX" : bc === "link" ? "Link" : (ci.brand || "CARD").toUpperCase())),
      h("div", { class: "cc-num" }, ci.last4 ? `•••• •••• •••• ${ci.last4}` : (ci.label || "Card on file")),
      h("div", { class: "cc-bot" }, h("div", {}, h("small", {}, "card holder"), h("span", {}, (c.name || "").toUpperCase())), h("div", { class: "exp" }, h("small", {}, "on file"), h("span", {}, ci.trialing ? `trial day ${ci.day}` : "✓"))),
      h("i", { class: "sweep" })));
  };
  const linksBox = () => {
    if (hasKey() && !c.payUrl && !c.linkBusy && !c.payErr && !c.linkTried) { c.linkTried = true; link(); }
    return h("div", { class: "links" },
      h("div", { class: "lrow" + (c.payUrl ? "" : " wait") },
        h("i", { class: "logo" }, h("img", { src: "assets/stripe.svg", alt: "Stripe" })),
        h("div", { class: "t" }, h("b", {}, "Stripe"), h("span", {}, c.payUrl ? c.payUrl.replace(/^https?:\/\//, "") : c.linkBusy ? "making the link…" : c.payErr ? "no link yet" : hasKey() ? "making the link…" : "connect Poppy to make a link")),
        c.payUrl ? h("button", { onclick: (e) => { e.stopPropagation(); copy(c.payUrl, "Link copied"); } }, "Copy link") : null),
      c.payErr ? h("em", { class: "bad" }, "Couldn't make the link: ", c.payErr, " ", h("button", { class: "tiny", onclick: (e) => { e.stopPropagation(); setCall({ payErr: "", payUrl: "", linkTried: false }); } }, "Try again")) : null,
      ci && ci.has ? h("button", { class: "tiny", onclick: (e) => { e.stopPropagation(); setCall({ showLinks: false }); } }, P.backToCard)
        : h("button", { class: "tiny", onclick: (e) => { e.stopPropagation(); lookupCard(); } }, P.checkAgain));
  };
  let right;
  if (c.paidNow) {
    right = [h("div", { class: "float" }, h("div", { class: "cc paid" }, h("div", { class: "pd-ic" }, "✓"), h("b", {}, `${P.paid} · ${money(price.due)}`), h("span", {}, (c.paidHow || "it landed") + " · account updated"))),
      h("button", { class: "tiny undo", onclick: (e) => { e.stopPropagation(); setCall({ paidNow: false, party: false, paidHow: "" }); } }, P.undo)];
  } else if (c.payBusy) {
    const stepN = Math.min(c.chargeStep || 0, P.steps.length - 1);
    if (!chargeTimer) chargeTimer = setInterval(() => { if (!S.call.payBusy) { clearInterval(chargeTimer); chargeTimer = null; return; } S.call.chargeStep = Math.min((S.call.chargeStep || 0) + 1, P.steps.length - 1); render(); }, 1300);
    right = h("div", { class: "dk-charging" },
      h("div", { class: "cc-stage" }, h("div", { class: "cc" },
        h("div", { class: "cc-top" }, h("span", { class: "chip" }), h("b", {}, (ci && ci.brand ? ci.brand : "POPPY").toUpperCase())),
        h("div", { class: "cc-num num" }, "•••• •••• •••• ", (ci && ci.last4) || "••••"),
        h("div", { class: "cc-bot" }, h("span", {}, c.name ? c.name.toUpperCase() : "CARD ON FILE"), h("b", { class: "num" }, money(price.due))),
        h("i", { class: "sweep" }))),
      h("div", { class: "cg-side" }, h("div", { class: "cg-steps" }, P.steps.map((s, i) => h("div", { class: i < stepN ? "done" : i === stepN ? "now" : "" }, h("i", {}, i < stepN ? "✓" : ""), s))), h("div", { class: "cg-bar" }, h("b"))));
  } else if (c.payFix) {
    right = h("div", { class: "fixbox warn" },
      h("div", { class: "fx-h" }, h("div", {}, h("b", {}, P.declined), h("span", {}, P.declinedSub), c.payErr ? h("em", { class: "fx-why" }, "🏦 Bank said: ", c.payErr) : null)),
      c.payUrl ? h("div", { class: "fx-body" },
        h("div", { class: "fx-qrw" }, h("img", { class: "fx-qr", alt: "Scan to pay", src: "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" + encodeURIComponent(c.payUrl) }), h("small", {}, P.scan)),
        h("div", { class: "fx-side" }, h("a", { class: "fx-go", href: c.payUrl, target: "_blank", rel: "noreferrer", onclick: (e) => e.stopPropagation() }, P.open + " ", h("span", {}, "→")),
          h("div", { class: "fx-acts" }, h("button", { onclick: (e) => { e.stopPropagation(); copy(c.payUrl, "Link copied"); } }, "Copy link"), h("button", { onclick: (e) => { e.stopPropagation(); setCall({ payFix: false, payErr: "" }); charge(); } }, "Retry this card"))))
        : h("div", { class: "fx-body wait" }, "Making your secure link…"),
      h("small", { class: "fx-foot" }, P.foot));
  } else if (c.cardBusy) {
    right = ghost(P.finding);
  } else if (ci && ci.has && !c.showLinks) {
    right = [realCard(),
      h("button", { class: "pay", disabled: !hasKey(), onclick: (e) => { e.stopPropagation(); charge(); } }, (life ? P.lockLife : P.lock) + " · " + money(price.due), h("span", { class: "ar" }, "→")),
      c.payErr ? h("em", { class: "bad" }, c.payErr) : null,
      h("button", { class: "tiny", onclick: (e) => { e.stopPropagation(); setCall({ showLinks: true, payErr: "" }); } }, P.linkInstead),
      c.email ? h("p", { class: "cardline" }, "On file under ", h("b", {}, c.email)) : null];
  } else {
    right = [ghost(P.noCard, true),
      h("button", { class: "tiny tc-open", onclick: (e) => { e.stopPropagation(); toast("Taking a new card needs Mo's page or the Sales API"); } }, P.differentCard),
      linksBox()];
  }
  return h("div", { class: "dk-pay one", onclick: (e) => e.stopPropagation() }, left, h("div", { class: "r" }, right));
}

// ---------- 4 · gameplan / celebrate ----------
const mailto = (subject, body) => `mailto:${encodeURIComponent(S.call.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
function gameplan() {
  const g = d().gameplan, n = nm();
  const body = [g.title, "", ...g.cards.map(c => `${c.i} ${c.b}: ${c.s}`), "", g.promise, "", "Killian"].join("\n");
  return h("div", { class: "dk-gp", onclick: (e) => e.stopPropagation() },
    h("img", { class: "mascot sec", src: "assets/poppy-mascot-hd.png", alt: "", onclick: () => setCall({ party: true }) }),
    h("h1", {}, n ? `${n}, ${g.title.replace("Here's", "here's")}` : g.title),
    h("div", { class: "cards" }, g.cards.map(c => h("div", { class: "c", style: { "--d": c.d } }, h("i", {}, c.i), h("div", {}, h("b", {}, c.b), h("span", {}, c.s))))),
    h("p", { class: "promise" }, g.promise),
    h("div", { class: "send" }, h("a", { href: mailto("Your game plan", body), target: "_blank", rel: "noreferrer" }, g.send)));
}
function party() {
  const p = d().party, n = nm();
  return h("div", { class: "dk-party ob" },
    h("div", { class: "confetti" }, Array.from({ length: 48 }, (_, i) => h("i", { style: { "--x": String(i * 37 % 100), "--d": (i % 12 * 0.16) + "s", "--c": ["#A78BFA", "#F5C64F", "#4ADE97", "#FF8FA3"][i % 4], "--r": (i * 53 % 360) + "deg" } }))),
    h("img", { class: "mascot sec", src: "assets/poppy-mascot-hd.png", alt: "", onclick: (e) => { e.stopPropagation(); setCall({ party: false }); } }),
    h("h1", {}, (n ? `${n}, you're in` : p.title) + " 🎉"),
    h("p", {}, p.sub),
    h("div", { class: "pills" }, p.pills.map(x => h("span", {}, x))),
    h("div", { class: "dk-welcome" }, h("a", { href: mailto("Welcome to Poppy", `${n ? n + ", y" : "Y"}ou're in. Your account is live. The Academy and your resources are on the way.\n\nKillian`), target: "_blank", rel: "noreferrer" }, p.welcome)));
}

// ---------- 5 · review ----------
function review() {
  const r = d().review, n = nm(), c = S.call;
  const url = r.url;
  const sms = c.phone ? `sms:${c.phone}&body=${encodeURIComponent(r.sms.replace("{name}", n || "Hey").replace("{url}", url))}` : "";
  return h("div", { class: "dk-review" },
    h("div", { class: "dk-l" },
      h("p", { class: "dk-eye gold" }, r.eye),
      h("h2", {}, r.title),
      h("p", { class: "ask" }, r.ask),
      h("div", { class: "acts" },
        h("button", { onclick: (e) => { e.stopPropagation(); copy(url, "Review link copied"); } }, r.copy),
        sms ? h("a", { class: "ghost", href: sms, onclick: (e) => e.stopPropagation() }, r.text.replace("{name}", n || "them")) : null)),
    h("div", { class: "dk-r" },
      h("img", { class: "tp", src: "assets/trustpilot.svg", alt: "Trustpilot" }),
      h("div", { class: "qr" }, h("img", { src: "https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=0&color=0B0A12&bgcolor=FFFFFF&data=" + encodeURIComponent(url), alt: "Scan to review" }), h("small", {}, r.scan))));
}
