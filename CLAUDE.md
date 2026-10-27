# Killian's Cadence

Static call tool (GitHub Pages) plus a small serverless proxy for Poppy's Sales API.

- Script/objections/offers live in the JSON files; `python3 tools/assemble.py` rebuilds
  `cadence.json`. Never commit customer data, keys or pre-call briefs.
- For Poppy sales or billing changes, use the poppy-sales-api skill at
  `.claude/skills/poppy-sales-api/SKILL.md` and fetch its latest guide before implementation.
- Money today runs two ways: `poppy.js` (Mo's internal getpoppy.ai endpoints with a machine key
  in the browser) and, once deployed, `api/poppy-sales.js` (the official Sales API, key on the
  server). Switch one path at a time; never let both charge for the same action.
