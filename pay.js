import { h, S, content, setPay, money, money2, copy, toast, render } from "./core.js";
import { hasKey, bootProducts, searchCustomers, makeLink, catalogId } from "./poppy.js";

const HOW = [["full", "Pay in full"], ["2", "2 payments"], ["3", "3 payments"], ["6", "6 payments"], ["monthly", "Monthly"], ["yearly", "Yearly"], ["custom", "Custom"]];
const P = { products: null, hits: [], searching: false, busy: false, err: "", link: null };

export function payMath() {
  const p = S.pay;
  const o = content().offers.find(x => x.id === p.offerId);
  const total = p.total !== "" && p.total != null ? +p.total : (o ? o.today : 0);
  const paid = +p.paid || 0;
  const due = Math.max(total - paid, 0);
  let n = 1, every = "";
  if (/^\d+$/.test(p.how)) { n = +p.how; every = "month"; }
  else if (p.how === "monthly") { n = 12; every = "month"; }
  else if (p.how === "yearly") { n = 1; every = "year"; }
  else if (p.how === "custom") { n = Math.max(1, +p.n || 1); every = p.every || "month"; }
  return { o, total, paid, due, n, every, each: due / n };
}

let searchT = null;
function onWho(v) {
  S.pay.who = v; P.link = null;
  clearTimeout(searchT);
  if (!hasKey() || v.trim().length < 2) { P.hits = []; render(); return; }
  P.searching = true;
  searchT = setTimeout(async () => { try { P.hits = (await searchCustomers(v.trim())).slice(0, 6); } catch { P.hits = []; } P.searching = false; render(); }, 350);
}
const pick = (c) => { P.hits = []; setPay({ who: c.name || c.email, email: c.email }); };

async function make() {
  const m = payMath(); const p = S.pay;
  const custom = p.offerId === "other";
  const offer = custom ? { id: "other", name: p.name || "Poppy", deck: "custom" } : m.o;
  const name = p.name || offer.name;
  P.busy = true; P.err = ""; P.link = null; render();
  try {
    const r = await makeLink({ offer, email: p.email, name, amount: m.due, processor: p.rail, how: p.how, n: p.n, every: p.every, productId: custom ? (p.product || "") : (p.product || undefined), productName: name, note: m.paid > 0 ? "remaining balance" : "" });
    P.link = r; toast("Link ready");
  } catch (e) { P.err = String(e.message || e); }
  P.busy = false; render();
}

export function renderPay() {
  const d = S.deck, p = S.pay, offers = content().offers, m = payMath(), connected = hasKey();
  if (connected && !P.products) { P.products = { stripe: [], whop: [] }; bootProducts().then(x => { P.products = x; render(); }).catch(() => {}); }
  const staticLink = ((d.payLinks || {})[p.offerId] || {})[m.n === 1 ? "full" : String(m.n)] || "";
  const name = p.name || (m.o ? m.o.name : "");
  const shortName = (o) => d.short[o.id] === "Year" ? "The year" : d.short[o.id] === "Life" ? "Lifetime" : o.name.replace(" plan", "").replace("Viral Content System", "VCS").replace("AI build (chatbot · MCP · automation)", "AI build");
  const url = (P.link && P.link.url) || staticLink;
  const msg = `${p.who ? p.who.split("@")[0].split(" ")[0] + ", here's" : "Here's"} your link for ${name}: ${money2(m.each)} ${m.n === 1 ? "today" : `× ${m.n} (${money(m.due)} total)`}${url ? "\n" + url : ""}`;

  const left = h("div", { class: "gp3-l" },
    h("div", { class: "gp3-card" }, h("div", { class: "gp3-search" },
      h("svg", { viewBox: "0 0 24 24", html: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>' }),
      h("input", { value: p.who || "", placeholder: "Who's paying? (optional, skip it for a plain link)", oninput: (e) => onWho(e.target.value) })),
      P.searching ? h("div", { class: "gp3-hint" }, "Searching Stripe…") : null,
      P.hits.length ? h("div", { class: "gp3-hits" }, P.hits.map(c => h("button", { onclick: () => pick(c) }, h("b", {}, c.name || "(no name)"), h("em", {}, c.email)))) : null,
      p.email ? h("div", { class: "gp3-hint" }, "Link will carry ", p.email, " ", h("button", { class: "lnk", onclick: () => setPay({ email: "" }) }, "×")) : null),
    h("div", { class: "gp3-card" },
      h("div", { class: "gp3-h" }, "What"),
      h("div", { class: "gp3-prods" }, offers.map(o => h("button", { class: o.id === p.offerId ? "on" : "", onclick: () => { P.link = null; setPay({ offerId: o.id, total: "", name: "", product: "" }); } },
        h("span", {}, d.emoji[o.id] || "•"), h("b", {}, shortName(o)), h("em", {}, money(o.today)))),
        h("button", { class: p.offerId === "other" ? "on" : "", onclick: () => { P.link = null; setPay({ offerId: "other", product: "" }); } }, h("span", {}, "➕"), h("b", {}, "Other"), h("em", {}, "any"))),
      h("div", { class: "gp3-what" },
        h("label", {}, h("span", {}, "Name on the checkout"), h("input", { class: "gp3-in", value: name, placeholder: "Type what it's for (e.g. Pete AI build, 2nd payment)", onchange: (e) => setPay({ name: e.target.value }) })),
        h("label", {}, h("span", {}, "Stripe product"), h("select", { class: "gp3-in", disabled: !connected, onchange: (e) => setPay({ product: e.target.value }) },
          h("option", { value: "", selected: !p.product && p.offerId === "other" }, "None, just the name"),
          (connected ? P.products.stripe : []).map(x => h("option", { value: x.id, selected: (p.product || catalogId(m.o, "stripe")) === x.id }, x.name || x.id))))),
      h("div", { class: "gp3-h" }, "Pay with"),
      h("div", { class: "gp3-seg" },
        h("button", { class: p.rail === "stripe" ? "on" : "", onclick: () => { P.link = null; setPay({ rail: "stripe" }); } }, h("b", {}, "Stripe"), h("em", {}, "cards · Apple Pay")),
        h("button", { class: p.rail === "whop" ? "on" : "", onclick: () => { P.link = null; setPay({ rail: "whop" }); } }, h("b", {}, "Whop"), h("em", {}, "PayPal · Klarna · Splitit"))),
      h("div", { class: "gp3-h" }, "How they pay"),
      h("div", { class: "gp3-shapes" }, HOW.map(([id, l]) => h("button", { class: p.how === id ? "on" : "", onclick: () => { P.link = null; setPay({ how: id }); } }, h("b", {}, l), /^\d+$/.test(id) ? h("em", {}, money2(m.due / +id) + "/mo") : null))),
      p.how === "custom" ? h("div", { class: "gp3-amts" },
        h("label", {}, h("span", {}, "Payments"), h("div", { class: "m" }, h("input", { type: "number", value: p.n, onchange: (e) => setPay({ n: e.target.value }) }))),
        h("label", {}, h("span", {}, "Every"), h("select", { class: "gp3-in", onchange: (e) => setPay({ every: e.target.value }) }, ["week", "month", "year"].map(x => h("option", { value: x, selected: p.every === x }, x))))) : null,
      h("div", { class: "gp3-amts" },
        h("label", {}, h("span", {}, "Total"), h("div", { class: "m" }, h("i", {}, "$"), h("input", { value: m.total, onchange: (e) => { P.link = null; setPay({ total: e.target.value }); } }))),
        h("label", {}, h("span", {}, "Already paid"), h("div", { class: "m" }, h("i", {}, "$"), h("input", { value: p.paid, placeholder: "0", onchange: (e) => { P.link = null; setPay({ paid: e.target.value }); } }))))));

  const right = h("div", { class: "gp3-r" }, h("div", { class: "gp3-rcpt" },
    h("div", { class: "gp3-h" }, "They pay"),
    h("div", { class: "rc-prod" }, h("span", {}, d.emoji[p.offerId] || "➕"), h("b", {}, name)),
    h("div", { class: "rc-line" }, h("b", {}, money2(m.each)), h("span", {}, m.n === 1 ? "today" : `× ${m.n}, every ${m.every}`)),
    m.paid ? h("div", { class: "rc-paid" }, `${money(m.paid)} already paid · ${money(m.total)} total`) : null,
    h("div", { class: "rc-via" }, p.rail === "stripe" ? (m.n > 1 ? `Stripe · ${m.n} monthly charges` : "Stripe · any card, Apple Pay") : (m.n > 1 ? "Whop · Splitit at checkout" : "Whop · PayPal, Klarna, Splitit")),
    P.err ? h("p", { class: "gp3-err" }, P.err) : null,
    connected ? h("button", { class: "gp3-btn", disabled: P.busy, onclick: make }, P.busy ? "Making the link…" : url && P.link ? "🔗 Make a fresh link" : "🔗 Make the link")
      : h("button", { class: "gp3-btn", disabled: true }, "🔗 Make the link"),
    url ? h("div", { class: "gp3-link" }, h("a", { href: url, target: "_blank", rel: "noreferrer" }, url.replace(/^https?:\/\//, "").slice(0, 56) + (url.length > 64 ? "…" : "")),
      h("div", { class: "gp3-acts" }, h("button", { onclick: () => copy(url, "Link copied") }, "Copy link"), h("button", { onclick: () => copy(msg, "Message copied") }, "Copy a message")),
      P.link && P.link.note ? h("small", {}, P.link.note) : null) : null,
    S.practice ? h("p", { class: "gp3-note" }, "🧪 Practice is on: links are made in Stripe test mode.") : null,
    !connected ? h("p", { class: "gp3-note" }, "Connect Poppy (○ Poppy, top right) to make links here.") : null));

  return h("div", { class: "gp3" },
    h("div", { class: "gp3-top" }, h("img", { src: "assets/poppy-mascot-hd.png", alt: "" }), h("h1", {}, "Get ", h("span", { class: "grad" }, "Paid"))),
    h("div", { class: "gp3-grid" }, left, right));
}
