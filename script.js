import { h, S, content, save, render, setTab, isDirection, copy, touch, eyebrow } from "./core.js";

export function variantOf(stage) {
  const want = S.vars[stage.id];
  return stage.variants.find(v => v.id === want) || stage.variants.find(v => v.id === "ob") || stage.variants[0];
}

export function renderScript() {
  const c = content();
  const stages = c.stages;
  S.stage = Math.min(Math.max(S.stage, 0), stages.length - 1);
  const st = stages[S.stage];
  const v = variantOf(st);
  const E = S.editing;

  const side = h("aside", { class: "stages" });
  stages.forEach((s, i) => {
    if (s.gate) side.append(h("div", { class: "gate" }, "don't pitch yet"));
    side.append(h("button", { class: i === S.stage ? "on" : "", onclick: () => { S.stage = i; save(); render(); } },
      h("span", { class: "n" }, i < S.stage ? "✓" : s.n), s.name));
  });

  const bar = h("div", { class: "bar" }, stages.map((_, i) => h("i", { class: i <= S.stage ? "done" : "" })));
  const chips = h("div", { class: "chips" }, st.variants.map(x =>
    h("button", { class: "chip" + (x.id === v.id ? " on" : ""), onclick: () => { S.vars[st.id] = x.id; save(); render(); } },
      E && x.id === v.id ? h("input", { class: "inline", value: x.label, onclick: (e) => e.stopPropagation(), onchange: (e) => { x.label = e.target.value; touch(); } }) : x.label,
      E && x.id === v.id && st.variants.length > 1 ? h("span", { class: "x", title: "delete this situation", onclick: (e) => { e.stopPropagation(); if (confirm(`Delete "${x.label}"?`)) { st.variants.splice(st.variants.indexOf(x), 1); delete S.vars[st.id]; touch(); } } }, "×") : null)),
    E ? h("button", { class: "chip add", onclick: () => { const id = "v" + Date.now().toString(36); st.variants.push({ id, label: "New situation", flow: ["New line"] }); S.vars[st.id] = id; touch(); } }, "+ Situation") : null);

  const lines = v.flow.map((line, i) => E ? editLine(v.flow, i) : h("div", { class: "line" + (isDirection(line) ? " dir" : "") + (i === 0 && !isDirection(line) ? " hot" : "") },
    h("span", { class: "n" }, String(i + 1).padStart(2, "0")), h("span", { class: "t" }, line),
    h("button", { class: "cp", title: "copy", onclick: () => copy(line) }, "⧉")));
  if (E) lines.push(h("button", { class: "chip add", onclick: () => { v.flow.push("New line"); touch(); } }, "+ Line"));

  const next = S.stage < stages.length - 1
    ? h("button", { class: "nextStage", onclick: () => { S.stage++; save(); render(); } }, `Next: ${stages[S.stage + 1].name} →`)
    : h("button", { class: "nextStage", onclick: () => setTab("deck") }, "Open the deck →");

  const center = h("section", { class: "stage" },
    bar,
    eyebrow(`Stage ${st.n} of ${stages.length}`),
    h("h1", { class: "big" }, st.name),
    st.id === "close" ? h("button", { class: "openDeck", onclick: () => setTab("deck") }, "Open the deck →") : null,
    chips, lines, next,
    h("div", { class: "hint" }, h("kbd", {}, "←"), h("kbd", {}, "→"), " stages · ", h("kbd", {}, "1"), "–", h("kbd", {}, String(stages.length)), " jump · ", h("kbd", {}, "/"), " search objections"));

  const dig = h("aside", { class: "dig" }, h("h4", {}, "✦ Dig deeper"),
    (S.deck.dig || []).map(([b, s]) => [h("b", {}, b), h("span", {}, s)]));

  return h("div", { class: "script" }, side, center, dig);
}

function editLine(flow, i) {
  const ta = h("textarea", { class: "edit", rows: 1, onchange: (e) => { flow[i] = e.target.value; touch(); } }, flow[i]);
  requestAnimationFrame(() => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });
  ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });
  return h("div", { class: "line edit" }, h("span", { class: "n" }, String(i + 1).padStart(2, "0")), ta,
    h("span", { class: "rowtools" },
      h("button", { title: "up", disabled: i === 0, onclick: () => { [flow[i - 1], flow[i]] = [flow[i], flow[i - 1]]; touch(); } }, "↑"),
      h("button", { title: "down", disabled: i === flow.length - 1, onclick: () => { [flow[i + 1], flow[i]] = [flow[i], flow[i + 1]]; touch(); } }, "↓"),
      h("button", { title: "delete", onclick: () => { flow.splice(i, 1); touch(); } }, "🗑")));
}
