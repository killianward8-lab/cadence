import { h, S, content, save, render, copy, touch, toast } from "./core.js";
import { COPY } from "./script.js";

const TAGS = ["Acknowledge", "Associate", "Ask", "Answer", "Certainty", "Or, callback", "Lock", "Solve", "Show"];
const strip = (s) => String(s).trim().replace(/^\((.*)\)$/, "$1");
const isCue = (s) => /^\(.*\)$/.test(String(s).trim());
const hit = (o, q) => !q || [o.q, o.group, o.cat, o.rname, o.aname, o.reframe, o.analogy, o.close, ...(o.lines || []).map(l => l[1])].join(" ").toLowerCase().includes(q);

export function renderObjections() {
  const all = content().objections;
  const cats = S.deck.categories;
  const q = S.q.trim().toLowerCase();
  const E = S.editing;
  const inCat = all.filter(o => !S.cat || o.cat === S.cat);
  const list = inCat.filter(o => hit(o, q));
  if (q && list.length && !list.some(o => o.id === S.obj)) S.obj = list[0].id;
  let cur = all.find(o => o.id === S.obj) || list[0] || inCat[0] || all[0];
  if (cur && !list.includes(cur) && list.length) cur = list[0];
  const tone = (id) => (cats[id] || {}).color || "#9AA3B2";

  const types = h("div", { class: "cd-types" },
    Object.entries(cats).map(([id, c]) => h("button", { class: S.cat === id ? "on" : "", style: { "--t": c.color }, onclick: () => { S.cat = S.cat === id ? "" : id; save(); render(); } },
      h("i"), c.label, h("em", {}, all.filter(o => o.cat === id).length))));
  const quiz = h("div", { class: "cd-quizgo" },
    h("button", { title: "Quiz me on this category", onclick: () => toast("Quiz mode: coming") }, "🎯 Quiz me"),
    h("button", { class: "all" + (!S.cat ? " on" : ""), title: "Everything, mixed", onclick: () => { S.cat = ""; save(); render(); } }, "all"));

  const listEl = h("div", { class: "cd-list" });
  let g = null, gEl = null;
  for (const o of list) {
    if (o.group !== g) { g = o.group; gEl = h("div", { class: "cd-group" }, h("div", { class: "cd-ghead" }, o.group, h("em", {}, list.filter(x => x.group === o.group).length))); listEl.append(gEl); }
    gEl.append(h("button", { class: cur && o.id === cur.id ? "on" : "", style: { "--t": tone(o.cat) }, onclick: () => { S.obj = o.id; save(); render(); } }, o.q));
  }
  if (!list.length) listEl.append(h("div", { class: "cd-none" }, "Nothing matches."));
  if (E) listEl.append(h("button", { class: "cd-addline", onclick: () => {
    const id = "obj-" + Date.now().toString(36);
    all.push({ id, cat: S.cat || "money", group: "New", q: "New objection.", lines: [["Acknowledge", "Totally fair."], ["Ask", "What do you mean by that?"]], close: "" });
    S.obj = id; touch();
  } }, "+ Objection"));

  return h("div", { class: "cd-obj" }, quiz, types, h("div", { class: "cd-split" }, listEl, cur ? detail(cur, E, tone(cur.cat)) : h("div", { class: "cd-none" }, "Pick an objection.")));
}

const PHASES = [["Acknowledge & Ask", ["Acknowledge", "Associate", "Ask", "Answer", "Show"]], ["Certainty", ["Certainty", "Or, callback"]], ["Lock", ["Lock"]], ["Solve", ["Solve"]]];
const phaseOf = (tag) => { const i = PHASES.findIndex(([, tags]) => tags.includes(tag)); return i < 0 ? 0 : i; };

function qbtn(text, cls = "flow") {
  return h("button", { class: "cd-q " + cls, title: "Click to copy", onclick: (e) => { e.stopPropagation(); copy(text); } }, h("span", { class: "cd-qt" }, text), h("span", { class: "cd-qc" }, COPY()));
}
function bcard(kind, title, ask, text, svg) {
  const lines = String(text || "").split("\n").filter(Boolean);
  return h("section", { class: "cd-bcard " + kind },
    h("header", {}, h("span", { class: "ic" }, h("svg", { viewBox: "0 0 24 24", html: svg })), h("div", {}, h("small", {}, kind === "reframe" ? "Reframe" : "Analogy"), h("h3", {}, title || "")),
      h("button", { class: "cd-bcopy", onclick: () => copy([ask, text].filter(Boolean).join("\n"), "Copied") }, "Copy all")),
    ask ? h("div", { class: "cd-ask" }, h("small", {}, "Ask first"), h("button", { class: "cd-bline", onclick: () => copy(ask) }, ask)) : null,
    lines.map(l => isCue(l) ? h("p", { class: "cue" }, strip(l)) : h("button", { class: "cd-bline", onclick: () => copy(l) }, l)));
}
const SVG_R = '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"></path><path d="M18 3v4h-4M6 21v-4h4"></path>';
const SVG_A = '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z"></path>';

function detail(o, E, color) {
  const cat = S.deck.categories[o.cat] || { label: o.cat };
  const art = h("article", { class: "cd-detail", style: { "--t": color } });
  art.append(
    h("div", { class: "cd-dhead" },
      E ? h("select", { class: "cd-efield sel", onchange: (e) => { o.cat = e.target.value; touch(); } }, Object.entries(S.deck.categories).map(([id, c]) => h("option", { value: id, selected: id === o.cat }, c.label)))
        : h("span", { class: "cd-tchip" }, h("i"), cat.label),
      E ? h("input", { class: "cd-efield", value: o.group, placeholder: "group", onchange: (e) => { o.group = e.target.value; touch(); } }) : null,
      E ? h("textarea", { class: "cd-efield h2", rows: 1, onchange: (e) => { o.q = e.target.value; touch(); } }, o.q) : h("h2", {}, `“${o.q}”`),
      E ? h("button", { class: "cd-delobj", onclick: () => { if (confirm("Delete this objection?")) { const all = content().objections; all.splice(all.indexOf(o), 1); S.obj = null; touch(); } } }, "🗑 delete") : null),
    h("div", { class: "cd-pause" }, h("svg", { viewBox: "0 0 24 24", html: '<path d="M9 6v12M15 6v12"></path>' }), S.deck.pause));

  const flow = h("div", { class: "cd-flow" });
  let lastPhase = -1, n = 0;
  (o.lines || []).forEach(([tag, line], i) => {
    if (E) {
      flow.append(h("div", { class: "cd-erow" },
        h("select", { class: "cd-efield sel", onchange: (e) => { o.lines[i][0] = e.target.value; touch(); } }, TAGS.map(t => h("option", { value: t, selected: t === tag }, t))),
        h("textarea", { class: "cd-efield", rows: 1, onchange: (e) => { o.lines[i][1] = e.target.value; touch(); } }, line),
        h("span", { class: "cd-rowtools" },
          h("button", { disabled: i === 0, onclick: () => { [o.lines[i - 1], o.lines[i]] = [o.lines[i], o.lines[i - 1]]; touch(); } }, "↑"),
          h("button", { disabled: i === o.lines.length - 1, onclick: () => { [o.lines[i + 1], o.lines[i]] = [o.lines[i], o.lines[i + 1]]; touch(); } }, "↓"),
          h("button", { onclick: () => { o.lines.splice(i, 1); touch(); } }, "🗑"))));
      return;
    }
    const ph = phaseOf(tag);
    if (ph !== lastPhase) { lastPhase = ph; flow.append(h("div", { class: "cd-phase" }, h("span", {}, ph + 1), PHASES[ph][0])); }
    if (isCue(line)) { flow.append(h("div", { class: "cd-fl cue" }, h("span", { class: "dot" }), h("p", { class: "cd-cue" }, strip(line)))); return; }
    const alt = tag === "Or, callback";
    if (!alt) n++;
    flow.append(h("div", { class: "cd-fl" + (alt ? " alt" : "") }, h("span", { class: "dot" }, alt ? "or" : n),
      h("div", { class: "body" }, h("span", { class: "lab" }, tag), qbtn(line))));
  });
  if (E) flow.append(h("button", { class: "cd-addline", onclick: () => { o.lines.push(["Ask", "New line"]); touch(); } }, "+ Line"));
  if (!E && o.close) {
    flow.append(h("div", { class: "cd-phase" }, h("span", {}, "5"), "Close"));
    o.close.split("\n").filter(Boolean).forEach(l => {
      if (isCue(l)) flow.append(h("div", { class: "cd-fl cue" }, h("span", { class: "dot" }), h("p", { class: "cd-cue" }, strip(l))));
      else { n++; flow.append(h("div", { class: "cd-fl close" }, h("span", { class: "dot" }, n), h("div", { class: "body" }, qbtn(l)))); }
    });
  }
  art.append(flow);

  if (E) {
    art.append(h("section", { class: "cd-detour edit" },
      h("div", { class: "cd-dtitle" }, h("span", {}, "Reframe")),
      h("input", { class: "cd-efield", value: o.rname || "", placeholder: "title", onchange: (e) => { o.rname = e.target.value; touch(); } }),
      h("input", { class: "cd-efield", value: o.rask || "", placeholder: "ask first", onchange: (e) => { o.rask = e.target.value; touch(); } }),
      h("textarea", { class: "cd-efield", rows: 3, placeholder: "(none)", onchange: (e) => { o.reframe = e.target.value; touch(); } }, o.reframe || ""),
      h("div", { class: "cd-dtitle" }, h("span", {}, "Analogy")),
      h("input", { class: "cd-efield", value: o.aname || "", placeholder: "title", onchange: (e) => { o.aname = e.target.value; touch(); } }),
      h("input", { class: "cd-efield", value: o.aask || "", placeholder: "ask first", onchange: (e) => { o.aask = e.target.value; touch(); } }),
      h("textarea", { class: "cd-efield", rows: 3, placeholder: "(none)", onchange: (e) => { o.analogy = e.target.value; touch(); } }, o.analogy || ""),
      h("div", { class: "cd-dtitle" }, h("span", {}, "Back to the ask")),
      h("textarea", { class: "cd-efield", rows: 2, placeholder: "(none)", onchange: (e) => { o.next = e.target.value; touch(); } }, o.next || ""),
      h("div", { class: "cd-dtitle" }, h("span", {}, "Close")),
      h("textarea", { class: "cd-efield", rows: 3, onchange: (e) => { o.close = e.target.value; touch(); } }, o.close || "")));
    return art;
  }
  if (o.reframe || o.analogy || o.next) {
    const det = h("div", { class: "cd-flow" });
    if (o.reframe) { det.append(h("div", { class: "cd-phase side" }, h("span", {}, "A"), "Reframe", h("em", {}, "try this first")), bcard("reframe", o.rname, o.rask, o.reframe, SVG_R)); }
    if (o.analogy) { det.append(h("div", { class: "cd-phase side" }, h("span", {}, o.reframe ? "B" : "A"), "Analogy", h("em", {}, o.reframe ? "only if the reframe didn't land" : "try this first")), bcard("analogy", o.aname, o.aask, o.analogy, SVG_A)); }
    if (o.next) {
      const ls = o.next.split("\n").filter(Boolean);
      det.append(h("div", { class: "cd-phase side" }, h("span", {}, "→"), "Back to the ask", h("em", {}, "once it lands")),
        h("section", { class: "cd-next" }, ls.map(l => isCue(l) ? h("p", { class: "cue" }, strip(l)) : h("button", { class: "cd-bline", onclick: () => copy(l) }, l))));
    }
    art.append(h("section", { class: "cd-detour" }, h("div", { class: "cd-dtitle" }, h("span", {}, "If they're still stuck"), h("em", {}, "comes in after the Lock, only if they're still unsure")), det));
  }
  return art;
}
