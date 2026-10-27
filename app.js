// Killian's Cadence. Plain JS, no build step.
// Reads cadence.json (the script) and deck.json (deck-only copy) from this folder.

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
};
const store = {
  get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const isDirection = (s) => /^\(.*\)$/.test(s.trim());
const fmtDay = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ---------- state ----------
const S = {
  content: null,
  deck: null,
  tab: store.get("kc:tab", "script"),
  stage: store.get("kc:stage", 0),
  vars: store.get("kc:vars", {}),          // stageId -> variantId
  q: "",
  openObj: store.get("kc:obj", null),
  call: Object.assign({ name: "", trialStart: "", renews: "", offerId: "renew", payPlan: "full", payUrl: "", card: true }, store.get("kc:call", {})),
  present: false,
  slide: 0,
};
const save = () => { store.set("kc:tab", S.tab); store.set("kc:stage", S.stage); store.set("kc:vars", S.vars); store.set("kc:call", S.call); store.set("kc:obj", S.openObj); };

// ---------- boot ----------
async function boot() {
  try {
    const [c, d] = await Promise.all([fetch("cadence.json").then(r => r.json()), fetch("deck.json").then(r => r.json())]);
    S.content = c; S.deck = d;
  } catch (e) {
    $("#main").innerHTML = `<div class="empty">Couldn't load cadence.json. If you opened this file directly, run <code>python3 tools/serve.py</code> and open http://localhost:8787</div>`;
    return;
  }
  if (!S.content.offers.some(o => o.id === S.call.offerId)) S.call.offerId = S.content.offers[0].id;
  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setTab(b.dataset.tab); });
  $("#q").addEventListener("input", (e) => { S.q = e.target.value; if (S.tab !== "objections") setTab("objections"); else render(); });
  document.addEventListener("keydown", onKey);
  render();
}
function setTab(t) { S.tab = t; save(); render(); }

// ---------- render ----------
function render() {
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === S.tab));
  const main = $("#main"); main.innerHTML = "";
  if (S.tab === "script") main.append(renderScript());
  if (S.tab === "objections") main.append(renderObjections());
  if (S.tab === "deck") main.append(renderDeck());
  renderPresent();
}

// ---------- script ----------
function variantOf(stage) {
  const want = S.vars[stage.id];
  return stage.variants.find(v => v.id === want) || stage.variants.find(v => v.id === "ob") || stage.variants[0];
}
function renderScript() {
  const stages = S.content.stages;
  S.stage = Math.min(Math.max(S.stage, 0), stages.length - 1);
  const st = stages[S.stage];
  const v = variantOf(st);

  const side = h("aside", { class: "stages" });
  stages.forEach((s, i) => {
    if (s.gate) side.append(h("div", { class: "gate" }, "don't pitch yet"));
    side.append(h("button", { class: i === S.stage ? "on" : "", onclick: () => { S.stage = i; save(); render(); } },
      h("span", { class: "n" }, i < S.stage ? "✓" : s.n), s.name));
  });

  const bar = h("div", { class: "bar" }, stages.map((_, i) => h("i", { class: i <= S.stage ? "done" : "" })));
  const chips = h("div", { class: "chips" }, st.variants.map(x =>
    h("button", { class: "chip" + (x.id === v.id ? " on" : ""), onclick: () => { S.vars[st.id] = x.id; save(); render(); } }, x.label)));
  const lines = v.flow.map((line, i) => h("div", { class: "line" + (isDirection(line) ? " dir" : "") + (i === 0 && !isDirection(line) ? " hot" : "") },
    h("span", { class: "n" }, String(i + 1).padStart(2, "0")), line));
  const center = h("section", { class: "stage" },
    bar,
    h("div", { class: "eyebrow" }, `Stage ${st.n} of ${stages.length}`),
    h("h1", { class: "big" }, st.name),
    st.id === "close" ? h("button", { class: "openDeck", onclick: () => setTab("deck") }, "Open the deck →") : null,
    chips, lines,
    h("div", { class: "hint" }, h("kbd", {}, "←"), h("kbd", {}, "→"), " stages · ", h("kbd", {}, "1"), "–", h("kbd", {}, String(stages.length)), " jump · ", h("kbd", {}, "/"), " search objections"));

  const dig = h("aside", { class: "dig" }, h("h4", {}, "✦ Dig deeper"),
    (S.deck.dig || []).map(([b, s]) => [h("b", {}, b), h("span", {}, s)]));

  return h("div", { class: "script" }, side, center, dig);
}

// ---------- objections ----------
const TAG_CLASS = { Lock: "lock", Solve: "solve", Acknowledge: "ack", Associate: "ack" };
function renderObjections() {
  const all = S.content.objections;
  const q = S.q.trim().toLowerCase();
  const cats = [...new Set(all.map(o => o.cat))];
  const catFilter = store.get("kc:cat", "");
  const hit = (o) => !q || [o.q, o.group, o.cat, o.rname, o.aname, o.reframe, o.analogy, ...(o.lines || []).map(l => l[1])].join(" ").toLowerCase().includes(q);
  const list = all.filter(o => hit(o) && (!catFilter || o.cat === catFilter));

  const filters = h("div", { class: "obj-filters" },
    h("button", { class: "chip small" + (!catFilter ? " on" : ""), onclick: () => { store.set("kc:cat", ""); render(); } }, "all"),
    cats.map(c => h("button", { class: "chip small" + (catFilter === c ? " on" : ""), onclick: () => { store.set("kc:cat", c); render(); } }, c)));

  const wrap = h("div", {}, filters);
  if (!list.length) wrap.append(h("div", { class: "empty" }, "Nothing matches. Try fewer words."));
  let group = null, groupEl = null;
  for (const o of list) {
    const g = `${o.cat} · ${o.group}`;
    if (g !== group) { group = g; groupEl = h("div", { class: "obj-group" }, h("h3", {}, g)); wrap.append(groupEl); }
    const open = S.openObj === o.id || (q.length > 2 && list.length <= 3);
    const card = h("div", { class: "obj" + (open ? " open" : "") },
      h("button", { class: "q", onclick: () => { S.openObj = S.openObj === o.id ? null : o.id; save(); render(); } }, `"${o.q}"`, h("small", {}, open ? "▴" : "▾")));
    if (open) {
      const body = h("div", { class: "body" },
        (o.lines || []).map(([tag, line]) => h("div", { class: "ol" }, h("span", { class: "tag " + (TAG_CLASS[tag] || "") }, tag), h("span", {}, line))));
      if (o.reframe) body.append(block("Reframe · " + (o.rname || ""), o.rask, o.reframe));
      if (o.analogy) body.append(block("Analogy · " + (o.aname || ""), o.aask, o.analogy));
      if (o.next) body.append(block("Then", "", o.next, "next"));
      if (o.close) body.append(block("Close", "", o.close, "close"));
      card.append(body);
    }
    groupEl.append(card);
  }
  return wrap;
}
const block = (title, ask, text, cls = "") => h("div", { class: "block " + cls }, h("h5", {}, title, ask ? h("em", {}, "  ·  " + ask) : null), h("p", {}, text));

// ---------- deck ----------
const offer = () => S.content.offers.find(o => o.id === S.call.offerId) || S.content.offers[0];
const planMonths = () => (S.deck.plans[S.call.payPlan] || S.deck.plans.full).months;
function setCall(patch) { Object.assign(S.call, patch); save(); render(); }

function renderDeck() {
  const o = offer();
  const f = (label, key, type = "text", ph = "") => h("div", { class: "field" }, h("label", {}, label),
    h("input", { type, value: S.call[key] || "", placeholder: ph, onchange: (e) => setCall({ [key]: e.target.value }) }));
  const left = h("div", {},
    h("div", { class: "card" }, h("h4", {}, "The call"),
      f("Their name", "name", "text", "First name"),
      f("Trial started", "trialStart", "date"),
      f("Renews on", "renews", "date"),
      f("Pay link (optional)", "payUrl", "text", "https://…"),
      h("div", { class: "field" }, h("label", {}, "Card on file?"),
        h("div", { class: "seg" },
          h("button", { class: S.call.card ? "on" : "", onclick: () => setCall({ card: true }) }, "Yes"),
          h("button", { class: !S.call.card ? "on" : "", onclick: () => setCall({ card: false }) }, "No")))),
    h("div", { class: "card", style: "margin-top:12px" }, h("h4", {}, "The offer"),
      h("div", { class: "offers" }, S.content.offers.map(x => h("button", { class: "offerBtn" + (x.id === o.id ? " on" : ""), onclick: () => setCall({ offerId: x.id }) },
        h("span", {}, h("b", {}, x.name), h("small", {}, x.who || "")),
        h("span", { class: "price" }, money(x.today)))))));

  const right = h("div", {},
    h("div", { class: "row" },
      h("span", { class: "eyebrow" }, "Slides"),
      h("div", { class: "seg" }, SLIDES.map((s, i) => h("button", { class: i === S.slide ? "on" : "", onclick: () => { S.slide = i; render(); } }, s.label))),
      h("span", { class: "eyebrow" }, "Pay"),
      planSeg(),
      h("button", { class: "presentBtn", onclick: openPresent }, "▶ Present")),
    h("div", { class: "slideWrap" }, renderSlide(S.slide)),
    h("div", { class: "hint" }, "In Present: ", h("kbd", {}, "←"), h("kbd", {}, "→"), " slides · ", h("kbd", {}, "O"), " next offer · ",
      Object.values(S.deck.plans).map(p => [h("kbd", {}, p.key), " " + p.label + " · "]), h("kbd", {}, "F"), " fullscreen · ", h("kbd", {}, "Esc"), " close"));
  return h("div", { class: "deck" }, left, right);
}
function planSeg() {
  return h("div", { class: "seg" }, Object.entries(S.deck.plans).map(([id, p]) =>
    h("button", { class: S.call.payPlan === id ? "on" : "", onclick: () => setCall({ payPlan: id }), title: "key " + p.key }, p.label)));
}
function offerSeg() {
  return h("div", { class: "seg" }, S.content.offers.map(x =>
    h("button", { class: S.call.offerId === x.id ? "on" : "", onclick: () => setCall({ offerId: x.id }), title: x.name + " · " + money(x.today) }, S.deck.short[x.id] || x.name)));
}

const SLIDES = [
  { id: "cover", label: "Cover" }, { id: "offer", label: "Offer" }, { id: "pay", label: "Pay" }, { id: "gameplan", label: "Gameplan" }, { id: "review", label: "Review" },
];
function renderSlide(i) {
  const o = offer(), d = S.deck, c = S.call;
  const who = c.name ? `${c.name} × Poppy` : "Poppy";
  const head = [h("div", { class: "poppy" }, "🐷 Poppy"), h("div", { class: "who" }, who)];
  const id = SLIDES[i].id;
  const renew = S.content.offers.find(x => x.id === "renew");
  if (id === "cover") {
    const trial = o.deck === "ob";
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, d.cover.eyebrow),
      h("h2", {}, trial ? d.cover.trial : d.cover.other),
      trial ? h("div", { class: "stats" },
        stat("Trial started", fmtDay(c.trialStart)), stat("Renews", fmtDay(c.renews)), stat("Renews at", renew ? `${money(renew.list)} for the year` : "")) : null,
      h("div", { class: "gold" }, d.cover.next));
  }
  if (id === "offer") {
    const stack = (o.stack || "").split("\n").filter(Boolean).map(s => s.replace("[coach]", (o.coaches || [])[0] ? coachName(o.coaches[0]) : "your coach").replace("[calls]", o.calls || ""));
    const bonuses = d.bonuses[o.id] || [];
    const once = o.id === "life" || o.deck === "coached" || o.deck === "build";
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, "Today, on this call"),
      h("h2", { class: "mid" }, o.name),
      h("div", { class: "two" },
        h("div", {}, h("ul", { class: "stack" }, stack.map(s => h("li", {}, s))), bonuses.map(b => h("div", { class: "bonus" }, h("b", {}, b.t), h("span", {}, b.d)))),
        h("div", {},
          o.list > o.today ? h("div", { class: "strike" }, `${money(o.list)}${o.id === "life" ? " every year for Starter" : o.months ? " / " + o.months + " months" : ""}`) : null,
          h("div", { class: "price" }, money(o.today), h("small", {}, once ? "once. No renewal." : o.months ? `for ${o.months} months` : "")),
          h("div", { class: "guar" }, d.guarantee))));
  }
  if (id === "pay") {
    const m = planMonths();
    const per = o.today / m;
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, "Let's get you in"),
      h("h2", { class: "mid" }, o.name),
      h("div", { class: "plan" }, m === 1 ? "Paid in full today" : `${m} payments`),
      h("div", { class: "price" }, money(per), h("small", {}, m === 1 ? "today" : `a month · ${money(o.today)} total`)),
      h("div", { class: "note" }, c.card ? d.pay.card : d.pay.nocard),
      c.payUrl ? h("div", { class: "note" }, c.payUrl) : null,
      h("div", { class: "guar" }, d.guarantee));
  }
  if (id === "gameplan") {
    return h("div", { class: "slide" }, head,
      h("div", { class: "eyebrow" }, c.name ? `${c.name}'s next 4 weeks` : "The next 4 weeks"),
      h("h2", { class: "mid" }, d.gameplan.title),
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
const coachName = (id) => { const c = S.content.coaches.find(x => x.id === id); return c ? c.name.split(" ")[0] : id; };

// ---------- present mode ----------
function openPresent() { S.present = true; S.slide = 0; render(); }
function closePresent() { S.present = false; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); render(); }
function renderPresent() {
  const p = $("#present");
  p.hidden = !S.present;
  if (!S.present) { p.innerHTML = ""; return; }
  p.innerHTML = "";
  const n = SLIDES.length;
  p.append(
    h("div", { class: "stage-area" }, h("div", { class: "frame" }, renderSlide(S.slide))),
    h("div", { class: "bar" }, h("div", { class: "tools" },
      h("div", { class: "grp" },
        h("button", { class: "ic", onclick: () => go(-1) }, "‹"),
        h("span", { class: "count" }, String(S.slide + 1), h("small", {}, "/" + n)),
        h("button", { class: "ic", onclick: () => go(1) }, "›")),
      h("div", { class: "grp" }, h("span", { class: "lbl" }, "Offer"), offerSeg()),
      h("div", { class: "grp" }, h("span", { class: "lbl" }, "Pay"), planSeg()),
      h("div", { class: "grp" },
        h("button", { class: "ic", title: "F · fullscreen", onclick: toggleFull }, "⛶"),
        h("button", { class: "ic", title: "Esc · close", onclick: closePresent }, "✕")))));
}
function go(d) { S.slide = (S.slide + d + SLIDES.length) % SLIDES.length; render(); }
function toggleFull() {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch {}
}

// ---------- keys ----------
function onKey(e) {
  const typing = ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if (e.key === "Escape") { if (S.present) return closePresent(); if (typing) document.activeElement.blur(); return; }
  if (typing) return;
  if (e.key === "/") { e.preventDefault(); $("#q").focus(); return; }
  const k = e.key.toLowerCase();
  if (S.present) {
    if (e.key === "ArrowRight" || e.key === " ") return go(1);
    if (e.key === "ArrowLeft") return go(-1);
    if (/^[1-9]$/.test(e.key) && +e.key <= SLIDES.length) { S.slide = +e.key - 1; return render(); }
    if (k === "o") { const ids = S.content.offers.map(x => x.id); return setCall({ offerId: ids[(ids.indexOf(S.call.offerId) + 1) % ids.length] }); }
    for (const [id, p] of Object.entries(S.deck.plans)) if (k === p.key.toLowerCase()) return setCall({ payPlan: id });
    if (k === "f") return toggleFull();
    return;
  }
  if (S.tab === "script") {
    const n = S.content.stages.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { S.stage = Math.min(S.stage + 1, n - 1); save(); return render(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { S.stage = Math.max(S.stage - 1, 0); save(); return render(); }
    if (/^[1-9]$/.test(e.key) && +e.key <= n) { S.stage = +e.key - 1; save(); return render(); }
  }
}

boot();
