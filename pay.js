import { h, S, content, setPay, money, money2, field, seg, copy, eyebrow, toast, render } from "./core.js";
import { hasKey, bootProducts, searchCustomers, makeLink, clean, catalogId } from "./poppy.js";

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
  const each = due / n;
  return { o, total, paid, due, n, every, each };
}

let searchT = null;
function onWho(v) {
  S.pay.who = v; P.link = null;
  clearTimeout(searchT);
  if (!hasKey() || v.trim().length < 2) { P.hits = []; render(); return; }
  P.searching = true;
  searchT = setTimeout(async () => {
    try { P.hits = (await searchCustomers(v.trim())).slice(0, 6); } catch { P.hits = []; }
    P.searching = false; render();
  }, 350);
}
const pick = (c) => { P.hits = []; setPay({ who: c.name || c.email, email: c.email, name: S.pay.name }); };

async function make() {
  const m = payMath(); const p = S.pay;
  const custom = p.offerId === "other";
  const offer = custom ? { id: "other", name: p.name || "Poppy", deck: "custom" } : m.o;
  const name = p.name || offer.name;
  P.busy = true; P.err = ""; P.link = null; render();
  try {
    const r = await makeLink({ offer, email: p.email, name, amount: m.due, processor: p.rail, how: p.how, n: p.n, every: p.every, productId: custom ? (p.product || "") : (p.product || undefined), productName: name, note: m.paid > 0 ? "remaining balance" : "" });
    P.link = r; toast(r.url ? "Link ready" : "Done");
  } catch (e) { P.err = String(e.message || e); }
  P.busy = false; render();
}

export function renderPay() {
  const d = S.deck, p = S.pay;
  const offers = content().offers;
  const m = payMath();
  const label = m.n === 1 ? "today" : `× ${m.n}, every ${m.every}`;
  const connected = hasKey();
  if (connected && !P.products) { P.products = { stripe: [], whop: [] }; bootProducts().then(x => { P.products = x; render(); }).catch(() => {}); }
  const staticLink = ((d.payLinks || {})[p.offerId] || {})[m.n === 1 ? "full" : String(m.n)] || "";
  const name = p.name || (m.o ? m.o.name : "");
  const shortName = (o) => d.short[o.id] === "Year" ? "The year" : d.short[o.id] === "Life" ? "Lifetime" : o.name.replace(" plan", "").replace("Viral Content System", "VCS").replace("AI build (chatbot · MCP · automation)", "AI build");

  const whoBox = h("div", { class: "card" }, h("h4", {}, "Who's paying?"),
    h("input", { class: "wide", value: p.who || "", placeholder: connected ? "Name or email (optional, skip it for a plain link)" : "Name or email (optional)", oninput: (e) => onWho(e.target.value) }),
    P.searching ? h("div", { class: "muted small" }, "Searching Stripe…") : null,
    P.hits.length ? h("div", { class: "hits" }, P.hits.map(c => h("button", { class: "hit", onclick: () => pick(c) }, h("b", {}, c.name || "(no name)"), h("small", {}, c.email)))) : null,
    p.email ? h("div", { class: "muted small" }, "Link will carry ", p.email, " ", h("button", { class: "cp", onclick: () => setPay({ email: "" }) }, "×")) : null);

  const left = h("div", {}, whoBox,
    h("div", { class: "card" }, h("h4", {}, "What"),
      h("div", { class: "pay-grid" }, offers.map(o => h("button", { class: "payOffer" + (o.id === p.offerId ? " on" : ""), onclick: () => { P.link = null; setPay({ offerId: o.id, total: "", name: "", product: "" }); } },
        h("span", { class: "em" }, d.emoji[o.id] || "•"), h("b", {}, shortName(o)), h("small", {}, money(o.today)))),
        h("button", { class: "payOffer" + (p.offerId === "other" ? " on" : ""), onclick: () => { P.link = null; setPay({ offerId: "other", product: "" }); } }, h("span", { class: "em" }, "➕"), h("b", {}, "Other"), h("small", {}, "any"))),
      h("div", { class: "row" },
        field("Name on the checkout", name, (v) => setPay({ name: v })),
        connected && p.rail === "stripe" ? h("div", { class: "field" }, h("label", {}, "Stripe product"),
          h("select", { onchange: (e) => setPay({ product: e.target.value }) },
            h("option", { value: "", selected: !p.product && p.offerId === "other" }, "None, just the name"),
            (P.products.stripe || []).map(x => h("option", { value: x.id, selected: (p.product || catalogId(m.o, "stripe")) === x.id }, x.name || x.id)))) : null),
      eyebrow("Pay with"),
      seg([["stripe", "Stripe · cards, Apple Pay"], ["whop", "Whop · PayPal, Klarna, Splitit"]], p.rail, (v) => { P.link = null; setPay({ rail: v }); }),
      eyebrow("How they pay"),
      h("div", { class: "chips" }, HOW.map(([id, l]) => h("button", { class: "chip" + (p.how === id ? " on" : ""), onclick: () => { P.link = null; setPay({ how: id }); } }, l,
        /^\d+$/.test(id) ? h("small", {}, " " + money2(m.due / +id) + "/mo") : null))),
      p.how === "custom" ? h("div", { class: "row" }, field("Payments", p.n, (v) => setPay({ n: v }), { type: "number" }), seg([["week", "weekly"], ["month", "monthly"], ["year", "yearly"]], p.every, (v) => setPay({ every: v }))) : null,
      h("div", { class: "row" }, field("Total", m.total, (v) => { P.link = null; setPay({ total: v }); }, { type: "number" }), field("Already paid", p.paid, (v) => { P.link = null; setPay({ paid: v }); }, { type: "number" }))));

  const url = (P.link && P.link.url) || staticLink;
  const msg = `${p.who ? p.who.split("@")[0].split(" ")[0] + ", here's" : "Here's"} your link for ${name}: ${money2(m.each)} ${m.n === 1 ? "today" : `× ${m.n} (${money(m.due)} total)`}${url ? "\n" + url : ""}`;
  const right = h("div", { class: "card they" }, h("h4", {}, "They pay"),
    h("div", { class: "tp-name" }, (d.emoji[p.offerId] || "➕") + " " + name),
    h("div", { class: "tp-price" }, money2(m.each), h("small", {}, " " + label)),
    m.paid ? h("div", { class: "muted" }, `${money(m.total)} total · ${money(m.paid)} already paid`) : null,
    h("div", { class: "muted" }, p.rail === "stripe" ? (m.n > 1 ? `Stripe · ${m.n} monthly charges` : "Stripe · any card, Apple Pay") : (m.n > 1 ? "Whop · Splitit at checkout" : "Whop · PayPal, Klarna, Splitit")),
    P.err ? h("div", { class: "st bad small" }, P.err) : null,
    connected
      ? h("button", { class: "presentBtn wide", disabled: P.busy, onclick: make }, P.busy ? "Making the link…" : url && P.link ? "🔗 Make a fresh link" : "🔗 Make the link")
      : h("button", { class: "presentBtn wide", disabled: true }, "🔗 Make the link"),
    url ? h("div", { class: "linkbox" }, h("a", { href: url, target: "_blank", rel: "noreferrer" }, url.replace(/^https?:\/\//, "").slice(0, 60) + (url.length > 68 ? "…" : "")),
      h("div", { class: "row tight" }, h("button", { class: "chip small", onclick: () => copy(url, "Link copied") }, "⧉ copy link"), h("button", { class: "chip small", onclick: () => copy(msg, "Message copied") }, "⧉ copy a message")),
      P.link && P.link.note ? h("div", { class: "muted small" }, P.link.note) : null) : null,
    S.practice ? h("div", { class: "muted small" }, "🧪 Practice is on: links are made in Stripe test mode.") : null,
    !connected ? h("div", { class: "muted small" }, "Connect Poppy (○ Poppy, top right) to make links here. Or paste Stripe Payment Links into deck.json → payLinks.") : null);

  return h("div", { class: "pay" }, h("h1", { class: "big" }, "Get ", h("span", { class: "accent" }, "Paid")), h("div", { class: "pay-grid2" }, left, right));
}
