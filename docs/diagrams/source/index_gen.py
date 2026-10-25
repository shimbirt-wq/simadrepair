import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib import *
from html import escape
items = [
 ("01-platform-overview.html", "Platform overview", "One platform for students, the lead desk, volunteer technicians and the admin."),
 ("02-end-to-end-swimlane.html", "The program, end to end", "Every handoff between people happens in the platform, from registration to the report."),
 ("03-ticket-lifecycle.html", "One repair, start to finish", "One status system; every repair ends with a clear outcome the student can see."),
 ("04-student-journey.html", "Student journey", "Six stages on a phone, each with a concrete improvement over today."),
 ("05-lead-desk.html", "Lead technician desk", "Check-in, assignment, a live board and pickup against the university ID card."),
 ("06-technician-flow.html", "Volunteer technician", "Claim, repair and record the fix; nothing is marked ready without tests."),
 ("07-admin-event-cycle.html", "Admin", "Set the event up once; registration, accounts, report and clean-up follow its dates."),
 ("08-before-after.html", "What changes", "Five weaknesses of today’s system and the change that removes each one."),
]
facts = [("200–500", "devices repaired per Maintenance Program"), ("4", "roles on one platform"),
         ("1", "tracked lifecycle for every repair"), ("WhatsApp", "updates in Somali and English")]
def svg_for(f, i):
    import re as _re
    h = (pathlib.Path(__file__).resolve().parent.parent / f).read_text()
    svg = h[h.index("<svg"):h.index("</svg>") + 6]
    pre = f"t{i+1}-"
    svg = _re.sub(r'id="(arrow[\w-]*)"', lambda m: f'id="{pre}{m.group(1)}"', svg)
    svg = _re.sub(r'url\(#(arrow[\w-]*)\)', lambda m: f'url(#{pre}{m.group(1)})', svg)
    svg = _re.sub(r'(id="|aria-labelledby="|\s)([\w-]+)-(title|desc)\b', lambda m: f'{m.group(1)}{pre}{m.group(2)}-{m.group(3)}', svg)
    return svg

cards = "\n".join(f'''      <a class="card" href="{f}">
        <span class="num">{i+1:02d}</span>
        <span class="ct">{escape(tt)}</span>
        <span class="cd">{escape(d)}</span>
        <span class="thumb">{svg_for(f, i)}</span>
      </a>''' for i, (f, tt, d) in enumerate(items))
fact_html = "\n".join(f'<div class="fact"><span class="fv">{escape(v)}</span><span class="fl">{escape(l)}</span></div>' for v, l in facts)
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIMADRepair — leadership briefing</title>
  <link href="{FONT_LINK}" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: {SANS}; background: {PAPER}; color: {INK}; padding: 56px 32px 72px; }}
    .wrap {{ max-width: 1200px; margin: 0 auto; }}
    .eyebrow {{ font-family: {MONO}; font-size: 12px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: {ACCENT}; }}
    h1 {{ font-size: clamp(36px, 5vw, 56px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin-top: 12px; }}
    .sub {{ font-size: 20px; color: {MUTED}; margin-top: 12px; }}
    .facts {{ display: grid; grid-template-columns: 1.1fr 0.8fr 1fr 1.1fr; gap: 16px; margin-top: 40px; }}
    .fact {{ background: #fff; border: 1px solid {RULE}; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }}
    .fact:first-child {{ border-color: {ACCENT}; background: {ACCENT_TINT}; }}
    .fv {{ font-size: 32px; font-weight: 800; letter-spacing: -0.02em; }}
    .fl {{ font-size: 14px; color: {MUTED}; }}
    h2 {{ font-family: {MONO}; font-size: 12px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: {SOFT}; margin: 56px 0 16px; }}
    .grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }}
    .card {{ position: relative; display: grid; grid-template-columns: auto 1fr; column-gap: 12px; row-gap: 4px; padding: 20px;
      background: #fff; border: 1px solid {RULE}; border-radius: 16px; color: inherit; text-decoration: none; transition: border-color 200ms cubic-bezier(.22,1,.36,1); }}
    .card:hover, .card:focus-visible {{ border-color: {ACCENT}; outline: none; }}
    .num {{ font-family: {MONO}; font-size: 13px; color: {ACCENT}; grid-row: span 2; padding-top: 3px; }}
    .ct {{ font-size: 18px; font-weight: 700; }}
    .cd {{ font-size: 14px; color: {MUTED}; }}
    .thumb {{ grid-column: 1 / -1; margin-top: 14px; display: block; border: 1px solid {RULE}; border-radius: 10px; overflow: hidden; background: {PAPER}; }}
    .thumb svg {{ display: block; width: 100%; height: auto; }}
    footer {{ margin-top: 48px; font-size: 14px; color: {SOFT}; }}
    @media (max-width: 760px) {{ .facts {{ grid-template-columns: 1fr 1fr; }} .grid {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>
  <main class="wrap">
    <p class="eyebrow">Leadership briefing</p>
    <h1>SIMADRepair — SIMAD University IT Service Desk</h1>
    <p class="sub">Computer Maintenance Program platform · Faculty of Computing</p>
    <section class="facts" aria-label="Headline facts">
{fact_html}
    </section>
    <h2>The platform in eight diagrams</h2>
    <section class="grid">
{cards}
    </section>
    <footer>Open any diagram for a full-screen, slide-ready view. Built by the Faculty of Computing engineering team.</footer>
  </main>
</body>
</html>
'''
pathlib.Path("/home/user/simadrepair/docs/diagrams/index.html").write_text(html)
print("wrote index.html")
