# Killian's Cadence

Killian's own call tool: Script, Objections and a Deck with Present mode, built on the
script exported from **https://getpoppy.ai/killian/cadence**. This repo is both the editable
words (`stages.json`, `objections.json`, `offers.json`) and the app that shows them
(`index.html`, `app.js`, `styles.css`, `deck.json`).

## The app

Built to match Mo's Cadence tab for tab. Open https://killianward8-lab.github.io/cadence/

- **Pre-call**: today's calls as cards (time, type, name, confirmed / not confirmed, "They're
  late?") with the seven sections: Are they confirmed · Reach out before the call · Who they
  are · What they put out · How they use Poppy · What you need to close them · What happened
  so far. Sheet or Cards view. "Open the deck →" carries the call into the Deck. Briefs are
  pasted in (or dropped in by Claude, see `tools/PREP.md`) and stay in your browser.
- **Script**: 7 stages with the "don't pitch yet" gate, situations per stage, numbered lines
  with copy buttons, Dig-deeper panel, next-stage button. Keys: `←` `→` `1`–`7`.
- **Objections**: category chips with counts (Money · Timing · Decision maker · Trust & fear ·
  Fit & value · Early in the call), grouped list on the left, the objection on the right with
  phases (Acknowledge & Ask · Certainty · Lock · Solve), the pause cue, Reframe, Analogy, Then
  and Close. Search with `/`.
- **Edit**: on Script and Objections. Edit lines, reorder, delete, add situations and
  objections. Saves in your browser. "Download cadence.json" gives you the file to commit
  (then `python3 tools/split.py`). "Reset" goes back to the repo copy.
- **Deck**: 1 Your calls (or the Practice call) · 2 The call (name, email, trial dates, "the
  deal in your words" → a "For you" box on the Offer slide) · 3 The deal (Group / 1-on-1,
  offer, full price / paid / today, pay plan, card on file, pay link) · 4 Log the call
  (outcome, cash, follow-up, note → saved in the browser + a line to paste into the tracker).
  Slide preview with a "Say it" coaching line under each slide, and a "Before you join" brief
  when the call came from Pre-call.
- **Present**: Mo's deck, pixel for pixel: his markup, his stylesheet (`deck-mo.css`), his fonts (Sora, Manrope), the orbs, the bonus flip-reveal (→ opens bonus 1, 2, 3, then the price), the floating card on the Pay slide, the charging animation, the game-plan cards rising in, the confetti party, the Trustpilot review slide. Click the right half of the screen to go forward, the left half to go back. Slides Cover · Offer · Pay · Gameplan (or Celebrate) · Review. Toolbar: ‹ n/5 ›, **Draw**
  (`D`, colours `1`–`4`), **Text** (`E`), clear (`C`), **Music** (`M`, Spotify playlists from
  `deck.json`, `N` next), **Offer switch** (Year / Life / Starter / Creator / Power / VCS /
  YT VCS / Build, `O` cycles), **Pay plan** (Full / 6 mo / 24 mo, `P` `W` `K`), **✓ Paid** on
  the Pay slide (turns the price green and throws the party), party toggle (`G`), fullscreen
  (`F`), close (`Esc`).
- **Pay** (Get Paid): who's paying, the offer grid, name on the checkout, Stripe or Whop, how
  they pay (full / 2 / 3 / 6 payments / monthly / yearly / custom) with per-payment maths,
  total and already paid, the "They pay" summary, copy a message for the chat. Add Stripe
  Payment Links in `deck.json → payLinks` to get a "Copy the link" button.
- **Practice**: the top-bar toggle loads a made-up group call (Sam Rivera, Alex Kim, Jordan
  Lee) with a fake card. Nothing is logged while it's on.

Run it locally: `python3 tools/serve.py` then open http://localhost:8787.
Everything you type (calls, deal, log, edits) stays in your browser. Nothing is sent anywhere.

### Live calls from Poppy

Poppy's server already lets any site call `/api/precall` with a machine key. Click **○ Poppy**
in the top bar once and paste your key (it stays in this browser, never in the repo). From then
on the Pre-call tab and the Deck's "Your calls" load today's bookings, trial dates, the
reach-out drafts, the brief and the room link straight from Poppy, same as Mo's page, and
refresh every 10 minutes or on "Check again". Opening the page as `…/cadence/?key=YOURKEY`
once does the same thing.

### Money, through Poppy (same calls as Mo's page)

With Poppy connected: the Deck's step 3 finds the card on file (trial customers via
`/api/upgrade`, everyone else via Stripe), **Make the link** puts a pay link + QR on the Pay
slide (OB: a 60-minute group link; Life: the Lifetime checkout; plans: Stripe yearly or Whop;
VCS / YT VCS / Build: one-time), and **Charge the card** on the Pay slide runs the same route
Mo's page uses (Life → `/api/lifetime`, Year → `/api/upgrade`, plans → `/api/plan-upgrade`,
services → `/api/paylink charge`). A decline puts the fix link on the slide. The Pay tab makes
links for any offer and plan (full, 2/3/6 monthly charges, monthly, yearly, custom) on Stripe
or Whop. **Practice** keeps all of this in Stripe test mode and skips charges.

Posts go to Poppy as `text/plain` on purpose: the server parses the JSON, and it avoids the
CORS preflight that getpoppy.ai doesn't answer. GitHub Pages caches files for ~10 minutes, so
hard-refresh after an update.

### Still only on Mo's page

"Update the deck" from a transcript · sending the room link, welcome email or team seats ·
Tactiq / Grain · logging straight to the tracker.

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
