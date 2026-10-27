# Sales API proxy

Deploy this folder's function on Vercel (free): `npx vercel` from the repo root, then set the
env vars in the Vercel dashboard: `POPPY_SALES_API_URL`, `POPPY_SALES_KEY`, `CADENCE_PROXY_TOKEN`
(any long random string; the same one is pasted into the page once), `CADENCE_ORIGIN`
(`https://killianward8-lab.github.io`), `CADENCE_CLOSER` (`killian@getpoppy.ai`).

The page calls `https://<your-vercel-app>/api/poppy-sales?path=/catalog` with the header
`x-cadence-token`. Test in mock mode first: point `POPPY_SALES_API_URL` at an isolated mock
API (ask JD) with key `psk_mock_local`, and check every answer has `Sales-Mock-Now`.
