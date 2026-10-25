"""Tiny SVG helpers for the SIMADRepair diagram set (diagram-design skin)."""
from html import escape

PAPER = "#FBFCFB"
PAPER2 = "#F5F7F5"
INK = "#131815"
MUTED = "#515852"
SOFT = "#646B65"
RULE = "#E4E8E5"
ACCENT = "#0F7A45"
ACCENT_TINT = "#E7F2EC"
LINK = "#2D6FB8"

SANS = "'Hanken Grotesk', system-ui, sans-serif"
MONO = "'IBM Plex Mono', ui-monospace, monospace"
FONT_LINK = ("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400"
             "&family=IBM+Plex+Mono:wght@400;500;600&display=swap")

NAME = 16      # presentation node-name
SUB = 12       # presentation sublabel
ARROW = 12     # presentation arrow label
TAG = 8        # eyebrow / tag

KINDS = {
    "focal":    (ACCENT_TINT, ACCENT, "1.2", None),
    "backend":  ("#FFFFFF", INK, "1", None),
    "store":    ("rgba(19,24,21,0.05)", MUTED, "1", None),
    "external": ("rgba(19,24,21,0.03)", "rgba(19,24,21,0.30)", "1", None),
    "input":    ("rgba(81,88,82,0.10)", SOFT, "1", None),
    "optional": ("rgba(19,24,21,0.02)", "rgba(19,24,21,0.30)", "1", "4,3"),
}


def mono_w(text, size=ARROW):
    return len(text) * 0.62 * size


def t(x, y, s, size=NAME, weight=600, fill=INK, family=SANS, anchor="middle", spacing=None, italic=False):
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    st = ' font-style="italic"' if italic else ""
    return (f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}" font-weight="{weight}" '
            f'font-family="{family}" text-anchor="{anchor}"{ls}{st}>{escape(s)}</text>')


def node(x, y, w, h, name, sub=None, kind="backend", tag=None, rx=6):
    fill, stroke, sw, dash = KINDS[kind]
    d = f' stroke-dasharray="{dash}"' if dash else ""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{PAPER}"/>',
           f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>']
    if tag:
        tw = int(len(tag) * 0.62 * TAG + 12)
        tw += (4 - tw % 4) % 4
        tag_stroke = ACCENT if kind == "focal" else MUTED
        out.append(f'<rect x="{x+8}" y="{y+8}" width="{tw}" height="12" rx="2" fill="none" stroke="{tag_stroke}" stroke-opacity="0.5" stroke-width="0.8"/>')
        out.append(t(x + 8 + tw / 2, y + 17, tag, size=TAG, weight=500, fill=tag_stroke if kind == "focal" else SOFT, family=MONO, spacing="0.08em"))
    names = name if isinstance(name, (list, tuple)) else [name]
    cx = x + w / 2
    lines = len(names) + (1 if sub else 0)
    top_pad = 8 if tag else 0
    block = len(names) * 20 + (18 if sub else 0)
    y0 = y + top_pad + (h - top_pad - block) / 2 + 15
    for i, n in enumerate(names):
        out.append(t(cx, round(y0 + i * 20, 1), n, size=NAME, weight=600))
    if sub:
        subs = sub if isinstance(sub, (list, tuple)) else [sub]
        for j, s in enumerate(subs):
            out.append(t(cx, round(y0 + len(names) * 20 + 2 + j * 16, 1), s, size=SUB, weight=400, fill=SOFT, family=MONO))
    return "\n".join(out)


def path(d, color="muted", dashed=False, start=False, width="1.2"):
    col = {"muted": MUTED, "accent": ACCENT, "link": LINK}[color]
    mk = {"muted": "arrow", "accent": "arrow-accent", "link": "arrow-link"}[color]
    da = ' stroke-dasharray="5,4"' if dashed else ""
    ms = f' marker-start="url(#{mk}-start)"' if start else ""
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{width}"{da} marker-end="url(#{mk})"{ms}/>'


def label(cx, cy, text, color=SOFT):
    """Masked arrow label centred at (cx, cy) - cy is the text's vertical centre."""
    w = mono_w(text) + 10
    w = int(w + (4 - int(w) % 4) % 4)
    return (f'<rect x="{cx - w/2}" y="{cy - 8}" width="{w}" height="16" rx="2" fill="{PAPER}"/>'
            + t(cx, cy + 4, text, size=ARROW, weight=500, fill=color, family=MONO, spacing="0.06em"))


def label_above_h(x1, x2, y, text, color=SOFT):
    return label((x1 + x2) / 2, y - 8 - 8, text, color)


def label_left_v(x, y1, y2, text, color=SOFT):
    w = mono_w(text) + 10
    return label(x - 8 - w / 2, (y1 + y2) / 2, text, color)


def label_right_v(x, y1, y2, text, color=SOFT):
    w = mono_w(text) + 10
    return label(x + 8 + w / 2, (y1 + y2) / 2, text, color)


def legend(y, items, x0=40, step=200, width=1280):
    out = [f'<line x1="{x0}" y1="{y-16}" x2="{width-x0}" y2="{y-16}" stroke="{RULE}" stroke-width="1"/>',
           t(x0, y + 4, "LEGEND", size=TAG, weight=500, fill=SOFT, family=MONO, anchor="start", spacing="0.14em")]
    x = x0 + 80
    for kind, text in items:
        out.append(legend_swatch(x, y - 6, kind))
        out.append(t(x + 34, y + 4, text, size=11, weight=400, fill=MUTED, family=SANS, anchor="start"))
        x += step
    return "\n".join(out)


def legend_swatch(x, y, kind):
    if kind in KINDS:
        fill, stroke, sw, dash = KINDS[kind]
        d = f' stroke-dasharray="{dash}"' if dash else ""
        return f'<rect x="{x}" y="{y}" width="24" height="14" rx="3" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'
    if kind == "arrow":
        return f'<line x1="{x}" y1="{y+7}" x2="{x+24}" y2="{y+7}" stroke="{MUTED}" stroke-width="1.2" marker-end="url(#arrow)"/>'
    if kind == "arrow-accent":
        return f'<line x1="{x}" y1="{y+7}" x2="{x+24}" y2="{y+7}" stroke="{ACCENT}" stroke-width="1.2" marker-end="url(#arrow-accent)"/>'
    if kind == "arrow-dashed":
        return f'<line x1="{x}" y1="{y+7}" x2="{x+24}" y2="{y+7}" stroke="{MUTED}" stroke-width="1" stroke-dasharray="5,4" marker-end="url(#arrow)"/>'
    if kind == "arrow-link":
        return f'<line x1="{x}" y1="{y+7}" x2="{x+24}" y2="{y+7}" stroke="{LINK}" stroke-width="1.2" marker-end="url(#arrow-link)"/>'
    if kind == "dot":
        return f'<circle cx="{x+12}" cy="{y+7}" r="5" fill="{INK}"/>'
    if kind == "dot-accent":
        return f'<circle cx="{x+12}" cy="{y+7}" r="5" fill="{ACCENT}"/>'
    if kind == "pain":
        return f'<rect x="{x}" y="{y}" width="24" height="14" rx="2" fill="{ACCENT_TINT}" stroke="{ACCENT}" stroke-opacity="0.5" stroke-dasharray="3,3"/>'
    if kind == "band":
        return f'<rect x="{x}" y="{y}" width="24" height="14" rx="2" fill="{PAPER2}" stroke="{RULE}"/>'
    raise ValueError(kind)


DEFS = f'''<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{MUTED}"/></marker>
  <marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{ACCENT}"/></marker>
  <marker id="arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{LINK}"/></marker>
  <marker id="arrow-start" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto"><polygon points="8 0, 0 3, 8 6" fill="{MUTED}"/></marker>
</defs>'''


def page(slug, eyebrow, title, lede, body, desc, vb=(1280, 720), footer=None, dy=0):
    w, h = vb
    if dy:
        body = f'<g transform="translate(0,{dy})">\n' + body + '\n</g>'
    foot = f'<p class="foot">{escape(footer)}</p>' if footer else ""
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(title)} · SIMADRepair</title>
  <link href="{FONT_LINK}" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --paper: {PAPER}; --ink: {INK}; --muted: {MUTED}; --soft: {SOFT}; --accent: {ACCENT}; --rule: {RULE};
      --font-sans: {SANS}; --font-mono: {MONO};
    }}
    body {{ font-family: var(--font-sans); background: var(--paper); color: var(--ink);
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 28px 32px; }}
    .frame {{ max-width: {w}px; width: 100%; }}
    .head {{ display: flex; align-items: baseline; justify-content: space-between; gap: 24px; margin-bottom: 10px; }}
    .eyebrow {{ font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }}
    h1 {{ font-size: 40px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }}
    .lede {{ font-size: 17px; color: var(--muted); margin-top: 6px; max-width: 900px; }}
    .brand {{ font-family: var(--font-mono); font-size: 12px; color: var(--soft); white-space: nowrap; }}
    .diagram-container {{ width: 100%; overflow-x: auto; }}
    svg {{ width: 100%; min-width: {w}px; display: block; }}
    .foot {{ font-size: 14px; color: var(--soft); margin-top: 6px; }}
    @media print {{ .diagram-container {{ overflow-x: visible; }} svg {{ min-width: 0; }} }}
  </style>
</head>
<body>
  <div class="frame">
    <div class="head">
      <div>
        <p class="eyebrow">{escape(eyebrow)}</p>
        <h1>{escape(title)}</h1>
        <p class="lede">{escape(lede)}</p>
      </div>
      <p class="brand">SIMADRepair · Faculty of Computing</p>
    </div>
    <div class="diagram-container">
      <svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{slug}-title {slug}-desc">
        <title id="{slug}-title">{escape(title)}</title>
        <desc id="{slug}-desc">{escape(desc)}</desc>
        {DEFS}
        <rect width="100%" height="100%" fill="{PAPER}"/>
{body}
      </svg>
    </div>
    {foot}
  </div>
</body>
</html>
'''
