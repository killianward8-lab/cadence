#!/usr/bin/env python3
"""Make app-light.css from app-mo.css: Mo's layout, light colours. Deck rules (.dk-*, .bx, .confetti) are left dark."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / "app-mo.css").read_text(encoding="utf-8")

# Light palette for Mo's variables
VARS = {
  ".cd": "--bg:#F6F7FB;--s1:#FFFFFF;--s2:#F1F2F7;--s3:#E7E9F1;--line:rgba(16,18,40,.09);--line2:rgba(16,18,40,.16);--ink:#14162A;--soft:#3B4160;--mute:#6B7390;--faint:#9AA1B8;--acc:#6D5CE0;--acc2:#5546C9;--ok:#1E9E6A;--no:#D94C4C;",
  ":root": "--bg:#F6F7FB;--panel:#FFFFFF;--panel2:#F1F2F7;--line:#E3E6EF;--line2:#D2D6E3;--ink:#14162A;--mute:#6B7390;--dim:#9AA1B8;--accent:#6D5CE0;--won:#1E9E6A;--dead:#D94C4C;--fu:#B7791F;--cash:#9A6B00;--t2:#4B5270;--ltfu:#4F5BD5;",
}
# Hard-coded colours that mean "dark background" or "light text" in Mo's dark theme
MAP = {
  "#0b0a12": "#F6F7FB", "#08090d": "#F6F7FB", "#120f1f": "#F6F7FB", "#0b0d12": "#F6F7FB", "#06050c": "#F6F7FB",
  "#13151d": "#FFFFFF", "#12151c": "#FFFFFF", "#1a1d27": "#F1F2F7", "#171b24": "#F1F2F7", "#222634": "#E7E9F1", "#15131f": "#FFFFFF", "#13111f": "#FFFFFF", "#16121f": "#FFFFFF", "#1c1830": "#F1F2F7", "#141220": "#FFFFFF", "#12101e": "#FFFFFF", "#101218": "#FFFFFF", "#0b0c10": "#F6F7FB", "#1a1433": "#F1F2F7",
  "#f3f4f8": "#14162A", "#f2f1f8": "#14162A", "#f4f2ff": "#14162A", "#ece8ff": "#14162A", "#e8eaf0": "#14162A", "#dcd8f2": "#2A2F48", "#c7ccd8": "#3B4160", "#c9c5dd": "#3B4160", "#c9c4e6": "#3B4160", "#cfcbe6": "#3B4160", "#cfc8ee": "#3B4160", "#aeb6c6": "#4B5270",
  "#a5a1bd": "#6B7390", "#8c88a3": "#6B7390", "#8b93a5": "#6B7390", "#8a92a6": "#6B7390", "#8f8aae": "#6B7390", "#79758f": "#8A91A8", "#7f7a99": "#8A91A8", "#565e70": "#9AA1B8", "#5b6479": "#9AA1B8", "#5f5a7c": "#9AA1B8", "#6e6a88": "#8A91A8", "#3a3654": "#D2D6E3", "#2a2740": "#E3E6EF",
  "#9d8cff": "#6D5CE0", "#a78bfa": "#6D5CE0", "#c4b8ff": "#5546C9", "#c4b5fd": "#5546C9", "#8b7cff": "#6D5CE0", "#7c6cf4": "#6D5CE0",
  "#4ade97": "#1E9E6A", "#5ed3a0": "#1E9E6A", "#6ee7a0": "#1E9E6A", "#34d399": "#1E9E6A", "#2fd487": "#1E9E6A", "#9fd9bd": "#1E9E6A",
  "#f5c64f": "#B7791F", "#f5d77a": "#9A6B00", "#fbbf24": "#B7791F", "#e9c46a": "#B7791F", "#f8d46c": "#D9A441", "#f0b93a": "#C68E1F",
  "#ff8e80": "#D94C4C", "#ff8fa3": "#D94C4C", "#f87171": "#D94C4C",
}
def is_deck(sel): return ".dk-" in sel or sel.strip().startswith(".bx") or ".confetti" in sel or "dk-" in sel
def hexmap(m):
  h = m.group(0).lower()
  base, alpha = h[:7], h[7:]
  if base in MAP: return MAP[base] + alpha
  if base == "#ffffff" and alpha: return "#101228" + alpha   # translucent white fills → translucent ink
  if base == "#000000" and alpha: return "#ffffff" + alpha
  return m.group(0)
def rgba(m):
  r, g, b, a = m.group(1), m.group(2), m.group(3), m.group(4)
  if (r, g, b) == ("255", "255", "255"): return f"rgba(16,18,40,{a})"
  if (r, g, b) == ("0", "0", "0"): return f"rgba(255,255,255,{a})"
  return m.group(0)
out = []; i = 0; n = len(css)
while i < n:
  j = css.find("{", i)
  if j < 0: out.append(css[i:]); break
  sel = css[i:j]; depth = 1; k = j + 1
  while k < n and depth:
    if css[k] == "{": depth += 1
    elif css[k] == "}": depth -= 1
    k += 1
  body = css[j:k]
  s = sel.strip()
  if s.startswith("@media") or s.startswith("@supports"):
    # recurse: treat the inner as a mini stylesheet
    inner = body[1:-1]
    sub = []; p = 0; m_ = len(inner)
    while p < m_:
      q = inner.find("{", p)
      if q < 0: sub.append(inner[p:]); break
      ssel = inner[p:q]; d = 1; r = q + 1
      while r < m_ and d:
        if inner[r] == "{": d += 1
        elif inner[r] == "}": d -= 1
        r += 1
      sb = inner[q:r]
      if not is_deck(ssel):
        sb = re.sub(r"#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b", hexmap, sb)
        sb = re.sub(r"rgba\((\d+),(\d+),(\d+),([.\d]+)\)", rgba, sb)
      sub.append(ssel + sb); p = r
    out.append(sel + "{" + "".join(sub) + "}")
  elif is_deck(s) or s.startswith("@keyframes") or s.startswith("@font-face"):
    out.append(sel + body)
  else:
    if s in VARS:
      body = "{" + VARS[s] + body[1:]
    body = re.sub(r"#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b", hexmap, body)
    body = re.sub(r"rgba\((\d+),(\d+),(\d+),([.\d]+)\)", rgba, body)
    out.append(sel + body)
  i = k
res = "".join(out)
res += """
/* light-mode touch-ups */
.cd{background:radial-gradient(1100px 520px at 50% -180px,rgba(109,92,224,.10),transparent 70%),var(--bg)}
.cd-top{background:rgba(246,247,251,.85)}
body{background:#F6F7FB;color:#14162A}
.dk-frame{box-shadow:0 20px 50px rgba(20,22,42,.18)}
"""
(root / "app-light.css").write_text(res, encoding="utf-8")
print("app-light.css", len(res), "bytes")
