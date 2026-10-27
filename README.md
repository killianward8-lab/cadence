# Killian's Cadence

Killian's own call tool: Script, Objections and a Deck with Present mode, built on the
script exported from **https://getpoppy.ai/killian/cadence**. This repo is both the editable
words (`stages.json`, `objections.json`, `offers.json`) and the app that shows them
(`index.html`, `app.js`, `styles.css`, `deck.json`).

## The app

- **Script**: 7 stages, variants per stage (Standard / Onboarding / ...), Dig-deeper panel.
  Keys: `←` `→` stages, `1`–`7` jump.
- **Objections**: search (`/`), filter by category, every objection with its Reframe,
  Analogy, Then and Close.
- **Deck**: fill in the call (name, trial dates, pay link, card on file), pick the offer,
  then **Present**. In Present the toolbar has the **offer switch** (Year / Life / Starter /
  Creator / Power / VCS / YT VCS / Build) and the pay plan (Full / 6 mo / 24 mo), so you
  never leave the deck. Keys: `←` `→` slides, `1`–`5` jump, `O` next offer, `P` `W` `K`
  pay plan, `F` fullscreen, `Esc` close.
- Slides: Cover · Offer · Pay · Gameplan · Review. Deck-only copy (bonuses, guarantee,
  game plan, review link) lives in `deck.json`.

Run it locally: `python3 tools/serve.py` then open http://localhost:8787.
Published copy: GitHub Pages from the `main` branch root (turn it on under
Settings → Pages). No login, no customer data: the call details you type stay in your browser.

What it does **not** do yet (Phase 2, needs Poppy's backend): today's calls list, charging
the card on file, pay links, Spotify, Tactiq. Keep Mo's page open in another tab for those.

Exported from the live page on 2026-10-27. At that point nothing had been saved to the server
for Killian, so this is the built-in default script with Killian's name in the intro lines.

## What's in here

| File | What it is | Edit it? |
|---|---|---|
| `stages.json` | The 7 stages (Frame → Pitch & Close). Each stage has variants (Standard, Onboarding, ...) and each variant is a list of lines. | yes |
| `objections.json` | 53 objections. Each has the question, the Acknowledge/Ask/Lock/Solve lines, a reframe, an analogy and a close. | yes |
| `offers.json` | The 8 offers the Deck can pitch (Poppy for the year, Poppy for Life, Starter, Creator, Power User, VCS, YouTube VCS, AI build) with prices and stacks. | careful, prices are company rules |
| `coaches.json` | The coach cards (Malu, Charan, Christian, Linden). | rarely |
| `versions.json` | `obv` / `ov` / `offv`. Leave alone. If `obv` drops below what the app ships, the page overwrites your Onboarding variants with its defaults. | no |
| `cadence.json` | All of the above joined into the one document the page stores. Generated. | no, run assemble |
| `SCRIPT.md`, `OBJECTIONS.md` | Readable copies for phone or skim. Generated. | no |

Square brackets like `[name]`, `[goal]`, `[$X]` are fill-in-the-blank on the call. Lines in
parentheses are stage directions, not things you say.

## Editing

1. Edit `stages.json` or `objections.json` (any editor, or ask Claude).
2. Run `python3 tools/assemble.py` to rebuild `cadence.json`, `SCRIPT.md` and `OBJECTIONS.md`.
3. Commit and push.
4. Push it to the live page (below).

## Getting it onto the live page

The page stores the script in the Poppy team store under the key `cadence:killian`.
There is no API key for that store, it uses your getpoppy.ai sign-in, so the push happens
from a browser that is signed in as killian@getpoppy.ai:

- **Easiest:** tell Claude "push my cadence to live". Claude in Chrome does the steps below.
- **By hand:** copy `cadence.json` to the clipboard, open the Cadence page, open the DevTools
  Console, paste `tools/push-to-live.js`, press Enter, reload.

Quirk found on 2026-10-27: the store returns the doc as a text string and the page ignores it
in that form, so what the page really reads on load is its browser cache (`cd:content` in
localStorage). The push snippet sets both. If you open Cadence in a new browser, push again there.

`tools/pull-from-live.js` does the reverse (live page → clipboard), and `tools/split.py` splits a
pasted `cadence.json` back into the four files. Use that if you ever edit on the page itself
(the Edit button on the Script tab) and want the repo to catch up.

**Reset** in the page's Edit mode wipes the saved copy and goes back to the built-in script.

## Shape cheat sheet

```jsonc
// stages.json
{ "id": "frame", "n": 1, "name": "Frame", "variants": [
    { "id": "standard", "label": "Standard", "flow": ["line", "line"] } ] }

// objections.json
{ "id": "too-expensive", "cat": "money", "group": "Price", "q": "It's too expensive.",
  "lines": [["Acknowledge", "..."], ["Ask", "..."], ["Lock", "..."], ["Solve", "..."]],
  "close": "...", "rname": "Reframe title", "rask": "permission line", "reframe": "...",
  "aname": "Analogy title", "aask": "permission line", "analogy": "...", "next": "...",
  "beliefAfter": true }
```

`cat` is one of money · timing · people · fear · fit · early. `group` is the sub-heading the
page shows. Line tags the page knows: Acknowledge, Associate, Ask, Certainty, "Or, callback",
Lock, Solve, Answer, Show.
