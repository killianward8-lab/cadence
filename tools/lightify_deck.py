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
"""
(root / "deck-light.css").write_text(res, encoding="utf-8")
print("deck-light.css", len(res))
