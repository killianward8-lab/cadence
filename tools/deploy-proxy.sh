#!/bin/bash
# Deploys the Sales API proxy (api/poppy-sales.js) to your Vercel account and stores the key there.
# Run it yourself:  bash tools/deploy-proxy.sh
# It asks for your Sales API key without showing it, makes a private token for your browser,
# saves both as Vercel environment variables (server-side only), deploys, and prints what to paste.
set -euo pipefail
cd "$(dirname "$0")/.."
read -rsp "Paste your Sales API key (psk_live_…), then Enter: " KEY; echo
[[ "$KEY" == psk_* ]] || { echo "That doesn't look like a Sales API key."; exit 1; }
TOKEN="kc_$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')"
npx --yes vercel link --yes --project killian-cadence-api >/dev/null
put() { npx --yes vercel env rm "$1" production --yes >/dev/null 2>&1 || true; printf %s "$2" | npx --yes vercel env add "$1" production >/dev/null; echo "  ✓ $1"; }
put POPPY_SALES_API_URL "https://api.getpoppy.ai/api/v1/sales"
put POPPY_SALES_KEY "$KEY"
put CADENCE_PROXY_TOKEN "$TOKEN"
put CADENCE_ORIGIN "https://killianward8-lab.github.io"
put CADENCE_CLOSER "killian@getpoppy.ai"
URL=$(npx --yes vercel deploy --prod --yes 2>/dev/null | tail -1)
echo
echo "Deployed: $URL"
echo "Now open this link once in Chrome (it saves the connection in your browser, then cleans the address bar):"
echo "  https://killianward8-lab.github.io/cadence/?sales=${URL}/api/poppy-sales&salesToken=${TOKEN}"
