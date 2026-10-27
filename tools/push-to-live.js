// Push cadence.json to the live page (getpoppy.ai/killian/cadence).
//
// 1. Run  python3 tools/assemble.py  so cadence.json is fresh.
// 2. Copy the whole contents of cadence.json to your clipboard.
// 3. Open https://getpoppy.ai/killian/cadence in Chrome (signed in as killian@getpoppy.ai).
// 4. Open DevTools (Cmd+Option+J), paste this file into the Console, press Enter.
// 5. Click into the page if Chrome asks for clipboard access, then reload the page.
//
// This does exactly what the page's own Edit mode does: it writes the doc
// "cadence:killian" to the team store, and caches it in this browser.
//
// Known quirk (checked 2026-10-27): the store hands the doc back as a text
// string, and the page ignores it in that form. So what the page actually
// reads on load is the browser cache (localStorage "cd:content"). Run this in
// every browser you use Cadence in. The server copy is still worth keeping.
(async () => {
  const text = await navigator.clipboard.readText();
  const v = JSON.parse(text);
  if (!v.stages || !v.objections || !v.offers) throw new Error("clipboard is not cadence.json");
  v.updated = Date.now();
  const r = await fetch("/api/sales-kv", {
    method: "POST", credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "set", key: "cadence:killian", v, src: "cadence" }),
  });
  localStorage.setItem("cd:content", JSON.stringify(v));
  console.log(r.ok ? "Saved to the team store. Reload the page." : "Store said " + r.status + ". Saved on this device only.");
})();
