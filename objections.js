import { h, S, content, save, render, copy, touch, store } from "./core.js";

const TAGS = ["Acknowledge", "Associate", "Ask", "Answer", "Certainty", "Or, callback", "Lock", "Solve", "Show"];
const TAG_CLASS = { Lock: "lock", Solve: "solve", Show: "solve", Acknowledge: "ack", Associate: "ack" };

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

  const chips = h("div", { class: "obj-cats" },
    h("button", { class: "catchip" + (!S.cat ? " on" : ""), onclick: () => { S.cat = ""; save(); render(); } }, "All ", h("small", {}, all.length)),
    Object.entries(cats).map(([id, c]) => h("button", { class: "catchip" + (S.cat === id ? " on" : ""), style: { "--c": c.color }, onclick: () => { S.cat = id; save(); render(); } },
      h("i", {}), c.label, " ", h("small", {}, all.filter(o => o.cat === id).length))));

  // left list grouped
  const left = h("aside", { class: "obj-list" });
  let g = null, gEl = null;
  for (const o of list) {
    const key = o.group;
    if (key !== g) { g = key; gEl = h("div", { class: "og" }, h("h5", {}, o.group, h("small", {}, list.filter(x => x.group === o.group).length))); left.append(gEl); }
    gEl.append(h("button", { class: "oq" + (cur && o.id === cur.id ? " on" : ""), onclick: () => { S.obj = o.id; save(); render(); } }, o.q));
  }
  if (!list.length) left.append(h("div", { class: "empty" }, "Nothing matches."));
  if (E) left.append(h("button", { class: "chip add", onclick: () => {
    const id = "obj-" + Date.now().toString(36);
    all.push({ id, cat: S.cat || "money", group: "New", q: "New objection.", lines: [["Acknowledge", "Totally fair."], ["Ask", "What do you mean by that?"]], close: "" });
    S.obj = id; touch();
  } }, "+ Objection"));

  return h("div", {}, chips, h("div", { class: "obj-grid" }, left, cur ? detail(cur, E) : h("div", { class: "empty" }, "Pick an objection.")));
}

function detail(o, E) {
  const cat = S.deck.categories[o.cat] || { label: o.cat, color: "#999" };
  const phases = S.deck.phases;
  const wrap = h("section", { class: "obj-detail" });
  wrap.append(
    h("div", { class: "row" },
      E ? h("select", { class: "catsel", onchange: (e) => { o.cat = e.target.value; touch(); } }, Object.entries(S.deck.categories).map(([id, c]) => h("option", { value: id, selected: id === o.cat }, c.label)))
        : h("span", { class: "catbadge", style: { "--c": cat.color } }, h("i", {}), cat.label),
      E ? h("input", { class: "inline", value: o.group, placeholder: "group", onchange: (e) => { o.group = e.target.value; touch(); } }) : null,
      E ? h("button", { class: "chip small danger", onclick: () => { if (confirm("Delete this objection?")) { const all = content().objections; all.splice(all.indexOf(o), 1); S.obj = null; touch(); } } }, "🗑 delete") : null),
    E ? h("textarea", { class: "edit h2", rows: 1, onchange: (e) => { o.q = e.target.value; touch(); } }, o.q) : h("h2", { class: "quote" }, `“${o.q}”`),
    h("div", { class: "pause" }, "⏸ " + S.deck.pause));

  // phases
  let lastPhase = null, n = 0, pn = 0;
  (o.lines || []).forEach(([tag, line], i) => {
    const ph = phases[tag] || tag;
    if (ph !== lastPhase) { lastPhase = ph; pn++; wrap.append(h("div", { class: "phase" }, h("span", { class: "pn" }, pn), ph)); }
    n++;
    if (E) {
      wrap.append(h("div", { class: "ol edit" },
        h("select", { onchange: (e) => { o.lines[i][0] = e.target.value; touch(); } }, TAGS.map(t => h("option", { value: t, selected: t === tag }, t))),
        h("textarea", { class: "edit", rows: 1, onchange: (e) => { o.lines[i][1] = e.target.value; touch(); } }, line),
        h("span", { class: "rowtools" },
          h("button", { disabled: i === 0, onclick: () => { [o.lines[i - 1], o.lines[i]] = [o.lines[i], o.lines[i - 1]]; touch(); } }, "↑"),
          h("button", { disabled: i === o.lines.length - 1, onclick: () => { [o.lines[i + 1], o.lines[i]] = [o.lines[i], o.lines[i + 1]]; touch(); } }, "↓"),
          h("button", { onclick: () => { o.lines.splice(i, 1); touch(); } }, "🗑"))));
    } else {
      wrap.append(h("div", { class: "ol" }, h("span", { class: "num" }, n),
        h("div", { class: "lt" }, h("span", { class: "tag " + (TAG_CLASS[tag] || "") }, tag), h("div", { class: "lx" }, line)),
        h("button", { class: "cp", title: "copy", onclick: () => copy(line) }, "⧉")));
    }
  });
  if (E) wrap.append(h("button", { class: "chip add", onclick: () => { o.lines.push(["Ask", "New line"]); touch(); } }, "+ Line"));

  const detour = (key, nameKey, askKey, title) => {
    if (E) return h("div", { class: "block" }, h("h5", {}, title),
      h("input", { class: "inline", value: o[nameKey] || "", placeholder: "title", onchange: (e) => { o[nameKey] = e.target.value; touch(); } }),
      h("input", { class: "inline", value: o[askKey] || "", placeholder: "permission line", onchange: (e) => { o[askKey] = e.target.value; touch(); } }),
      h("textarea", { class: "edit", rows: 3, placeholder: "(none)", onchange: (e) => { o[key] = e.target.value; touch(); } }, o[key] || ""));
    if (!o[key]) return null;
    return h("div", { class: "block detour" }, h("h5", {}, title + " · " + (o[nameKey] || ""), o[askKey] ? h("em", {}, "  ·  " + o[askKey]) : null), h("p", {}, o[key]),
      h("button", { class: "cp", onclick: () => copy(o[key]) }, "⧉"));
  };
  wrap.append(detour("reframe", "rname", "rask", "Reframe"), detour("analogy", "aname", "aask", "Analogy"));
  if (E) {
    wrap.append(h("div", { class: "block next" }, h("h5", {}, "Then"), h("textarea", { class: "edit", rows: 2, onchange: (e) => { o.next = e.target.value; touch(); } }, o.next || "")));
    wrap.append(h("div", { class: "block close" }, h("h5", {}, "Close"), h("textarea", { class: "edit", rows: 3, onchange: (e) => { o.close = e.target.value; touch(); } }, o.close || "")));
    wrap.append(h("label", { class: "chk" }, h("input", { type: "checkbox", checked: !!o.beliefAfter, onchange: (e) => { o.beliefAfter = e.target.checked; touch(); } }), " belief check after"));
  } else {
    if (o.next) wrap.append(h("div", { class: "block next" }, h("h5", {}, "Then"), h("p", {}, o.next)));
    if (o.close) wrap.append(h("div", { class: "block close" }, h("h5", {}, "Close"), h("p", {}, o.close), h("button", { class: "cp", onclick: () => copy(o.close) }, "⧉")));
  }
  return wrap;
}
