---
name: poppy-sales-api
description: Build or change this dashboard's Poppy sales and billing flows through Sales API. Fetch the current guide before changing the integration.
---

Before Sales API work, fetch and read https://api.getpoppy.ai/sales-api/guide
and the OpenAPI document linked there. Use a fresh HTTP fetch (no cached copy).
Follow the current integration workflow and read the linked mock guide when testing.
If a fetch fails or returns a login/error page, report it; do not invent the
contract or silently use a stale copy. Continue only work independent of it.
Keep billing calls and Sales API keys on the server. Preserve this project's
sales UX and use its existing client, environment and test conventions.
Test affected flows in an isolated Sales API mock environment before cutover.
For a missing capability, draft the guide's request to JD; do not build a
direct Stripe/Whop backend workaround. Never put keys or customer data here.

This project: the page is static (GitHub Pages). The Sales API key lives only in
the serverless proxy `api/poppy-sales.js` (env POPPY_SALES_API_URL, POPPY_SALES_KEY,
CADENCE_PROXY_TOKEN). The page calls that proxy, never api.getpoppy.ai directly.
