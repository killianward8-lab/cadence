// Killian's Cadence. Plain JS, no build step. Wires the tabs together.
import { $, S, store, content, save, setRender, setTab, beginEdit, endEdit, resetEdits, download, toast } from "./core.js";
import { renderScript } from "./script.js";
import { renderObjections } from "./objections.js";
import { renderDeck, renderPresent, openPresent, closePresent, go, toggleDraw, toggleText, clearInk, setColor, toggleMusic, nextTrack, toggleParty, toggleFull, togglePractice, SLIDES, PRESENT } from "./deck.js";
import { renderPrecall } from "./precall.js";
import { renderPay } from "./pay.js";
import { keyFromUrl, hasKey, setKey, refreshCalls } from "./poppy.js";

async function boot() {
  try {
    const [c, d] = await Promise.all([fetch("cadence.json").then(r => r.json()), fetch("deck.json").then(r => r.json())]);
    S.repo = c; S.deck = d;
  } catch (e) {
    $("#main").innerHTML = `<div class="empty">Couldn't load cadence.json. If you opened this file directly, run <code>python3 tools/serve.py</code> and open http://localhost:8787</div>`;
    return;
  }
  keyFromUrl();
  const edits = store.get("kc:content", null);
  if (edits && edits.stages && edits.objections) S.edits = edits;
  if (!content().offers.some(o => o.id === S.call.offerId)) S.call.offerId = content().offers[0].id;

  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setTab(b.dataset.tab); });
  $("#q").addEventListener("input", (e) => { S.q = e.target.value; if (S.tab !== "objections") setTab("objections"); else render(); });
  $("#practice").addEventListener("click", () => { togglePractice(); if (S.tab !== "deck") setTab("deck"); });
  $("#edit").addEventListener("click", () => S.editing ? endEdit() : beginEdit());
  $("#exportJson").addEventListener("click", () => { const c = JSON.parse(JSON.stringify(content())); c.updated = Date.now(); download("cadence.json", JSON.stringify(c, null, 2) + "\n"); toast("Downloaded. Drop it in the repo and run tools/split.py"); });
  $("#resetEdits").addEventListener("click", () => { if (confirm("Throw away the edits saved in this browser?")) resetEdits(); });
  $("#poppy").addEventListener("click", () => {
    if (hasKey()) { if (confirm("Disconnect Poppy from this browser?")) { setKey(""); S.calls = S.calls.filter(c => !c.live); save(); render(); } return; }
    const k = prompt("Paste your Poppy machine key (it stays in this browser):"); if (k && k.trim()) { setKey(k); refreshCalls(true).then(() => render()); render(); }
  });
  document.addEventListener("keydown", onKey);
  if (hasKey()) refreshCalls().then(ok => ok && render());
  render();
}

function render() {
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === S.tab));
  const edit = $("#edit"); edit.classList.toggle("on", S.editing); edit.textContent = S.editing ? "✓ Done" : "✎ Edit";
  edit.hidden = !(S.tab === "script" || S.tab === "objections");
  $("#editbar").hidden = !S.editing;
  const pr = $("#practice"); pr.classList.toggle("on", S.practice); pr.textContent = S.practice ? "🧪 Practice · Exit" : "🧪 Practice";
  $("#pracbar").hidden = !S.practice;
  const pp = $("#poppy"); pp.classList.toggle("on", hasKey()); pp.textContent = hasKey() ? "● Poppy" : "○ Poppy"; pp.title = hasKey() ? "Connected to Poppy. Click to disconnect." : "Connect to Poppy with your machine key";
  const main = $("#main"); main.innerHTML = "";
  if (S.tab === "precall") main.append(renderPrecall());
  if (S.tab === "script") main.append(renderScript());
  if (S.tab === "objections") main.append(renderObjections());
  if (S.tab === "deck") main.append(renderDeck());
  if (S.tab === "pay") main.append(renderPay());
  renderPresent();
}
setRender(render);

function onKey(e) {
  const a = document.activeElement;
  const typing = a && (["INPUT", "SELECT", "TEXTAREA"].includes(a.tagName) || a.isContentEditable);
  if (e.key === "Escape") { if (typing) { a.blur(); return; } if (S.present) return closePresent(); return; }
  if (typing) return;
  if (e.key === "/") { e.preventDefault(); $("#q").focus(); return; }
  const k = e.key.toLowerCase();
  if (S.present) {
    if (e.key === "ArrowRight" || e.key === " ") return go(1);
    if (e.key === "ArrowLeft") return go(-1);
    if (PRESENT.draw && /^[1-4]$/.test(e.key)) return setColor(+e.key - 1);
    if (/^[1-9]$/.test(e.key) && +e.key <= SLIDES.length) { S.slide = +e.key - 1; return render(); }
    if (k === "o") { const ids = content().offers.map(x => x.id); S.call.offerId = ids[(ids.indexOf(S.call.offerId) + 1) % ids.length]; S.call.list = S.call.today = ""; save(); return render(); }
    for (const [id, p] of Object.entries(S.deck.plans)) if (k === p.key.toLowerCase()) { S.call.payPlan = id; save(); return render(); }
    if (k === "d") return toggleDraw();
    if (k === "e") return toggleText();
    if (k === "c") return clearInk();
    if (k === "m") return toggleMusic();
    if (k === "n") return nextTrack();
    if (k === "g") return toggleParty();
    if (k === "f") return toggleFull();
    return;
  }
  if (S.tab === "script" && !S.editing) {
    const n = content().stages.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { S.stage = Math.min(S.stage + 1, n - 1); save(); return render(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { S.stage = Math.max(S.stage - 1, 0); save(); return render(); }
    if (/^[1-9]$/.test(e.key) && +e.key <= n) { S.stage = +e.key - 1; save(); return render(); }
  }
  if (S.tab === "deck" && k === "p" && e.shiftKey) return openPresent();
}

boot();
