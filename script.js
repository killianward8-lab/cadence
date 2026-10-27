import { h, S, content, save, render, setTab, isDirection, copy, touch } from "./core.js";

const CHECK = () => h("svg", { viewBox: "0 0 24 24", html: '<path d="m5 12.5 4.5 4.5L19 7.5"></path>' });
export const COPY = () => h("svg", { viewBox: "0 0 24 24", html: '<rect x="9" y="9" width="11" height="11" rx="2.5"></rect><path d="M5 15V6a2 2 0 0 1 2-2h9"></path>' });
const strip = (s) => String(s).trim().replace(/^\((.*)\)$/, "$1");

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

  const rail = h("nav", { class: "cd-rail" });
  stages.forEach((s, i) => {
    if (s.gate) rail.append(h("div", { class: "cd-gate" }, h("span", {}, "Don't pitch yet")));
    rail.append(h("button", { class: "cd-step" + (i === S.stage ? " on" : i < S.stage ? " done" : ""), onclick: () => { S.stage = i; save(); render(); } },
      h("i", {}, i < S.stage ? CHECK() : String(s.n)), h("span", {}, s.name)));
  });

  const progress = h("div", { class: "cd-progress" }, stages.map((_, i) => h("b", { class: i <= S.stage ? "on" : "" })));
  const head = h("header", { class: "cd-sh" },
    h("span", { class: "cd-badge" }, `Stage ${st.n}`), h("h1", {}, st.name),
    st.id === "close" || S.stage === stages.length - 1 ? h("button", { class: "cd-todeck", onclick: () => setTab("deck") }, "Open the deck", h("svg", { viewBox: "0 0 24 24", html: '<path d="M5 12h14M13 6l6 6-6 6"></path>' })) : null);
  const variants = h("div", { class: "cd-variants" }, st.variants.map(x =>
    h("button", { class: x.id === v.id ? "on" : "", onclick: () => { S.vars[st.id] = x.id; save(); render(); } },
      E && x.id === v.id ? h("input", { class: "cd-vedit", value: x.label, onclick: (e) => e.stopPropagation(), onchange: (e) => { x.label = e.target.value; touch(); } }) : x.label,
      E && x.id === v.id && st.variants.length > 1 ? h("span", { class: "cd-delobj", title: "delete this situation", onclick: (e) => { e.stopPropagation(); if (confirm(`Delete "${x.label}"?`)) { st.variants.splice(st.variants.indexOf(x), 1); delete S.vars[st.id]; touch(); } } }, "×") : null)),
    E ? h("button", { class: "cd-addline", onclick: () => { const id = "v" + Date.now().toString(36); st.variants.push({ id, label: "New situation", flow: ["New line"] }); S.vars[st.id] = id; touch(); } }, "+ Situation") : null);

  let lead = true;
  const flow = h("ol", { class: "cd-script-flow" }, v.flow.map((line, i) => {
    if (E) return editLine(v.flow, i);
    if (isDirection(line)) return h("li", { class: "cue" }, h("span", {}, strip(line)));
    const cls = lead ? " lead" : ""; lead = false;
    return h("li", {}, h("button", { class: "cd-q" + cls, title: "Click to copy", onclick: () => copy(line) },
      h("span", { class: "cd-qn" }, String(i + 1).padStart(2, "0")), h("span", { class: "cd-qt" }, line), h("span", { class: "cd-qc" }, COPY())));
  }), E ? h("li", {}, h("button", { class: "cd-addline", onclick: () => { v.flow.push("New line"); touch(); } }, "+ Line")) : null);

  const stage = h("main", { class: "cd-stage" }, progress, head, variants, flow,
    S.stage < stages.length - 1 ? h("button", { class: "cd-nextstage", onclick: () => { S.stage++; save(); render(); } }, `Next: ${stages[S.stage + 1].name} →`) : null);

  const engine = h("aside", { class: "cd-engine" },
    h("div", { class: "cd-enghead" }, h("svg", { viewBox: "0 0 24 24", html: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"></path>' }), "Dig deeper"),
    (S.deck.dig || []).map(([b, s]) => h("button", { onclick: () => copy(s) }, h("b", {}, b), h("span", {}, s))));

  return h("div", { class: "cd-script" }, rail, stage, engine);
}

function editLine(flow, i) {
  const ta = h("textarea", { class: "cd-efield", rows: 1, onchange: (e) => { flow[i] = e.target.value; touch(); } }, flow[i]);
  requestAnimationFrame(() => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });
  ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });
  return h("li", { class: "cd-erow" }, h("span", { class: "cd-qn" }, String(i + 1).padStart(2, "0")), ta,
    h("span", { class: "cd-rowtools" },
      h("button", { title: "up", disabled: i === 0, onclick: () => { [flow[i - 1], flow[i]] = [flow[i], flow[i - 1]]; touch(); } }, "↑"),
      h("button", { title: "down", disabled: i === flow.length - 1, onclick: () => { [flow[i + 1], flow[i]] = [flow[i], flow[i + 1]]; touch(); } }, "↓"),
      h("button", { title: "delete", onclick: () => { flow.splice(i, 1); touch(); } }, "🗑")));
}
