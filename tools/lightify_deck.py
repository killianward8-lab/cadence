#!/usr/bin/env python3
"""deck-light.css from deck-mo.css: Mo's slides, light colours."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / "deck-mo.css").read_text(encoding="utf-8")
MAP = {
  "#0b0a12": "#F7F7FC", "#06050c": "#F7F7FC", "#13111f": "#FFFFFF", "#15131f": "#FFFFFF", "#16121f": "#FFFFFF", "#141220": "#FFFFFF", "#12101e": "#FFFFFF", "#1c1830": "#EEEFF7", "#2a2448": "#E6E7F2", "#1f1a36": "#5B4BD6", "#2e2654": "#6D5CE0", "#4a3c86": "#8F7BF2",
  "#f4f2ff": "#14162A", "#f2f1f8": "#14162A", "#ece8ff": "#14162A", "#dcd8f2": "#2A2F48", "#c9c4e6": "#3B4160", "#cfcbe6": "#3B4160", "#c4b5fd": "#5546C9", "#a5a1bd": "#6B7390", "#8f8aae": "#6B7390", "#7f7a99": "#8A91A8", "#6e6a88": "#8A91A8", "#5f5a7c": "#9AA1B8", "#3a3654": "#D2D6E3",
  "#a78bfa": "#6D5CE0", "#9d8cff": "#6D5CE0", "#7c6cf4": "#6D5CE0", "#c4b8ff": "#5546C9",
  "#f5c64f": "#B7791F", "#f8d46c": "#E0B74A", "#f0b93a": "#D19A2A", "#e9c46a": "#B7791F", "#bdf5d9": "#1E9E6A",
  "#4ade97": "#1E9E6A", "#6ef2b3": "#4CCB95", "#2fd487": "#1E9E6A", "#9fd9bd": "#1E9E6A", "#00d66f": "#1E9E6A",
  "#ff8e80": "#D94C4C", "#ff8fa3": "#D94C4C",
  "#08070c": "#F7F7FC", "#06070c": "#F7F7FC", "#14100a": "#F7F3E8", "#06050a": "#FFFFFF", "#12101c": "#FFFFFF", "#14111e": "#FFFFFF",
  "#1a1628": "#E6E7F2", "#181428": "#EDEBFA", "#2a2340": "#EEEFF7", "#121520": "#FFFFFF", "#0a0c12": "#F4F5FA", "#121020": "#F4F5FA",
  "#2b2250": "#5B4BD6", "#4b3a9e": "#6D5CE0", "#9d7bf5": "#A58CF7", "#2a2252": "#F1F0FA", "#16122c": "#FFFFFF", "#0e2a1f": "#1E9E6A", "#145c3e": "#2AB27C", "#0c1512": "#1E9E6A", "#13261f": "#2AB27C", "#1f4a38": "#4CCB95",
}
def hexmap(m):
  h = m.group(0).lower(); base, alpha = h[:7], h[7:]
  if base in MAP: return MAP[base] + alpha
  if base == "#ffffff" and alpha: return "#101228" + alpha
  if base == "#000000" and alpha: return "#101228" + alpha
  return m.group(0)
def rgba(m):
  r, g, b, a = m.groups()
  if (r, g, b) == ("255", "255", "255"): return f"rgba(16,18,40,{a})"
  if (r, g, b) == ("124", "108", "244"): return f"rgba(109,92,224,{a})"
  if (r, g, b) == ("245", "198", "79"): return f"rgba(183,121,31,{a})"
  if (r, g, b) == ("167", "139", "250"): return f"rgba(109,92,224,{a})"
  if (r, g, b) == ("74", "222", "151"): return f"rgba(30,158,106,{a})"
  if (r, g, b) == ("0", "0", "0"): return f"rgba(16,18,40,{max(0.05, float(a) * 0.35):.2f})"
  return m.group(0)
res = re.sub(r"#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b", hexmap, css)
res = re.sub(r"rgba\((\d+),(\d+),(\d+),([.\d]+)\)", rgba, res)
res = re.sub(r"#fff\b(?![0-9a-fA-F])", "#14162A", res)
# pale text colours meant for dark panels -> readable on light (text only, backgrounds untouched)
TEXT = {}
for k in "fbe08a ffe7a3 f5d98a ffc48a".split(): TEXT[k] = "#B7791F"
for k in "e9e3ff ede7ff e9e6fa e4dcff d9d0ff d9d3f5 e6e3f5 e8e5f5".split(): TEXT[k] = "#2A2F48"
for k in "c9c5dd c9c5e0 cfc8ee".split(): TEXT[k] = "#4A5070"
for k in "b8f5d4 7cf0b8 7bf0b6 7fd9ae 9fe8c4 8fd9b4 e9fff4".split(): TEXT[k] = "#1E9E6A"
for k in "ffb4a8 ffb4c2 e9c6c0".split(): TEXT[k] = "#D94C4C"
TEXT["c9beff"] = "#5546C9"; TEXT["ffb46a"] = "#C2410C"
res = re.sub(r"((?<![-\w])color:\s*)#([0-9a-fA-F]{6})\b", lambda m: m.group(1) + TEXT.get(m.group(2).lower(), "#" + m.group(2)), res)
# gradient text (gold / lilac headline words) needs deeper stops on white
def deepen(m):
  body = m.group(2)
  if "clip:text" not in body: return m.group(0)
  for a, b in (("#fbe08a", "#D9A12E"), ("#e9b53a", "#A86E12"), ("#f8d46c", "#C98A1E"), ("#E0B74A", "#C98A1E"), ("#c9bcff", "#7A68F0"), ("#8b7bff", "#5546C9"), ("#ffb4a8", "#E8665A"), ("#ffe29a", "#D9A12E")):
    body = re.sub(a, b, body, flags=re.I)
  return m.group(1) + "{" + body + "}"
res = re.sub(r"([^{}]*)\{([^{}]*)\}", deepen, res)
res += """
/* light touch-ups */
.dk-slide{background:#F7F7FC;color:#14162A}
.dk-orb.a{background:radial-gradient(circle,rgba(109,92,224,.22),rgba(109,92,224,.06) 42%,transparent 66%)}
.dk-orb.b{background:radial-gradient(circle,rgba(183,121,31,.12),rgba(183,121,31,.03) 42%,transparent 66%)}
.dk-present{background:#EEEFF7}
.dk-present .dk-tools{background:rgba(255,255,255,.85);border-color:rgba(16,18,40,.12);box-shadow:0 10px 30px rgba(16,18,40,.18)}
.dk-present .dk-tools button{color:#3B4160}
.dk-present .dk-tools button:hover:not(:disabled){background:rgba(16,18,40,.06);color:#14162A}
.dk-tools .cnt{color:#14162A}
.dk-present .dk-tools .seg button.on{color:#fff;background:#6D5CE0;box-shadow:none}
.dk-pay.one .cc,.dk-charging .cc{color:#fff}
.dk-pay.one .cc .cc-num,.dk-pay.one .cc-bot b,.dk-pay.one .cc-bot span,.dk-pay.one .cc .bm,.dk-pay.one .cc-top b{color:#fff}
.dk-pay.one .cc.ghost .cc-num{color:#fff}
.dk-offer3 .bonus .face .art{color:#fff}
.dk-review .qr{border:1px solid rgba(16,18,40,.12)}
.dk-stage .dk-label{text-shadow:none}
.dk-review .qr,.dk-obdone .qr{background:#fff}
.dk-review .qr small,.dk-obdone .qr small{color:#14162A}
.dk-review .tp{filter:brightness(.25)}
.dk-pay.one .cc.ghost{background:linear-gradient(135deg,#E6E7F2,#D6D8E8)}
.dk-pay.one .cc.ghost .cc-num,.dk-pay.one .cc.ghost .cc-bot span{color:#14162A}
.dk-pay.one .cc.ghost .bm{color:#14162A}
.dk-charging .cc-num,.dk-charging .cc-bot b,.dk-charging .cc-bot span,.dk-charging .cc-top b{color:#fff}
.dk-pay.one .cc.paid,.dk-pay.one .cc.paid b,.dk-pay.one .cc.paid span,.dk-pay.one .cc.paid .pd-ic{color:#fff}
.dk-gp .c b,.dk-party h1,.dk-obcover h1,.dk-slide h1,.dk-slide h2{color:#14162A}
.dk-offer3 .o-price .path.today b{color:#B7791F}
.dk-welcome button,.dk-welcome a,.dk-gp .send a{color:#fff}
.dk-review .acts button{color:#fff}
.dk-pay.one .pay{color:#1a1428!important}
.dk-pay.one .cc.paid .pd-mid span{color:rgba(255,255,255,.75)}
.dk-pay.one .cc.paid .pd-bot,.dk-pay.one .cc.paylink .pl-link button.ghostbtn{color:#fff}
.dk-crew .cards:has(> .cc:nth-child(2):last-child){grid-template-columns:repeat(2,minmax(0,1fr))}
/* the card on file: Mo's dark card with a real shine (lightify turned the white streak dark) */
.dk-pay.one .cc:not(.ghost):not(.paid):not(.is-mc):not(.is-amex):not(.is-link){background:linear-gradient(135deg,#1f1a36,#2e2654 55%,#4a3c86)}
.dk-pay.one .cc:not(.ghost){box-shadow:0 1.6cqw 4cqw rgba(16,18,40,.38),0 0 0 1px rgba(255,255,255,.1) inset}
.dk-pay.one .cc .sweep{width:30%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);animation:cc-sweep 4.5s ease-in-out infinite}
.dk-pay.one .cc.ghost .sweep{background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation-duration:1.6s}
.dk-pay.one .cc .gloss{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(155deg,rgba(255,255,255,.2),rgba(255,255,255,0) 38%),radial-gradient(80% 60% at 100% 0%,rgba(167,139,250,.25),transparent 60%)}
.dk-pay.one .cc .cc-num .l4{font-weight:800;color:#fff;letter-spacing:.08em}
.dk-pay.one .cc .exp small{display:block;font:700 .55cqw Manrope;letter-spacing:.12em;color:rgba(255,255,255,.6)}
.dk-pay.one .cc .exp span{font:700 1cqw Manrope;color:#fff}
.dk-pay.one .float.rise .cc{animation:cc-rise .9s cubic-bezier(.2,.9,.25,1) both!important}
@keyframes cc-rise{0%{opacity:0;transform:translateY(4cqw) rotate(-9deg) scale(.9)}60%{opacity:1}100%{opacity:1;transform:rotate(-2.5deg)}}
.dk-pay.one .cc-cap{margin:1.1cqw 0 0;font:600 .95cqw Manrope;color:#4A5070;text-align:center}
.dk-pay.one .cc-cap b{color:#14162A;letter-spacing:.06em}
.dk-charging .cc{background:linear-gradient(135deg,#2b2250,#4b3a9e 45%,#9d7bf5 75%,#f5c64f 130%)}
.dk-charging .cc .sweep{background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)}
.dk-pay.one .cc.paid .shine{background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)}
.dv{background:linear-gradient(180deg,#FFFFFF,#F4F5FA)}
.dk-guarban{background:linear-gradient(135deg,#E3F6EC,#D3F0E1);color:#14162A}
:where(.dk-present) :where(button,input,textarea,select){font-family:Manrope,Inter,system-ui,sans-serif}
.dk-present .dk-tools .dk-price{background:#FFFFFF;border-color:rgba(16,18,40,.12);box-shadow:0 14px 40px rgba(16,18,40,.18)}
"""
(root / "deck-light.css").write_text(res, encoding="utf-8")
print("deck-light.css", len(res))
