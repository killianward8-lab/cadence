// Serverless proxy between the Cadence page and Poppy's Sales API (Vercel function).
// The Sales API key never leaves this server. The page sends a proxy token it got once
// (CADENCE_PROXY_TOKEN) so strangers can't use this endpoint.
//
// Env: POPPY_SALES_API_URL (…/api/v1/sales), POPPY_SALES_KEY (psk_…), CADENCE_PROXY_TOKEN,
//      CADENCE_ORIGIN (https://killianward8-lab.github.io), CADENCE_CLOSER (killian@getpoppy.ai)
//
// Only these operations are allowed, so the page can never refund, cancel or change keys:
const ALLOW = [
  ["GET", /^\/catalog(\?.*)?$/],
  ["GET", /^\/customers(\?.*)?$/],
  ["GET", /^\/customers\/status(\?.*)?$/],
  ["GET", /^\/payments(\?.*)?$/],
  ["GET", /^\/payments\/[A-Za-z0-9_:-]+$/],
  ["GET", /^\/summary(\?.*)?$/],
  ["POST", /^\/payment-links\/quote$/],
  ["POST", /^\/payment-links$/],
  ["POST", /^\/checkouts$/],
  ["POST", /^\/checkouts\/[A-Za-z0-9_-]+\/void$/],
  ["POST", /^\/charges$/],
  ["POST", /^\/lifetime$/],
  ["POST", /^\/card-setup$/],
  ["POST", /^\/subscriptions\/[A-Za-z0-9_-]+\/convert-trial$/],
  ["POST", /^\/subscriptions\/[A-Za-z0-9_-]+\/retry-payment$/],
  ["POST", /^\/mock\/pay$/],
];

export default async function handler(req, res) {
  const origin = process.env.CADENCE_ORIGIN || "";
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-cadence-token, idempotency-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  const token = req.headers["x-cadence-token"];
  if (!process.env.CADENCE_PROXY_TOKEN || token !== process.env.CADENCE_PROXY_TOKEN) return res.status(401).json({ error: "unauthorized", message: "bad proxy token" });
  const base = process.env.POPPY_SALES_API_URL, key = process.env.POPPY_SALES_KEY;
  if (!base || !key) return res.status(500).json({ error: "proxy_not_configured", message: "set POPPY_SALES_API_URL and POPPY_SALES_KEY" });

  const path = String(req.query.path || "");
  if (!path.startsWith("/") || !ALLOW.some(([m, re]) => m === req.method && re.test(path))) return res.status(403).json({ error: "not_allowed", message: "that call is not allowed through the proxy", path });

  const body = req.method === "POST" ? (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) : undefined;
  if (body && typeof body === "object" && !/^\/mock\//.test(path)) {
    body.metadata = { ...(body.metadata || {}), closer: process.env.CADENCE_CLOSER || "killian@getpoppy.ai", via: "cadence" };
  }
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  if (req.headers["idempotency-key"]) headers["Idempotency-Key"] = String(req.headers["idempotency-key"]);
  const r = await fetch(base + path, { method: req.method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  res.setHeader("Content-Type", "application/json");
  if (r.headers.get("sales-mock-now")) res.setHeader("Sales-Mock-Now", r.headers.get("sales-mock-now"));
  return res.status(r.status).send(text);
}
