// Copy what the live page currently has into your clipboard, so you can
// paste it over cadence.json (then split it with  python3 tools/split.py ).
// Run in the DevTools Console on https://getpoppy.ai/killian/cadence.
(async () => {
  const r = await fetch("/api/sales-kv?get=cadence%3Akillian", { credentials: "same-origin" });
  const j = r.ok ? await r.json() : null;
  let v = j && j.v;
  if (typeof v === "string") { try { v = JSON.parse(v); } catch { v = null; } }
  // The page itself reads the browser cache first, so prefer that if it is newer.
  try { const c = JSON.parse(localStorage.getItem("cd:content") || "null"); if (c && c.stages && (!v || (c.updated || 0) >= (v.updated || 0))) v = c; } catch {}
  if (!v || !v.stages) { console.log("Nothing saved yet: the page is running the built-in default script."); return; }
  await navigator.clipboard.writeText(JSON.stringify(v, null, 2));
  console.log("Copied the live script to the clipboard. Paste it over cadence.json.");
})();
