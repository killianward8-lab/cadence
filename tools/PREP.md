# Pre-call briefs

The Pre-call tab shows briefs for today's calls. The page cannot reach Poppy's calendar or
CRM, so the briefs are written outside the page and pasted in. They live in the browser's
localStorage (`kc:calls`) and never touch this repo. Do not commit real briefs here.

## The recipe (for Claude)

1. Pull today's bookings for Killian from the Poppy MCP (`upcoming_calls`), then for each
   person `lead_journey` / `customer` (trial dates, usage, payments, notes) and anything
   useful from Close (last touches, notes).
2. Write one object per call in the shape below. Keep each section to 1–3 plain sentences.
   `reach` is a ready-to-send text + email. `close` is the one thing to say to close them.
3. Hand it over either by pasting into **Pre-call → Paste a brief**, or by setting it in
   Killian's Chrome on the Cadence page: `localStorage.setItem("kc:calls", JSON.stringify(list))`
   then reload.

## Shape (made-up example)

```json
[
  {
    "date": "2026-10-27",
    "time": "9pm",
    "type": "Group onboarding",
    "name": "Sam Rivera",
    "email": "sam@example.com",
    "bio": "Yoga teacher, two retreats a year",
    "calendar": "Poppy AI Content Strategy & Onboarding Call with Killian Ward",
    "instagram": "https://instagram.com/example",
    "confirmed": "no",
    "score": "3/10 · likely a no-show",
    "trialStart": "2026-10-23",
    "renews": "2026-10-30",
    "offerId": "renew",
    "sections": {
      "confirmed": "No · 3/10 · likely a no-show",
      "reach": "Text: Hey Sam, Killian from Poppy, still good for 9pm?\nEmail: …",
      "who": "On day 4 of the $1 trial, renews Oct 30",
      "putOut": "Posts twice a month, best post 1,500 views, no link in bio",
      "usePoppy": "6 messages · 53 credits this month",
      "close": "Making scripts alone and nothing turns views into bookings, so …",
      "soFar": "We reached out twice this week"
    }
  }
]
```

`type` is one of: Group onboarding · 1-on-1 onboarding · Closing call · Set.
`confirmed` is `yes`, `no` or `unknown`. "Open the deck →" on a card copies name, email,
trial dates and the offer into the Deck tab.
