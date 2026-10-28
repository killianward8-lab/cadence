#!/bin/bash
# Connects your Cadence in Chrome to the Sales API server. No key needed (it's already on Vercel).
# Makes a fresh private code, saves it on Vercel, redeploys, then opens Cadence in Chrome with it.
set -euo pipefail
cd "$(dirname "$0")/.."
TOKEN="kc_$(python3 -c 'import secrets;print(secrets.token_urlsafe(32))')"
echo "Saving a fresh private code on Vercel…"
npx --yes vercel env rm CADENCE_PROXY_TOKEN production --yes >/dev/null 2>&1 || true
printf %s "$TOKEN" | npx --yes vercel env add CADENCE_PROXY_TOKEN production >/dev/null
echo "Redeploying (about 30 seconds)…"
npx --yes vercel deploy --prod --yes >/dev/null 2>&1
open -a "Google Chrome" "https://killianward8-lab.github.io/cadence/?sales=https://killian-cadence-api.vercel.app/api/poppy-sales&salesToken=${TOKEN}"
echo "Done. Chrome opened your Cadence. Look for \"Sales API connected\"."
