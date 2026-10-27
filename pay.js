import { h, S, content, setPay, money, money2, field, seg, copy, eyebrow } from "./core.js";

const HOW = [["full", "Pay in full"], ["2", "2 payments"], ["3", "3 payments"], ["6", "6 payments"], ["monthly", "Monthly"], ["yearly", "Yearly"], ["custom", "Custom"]];

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

export function renderPay() {
  const d = S.deck, p = S.pay;
  const offers = content().offers;
  const m = payMath();
  const label = m.n === 1 ? "today" : `× ${m.n}, every ${m.every}`;
  const link = ((d.payLinks || {})[p.offerId] || {})[m.n === 1 ? "full" : String(m.n)] || "";
  const name = p.name || (m.o ? m.o.name : "");

  const left = h("div", {},
    h("div", { class: "card" }, h("h4", {}, "Who's paying?"),
      h("input", { class: "wide", value: p.who, placeholder: "Name or email (optional, for the message you copy)", onchange: (e) => setPay({ who: e.target.value }) })),
    h("div", { class: "card" }, h("h4", {}, "What"),
      h("div", { class: "pay-grid" }, offers.map(o => h("button", { class: "payOffer" + (o.id === p.offerId ? " on" : ""), onclick: () => setPay({ offerId: o.id, total: "", name: "" }) },
        h("span", { class: "em" }, d.emoji[o.id] || "•"), h("b", {}, d.short[o.id] === "Year" ? "The year" : d.short[o.id] === "Life" ? "Lifetime" : o.name.replace(" plan", "").replace("Viral Content System", "VCS").replace("AI build (chatbot · MCP · automation)", "AI build")), h("small", {}, money(o.today)))),
        h("button", { class: "payOffer" + (p.offerId === "other" ? " on" : ""), onclick: () => setPay({ offerId: "other" }) }, h("span", { class: "em" }, "➕"), h("b", {}, "Other"), h("small", {}, "any"))),
      field("Name on the checkout", name, (v) => setPay({ name: v })),
      eyebrow("Pay with"),
      seg([["stripe", "Stripe · cards, Apple Pay"], ["whop", "Whop · PayPal, Klarna, Splitit"]], p.rail, (v) => setPay({ rail: v })),
      eyebrow("How they pay"),
      h("div", { class: "chips" }, HOW.map(([id, l]) => h("button", { class: "chip" + (p.how === id ? " on" : ""), onclick: () => setPay({ how: id }) }, l,
        /^\d+$/.test(id) ? h("small", {}, " " + money2(m.due / +id) + "/mo") : null))),
      p.how === "custom" ? h("div", { class: "row" }, field("Payments", p.n, (v) => setPay({ n: v }), { type: "number" }), seg([["week", "weekly"], ["month", "monthly"], ["year", "yearly"]], p.every, (v) => setPay({ every: v }))) : null,
      h("div", { class: "row" }, field("Total", m.total, (v) => setPay({ total: v }), { type: "number" }), field("Already paid", p.paid, (v) => setPay({ paid: v }), { type: "number" }))));

  const msg = `${p.who ? p.who.split("@")[0].split(" ")[0] + ", here's" : "Here's"} your link for ${name}: ${money2(m.each)} ${m.n === 1 ? "today" : `× ${m.n} (${money(m.due)} total)`}${link ? "\n" + link : ""}`;
  const right = h("div", { class: "card they" }, h("h4", {}, "They pay"),
    h("div", { class: "tp-name" }, (d.emoji[p.offerId] || "➕") + " " + name),
    h("div", { class: "tp-price" }, money2(m.each), h("small", {}, " " + label)),
    m.paid ? h("div", { class: "muted" }, `${money(m.total)} total · ${money(m.paid)} already paid`) : null,
    h("div", { class: "muted" }, p.rail === "stripe" ? "Stripe · any card, Apple Pay" : "Whop · PayPal, Klarna, Splitit"),
    link ? h("button", { class: "presentBtn wide", onclick: () => copy(link, "Link copied") }, "🔗 Copy the link") : h("button", { class: "presentBtn wide", disabled: true }, "🔗 Make the link"),
    h("button", { class: "pill wide", onclick: () => copy(msg, "Message copied") }, "Copy a message for the chat"),
    S.practice ? h("div", { class: "muted small" }, "Practice is on. Nothing here is real money.") : null,
    !link ? h("div", { class: "muted small" }, "Making links needs Poppy's backend (Mo's page). Until then, add a Stripe Payment Link for this offer and plan in deck.json → payLinks, and this button copies it.") : null);

  return h("div", { class: "pay" }, h("h1", { class: "big" }, "Get ", h("span", { class: "accent" }, "Paid")), h("div", { class: "pay-grid2" }, left, right));
}
