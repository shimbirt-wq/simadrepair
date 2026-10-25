import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from lib import *

OUT = pathlib.Path(__file__).resolve().parent.parent
OUT.mkdir(parents=True, exist_ok=True)


def write(name, html):
    (OUT / name).write_text(html)
    print("wrote", name)


# 1 — Platform overview ------------------------------------------------------
def d1():
    b = []
    # arrows first (content shifted up 96px vs first draft)
    b.append(path("M320,248 H520", "accent"))
    b.append(path("M960,100 H868 Q860,100 860,108 V212 Q860,220 852,220 H760"))
    b.append(path("M960,248 H760"))
    b.append(path("M960,396 H888 Q880,396 880,388 V284 Q880,276 872,276 H760"))
    b.append(path("M380,432 V368 Q380,360 388,360 H572 Q580,360 580,352 V304"))
    b.append(path("M640,432 V304", start=True))
    b.append(path("M700,304 V352 Q700,360 708,360 H812 Q820,360 820,368 V432", "link"))
    b.append(label(420, 232, "REQUEST·TRACK", ACCENT))
    b.append(label(914, 84, "CHECK-IN"))
    b.append(label(912, 232, "REPAIRS"))
    b.append(label(924, 380, "EVENTS"))
    b.append(label(476, 344, "DATES · VENUE"))
    b.append(label(684, 404, "RECORDS"))
    b.append(label(760, 344, "MESSAGES", LINK))
    b.append(node(80, 212, 240, 72, "Students & staff", "register · track · collect", "input", "PEOPLE"))
    b.append(node(520, 192, 240, 112, "SIMADRepair", ["one tracked repair desk", "web · phone-first"], "focal", "PLATFORM"))
    b.append(node(960, 64, 240, 72, "Lead technician desk", "check-in · assign · pickup", "input", "STAFF"))
    b.append(node(960, 212, 240, 72, "Volunteer technicians", "claim · repair · test", "input", "STAFF"))
    b.append(node(960, 360, 240, 72, "Admin", "events · staff · reports", "input", "STAFF"))
    b.append(node(280, 432, 200, 72, "Maintenance Week", "dates · venue · hours", "store", "SETTINGS"))
    b.append(node(540, 432, 200, 72, "Secure records", "encrypted · private", "store", "DATA"))
    b.append(node(780, 432, 200, 72, "WhatsApp", "to every student", "external", "MESSAGES"))
    b.append(legend(580, [("input", "People who use it"), ("focal", "The platform"), ("store", "Data and settings"),
                          ("external", "Outside service"), ("arrow-accent", "Main path")]))
    write("01-platform-overview.html", page(
        "platform-overview", "01 · Platform overview", "One desk for every repair",
        "Students register online; three staff roles run the week on the same platform; every step is saved and the student is kept informed on WhatsApp.",
        "\n".join(b),
        "Architecture of SIMADRepair: students and staff, the lead desk, volunteer technicians and the admin all work through one platform that stores secure records, reads the Maintenance Week settings and sends WhatsApp updates.",
        vb=(1280, 616)))


# 3 — Ticket lifecycle -------------------------------------------------------
def d3():
    b = []
    W, H = 192, 72
    X = [80, 384, 688, 992]
    Y = 200
    cy = Y + H // 2  # 236
    # start dot
    b.append(f'<circle cx="48" cy="{cy}" r="6" fill="{INK}"/>')
    b.append(path(f"M54,{cy} H80"))
    # main row
    b.append(path(f"M272,{cy} H384"))
    b.append(path(f"M576,{cy} H688"))
    b.append(path(f"M880,{cy} H992"))
    b.append(label(328, cy - 16, "CHECKED IN"))
    b.append(label(632, cy - 16, "ASSIGNED"))
    b.append(label(936, cy - 16, "MARKED READY"))
    # cancel
    b.append(path(f"M176,{Y} V112", dashed=True))
    b.append(label_right_v(176, 112, Y, "NOT DROPPED"))
    # blocked loop
    b.append(path("M752,272 V420", dashed=True))
    b.append(path("M816,420 V272", dashed=True))
    b.append(label_left_v(752, 272, 420, "BLOCKED"))
    b.append(label_right_v(816, 272, 420, "RESUMED"))
    # cannot repair
    b.append(path("M688,256 H640 Q632,256 632,264 V448 Q632,456 624,456 H576"))
    b.append(label_left_v(632, 272, 420, "LEAD CONFIRMS"))
    # ready -> collected
    b.append(path("M1088,272 V420", "accent"))
    b.append(label_left_v(1088, 272, 420, "ID CARD CHECK", ACCENT))
    # cannot -> collected
    b.append(path("M480,492 V552 Q480,560 488,560 H1080 Q1088,560 1088,552 V492"))
    b.append(label(784, 544, "RETURNED"))
    # end rings
    for ex, ey in ((1216, 456), (304, 76)):
        b.append(f'<circle cx="{ex}" cy="{ey}" r="8" fill="none" stroke="{INK}" stroke-width="1.2"/><circle cx="{ex}" cy="{ey}" r="5" fill="{INK}"/>')
    b.append(f'<line x1="1184" y1="456" x2="1208" y2="456" stroke="{MUTED}" stroke-width="1.2"/>')
    b.append(f'<line x1="272" y1="76" x2="296" y2="76" stroke="{MUTED}" stroke-width="1.2"/>')
    # nodes
    b.append(node(80, 40, W, H, "Cancelled", "by the student", "optional", rx=8))
    b.append(node(X[0], Y, W, H, "Submitted", "code sent", rx=8))
    b.append(node(X[1], Y, W, H, "Received", "tag #147 on sticker", rx=8))
    b.append(node(X[2], Y, W, H, "In repair", "technician working", rx=8))
    b.append(node(X[3], Y, W, H, "Ready for pickup", "WhatsApp sent", rx=8))
    b.append(node(688, 420, W, H, "Waiting", ["for parts or student"], "optional", rx=8))
    b.append(node(384, 420, W, H, "Cannot be repaired", "proposed, confirmed", rx=8))
    b.append(node(992, 420, W, H, "Collected", "collector recorded", "focal", rx=8))
    b.append(legend(684, [("backend", "Repair status"), ("optional", "Waiting or cancelled"), ("focal", "Happy ending"),
                          ("arrow-dashed", "Side path"), ("dot", "Start")], step=210))
    write("03-ticket-lifecycle.html", page(
        "ticket-lifecycle", "03 · One repair, start to finish", "Every repair ends with a clear outcome",
        "One status system replaces two that were kept in sync by hand. Waits, cancellations and “cannot be repaired” are now visible to the student instead of hiding behind “in repair”.",
        "\n".join(b),
        "State machine of one repair ticket: submitted, received, in repair, ready for pickup and collected, with waiting, cancelled and cannot-be-repaired side paths."))



def diamond(cx, cy, hw, hh, name):
    pts = f"{cx},{cy-hh} {cx+hw},{cy} {cx},{cy+hh} {cx-hw},{cy}"
    return (f'<polygon points="{pts}" fill="{PAPER}"/>'
            f'<polygon points="{pts}" fill="#FFFFFF" stroke="{INK}" stroke-width="1"/>'
            + t(cx, cy + 6, name, size=NAME, weight=600))


def callout(x, y, lines, anchor="start"):
    return "\n".join(t(x, y + i * 20, l, size=14, weight=400, fill=MUTED, anchor=anchor, italic=True) for i, l in enumerate(lines))


# 2 — End-to-end swimlane ----------------------------------------------------
def d2():
    b = []
    lanes = [("Student", 24), ("Lead desk", 172), ("Technician", 320), ("Admin", 468)]
    LH = 148
    for i, (name, top) in enumerate(lanes):
        if i % 2 == 0:
            b.append(f'<rect x="40" y="{top}" width="1200" height="{LH}" fill="{PAPER2}"/>')
        b.append(f'<line x1="40" y1="{top}" x2="1240" y2="{top}" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(56, top + LH / 2 + 5, name, size=14, weight=600, fill=INK, anchor="start"))
    b.append(f'<line x1="40" y1="616" x2="1240" y2="616" stroke="{RULE}" stroke-width="1"/>')
    b.append(f'<line x1="160" y1="24" x2="160" y2="616" stroke="{RULE}" stroke-width="1"/>')
    X = [176, 328, 480, 632, 784, 936, 1088]
    lane_of = [0, 1, 2, 2, 1, 0, 3]
        # arrows
    b.append(path("M296,90 H304 Q312,90 312,98 V230 Q312,238 320,238 H328"))
    b.append(path("M448,238 H456 Q464,238 464,246 V378 Q464,386 472,386 H480"))
    b.append(path("M600,386 H632"))
    b.append(path("M752,386 H760 Q768,386 768,378 V246 Q768,238 776,238 H784", "accent"))
    b.append(path("M904,238 H912 Q920,238 920,230 V98 Q920,90 928,90 H936"))
    b.append(path("M1056,90 H1064 Q1072,90 1072,98 V526 Q1072,534 1080,534 H1088", dashed=True))
    steps = [
        (["Register", "online"], "code sent", "backend"),
        (["Drop-off &", "check-in"], "tag #147", "backend"),
        (["Claim &", "repair"], "max 3 each", "backend"),
        (["Ready +", "WhatsApp"], "tests passed", "backend"),
        (["Hand over", "by ID card"], "who collected", "focal"),
        (["Rate the", "service"], "1–5 stars", "backend"),
        (["Event", "report"], "PDF · CSV", "backend"),
    ]
    for i, (nm, sub, kind) in enumerate(steps):
        top = lanes[lane_of[i]][1] + 20
        b.append(node(X[i], top, 120, 92, nm, sub, kind, tag=str(i + 1)))
    # pause tag in technician lane
    b.append(f'<rect x="460" y="438" width="312" height="22" rx="2" fill="none" stroke="{MUTED}" stroke-opacity="0.6" stroke-dasharray="3,3"/>')
    b.append(t(616, 453, "may pause: waiting for parts or the student", size=11, weight=400, fill=SOFT, family=MONO))
    b.append(legend(656, [("backend", "Step"), ("focal", "Verified handover"), ("arrow", "Next step"),
                          ("arrow-dashed", "Rolls up into the report")], step=230))
    write("02-end-to-end-swimlane.html", page(
        "end-to-end-swimlane", "02 · The week, end to end", "Who does what, from registration to report",
        "Every handoff between the student, the desk, the technician and the admin happens in the platform, so nothing is lost between people.",
        "\n".join(b),
        "Swimlane of the Maintenance Week flow: the student registers, the lead desk checks the device in, a technician claims and repairs it, the desk hands it over against the university ID card, the student rates the service and the admin gets the event report.",
        vb=(1280, 696)))


# 4 — Student journey ---------------------------------------------------------
def d4():
    b = []
    cols = [128 + i * 188 for i in range(6)]
    W = 172
    stages = ["Register", "Get a code", "Drop off", "Track", "Collect", "Rate"]
    level = {"HIGH": 96, "MED-HIGH": 136, "NEUTRAL": 176, "MED-LOW": 216, "LOW": 256}
    vals = ["MED-HIGH", "HIGH", "MED-LOW", "MED-HIGH", "HIGH", "HIGH"]
    trough = 2
    for i, sname in enumerate(stages):
        cx = cols[i] + W / 2
        b.append(t(cx, 40, f"STAGE {i+1}", size=TAG, weight=500, fill=SOFT, family=MONO, spacing="0.14em"))
        b.append(t(cx, 64, sname, size=NAME, weight=700))
    for lv in ("HIGH", "NEUTRAL", "LOW"):
        y = level[lv]
        b.append(f'<line x1="128" y1="{y}" x2="1240" y2="{y}" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(112, y + 4, lv, size=11, weight=500, fill=SOFT, family=MONO, anchor="end", spacing="0.08em"))
    pts = [(cols[i] + W / 2, level[v]) for i, v in enumerate(vals)]
    for i in range(1, len(pts)):
        col = ACCENT if i == trough else MUTED
        b.append(f'<line x1="{pts[i-1][0]}" y1="{pts[i-1][1]}" x2="{pts[i][0]}" y2="{pts[i][1]}" stroke="{col}" stroke-width="1.5"/>')
    for i, (x, y) in enumerate(pts):
        b.append(f'<circle cx="{x}" cy="{y}" r="5" fill="{ACCENT if i == trough else MUTED}"/>')
    rows = [("ACTIONS", 296), ("WHAT'S NEW", 404), ("WHERE", 528)]
    for nm, y in rows:
        b.append(f'<line x1="40" y1="{y-16}" x2="1240" y2="{y-16}" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(112, y + 8, nm, size=11, weight=500, fill=SOFT, family=MONO, anchor="end", spacing="0.08em"))
    actions = [["4 short steps", "on the phone"], ["Code on screen", "+ WhatsApp"], ["Hand in at the", "event desk"],
               ["Status and", "technician"], ["Show university", "ID card"], ["Tap 1–5 stars"]]
    news = [["specs + diagnosis", "up to 3 photos"], ["can't be guessed", "lost? find by ID"], ["tag #147 sticker", "condition logged"],
            ["clear outcomes", "waiting · ready"], ["verified pickup", "collector logged"], ["feeds the event", "report"]]
    where = ["phone", "phone · WhatsApp", "event desk", "phone", "event desk", "phone"]
    for i in range(6):
        cx = cols[i] + W / 2
        for j, l in enumerate(actions[i]):
            b.append(t(cx, 300 + j * 20, l, size=NAME, weight=600))
        for j, l in enumerate(news[i]):
            b.append(t(cx, 412 + j * 18, l, size=SUB, weight=400, fill=ACCENT if False else MUTED, family=MONO))
        b.append(t(cx, 536, where[i], size=SUB, weight=400, fill=SOFT, family=MONO))
    # pain marker under drop-off actions
    px = cols[trough] + W / 2
    b.append(f'<rect x="{px-68}" y="344" width="136" height="20" rx="2" fill="{ACCENT_TINT}" stroke="{ACCENT}" stroke-opacity="0.5" stroke-dasharray="3,3"/>')
    b.append(t(px, 358, "PEAK-HOUR QUEUE", size=11, weight=500, fill=ACCENT, family=MONO, spacing="0.06em"))
    b.append(callout(cols[trough] - 4, 470, ["Eased by desk registration", "and a 30-second check-in."]))
    b.append(legend(616, [("dot", "How it feels"), ("dot-accent", "Lowest point"), ("pain", "Friction we designed for")], step=230))
    write("04-student-journey.html", page(
        "student-journey", "04 · Student journey", "What a student experiences",
        "From registering on a phone to collecting with their ID card: six stages, each with a concrete improvement over today.",
        "\n".join(b),
        "User journey of a student across six stages - register, get a code, drop off, track, collect and rate - with how each stage feels and what is new at each one; the lowest point is the drop-off queue.",
        vb=(1280, 656)))


# 5 — Lead desk ---------------------------------------------------------------
def d5():
    b = []
    b.append(path("M240,160 H260 Q268,160 268,168 V219 Q268,227 276,227 H296"))
    b.append(path("M240,320 H272 Q280,320 280,312 V261 Q280,253 288,253 H296"))
    b.append(path("M496,240 H552"))
    b.append(path("M752,240 H808"))
    b.append(path("M908,280 V400", "accent"))
    b.append(label_right_v(908, 280, 400, "READY", ACCENT))
    b.append(path("M1008,440 H1064"))
    b.append(f'<line x1="396" y1="280" x2="396" y2="360" stroke="{MUTED}" stroke-width="1" stroke-dasharray="4,3"/>')
    # detail card
    b.append(f'<rect x="296" y="360" width="456" height="196" rx="8" fill="{PAPER2}" stroke="{RULE}" stroke-width="1"/>')
    b.append(t(316, 388, "AT CHECK-IN, IN ABOUT 30 SECONDS", size=TAG + 3, weight=500, fill=ACCENT, family=MONO, anchor="start", spacing="0.1em"))
    items = ["University ID card checked", "Condition and accessories", "Photos of existing damage",
             "Password stored encrypted", "Tag number on a sticker", "Shelf zone and priority"]
    for k, it in enumerate(items):
        col, row = k % 2, k // 2
        x = 316 + col * 220
        y = 424 + row * 40
        b.append(f'<circle cx="{x+6}" cy="{y-5}" r="4" fill="{ACCENT}"/>')
        b.append(t(x + 18, y, it, size=14, weight=500, fill=INK, anchor="start"))
    b.append(node(40, 120, 200, 80, "Online request", "registered at home", "input", "IN"))
    b.append(node(40, 280, 200, 80, "Walk-in", "registered at desk", "input", "IN"))
    b.append(node(296, 200, 200, 80, "Check in", "tag #147 · zone B", "focal", "STEP 1"))
    b.append(node(552, 200, 200, 80, "Assign", "workload · skills", "backend", "STEP 2"))
    b.append(node(808, 200, 200, 80, "Live board", "stuck alerts", "backend", "STEP 3"))
    b.append(node(808, 400, 200, 80, "Pickup by ID card", "collector recorded", "backend", "STEP 4"))
    b.append(node(1064, 400, 176, 80, "End of week", "bulk close · remind", "optional", "LAST DAY"))
    b.append(callout(1032, 232, ["Turns red when a device", "waits over 1 hour", "unassigned."]))
    b.append(legend(616, [("input", "Ways in"), ("focal", "Most important step"), ("backend", "Desk step"),
                          ("optional", "Once per event"), ("arrow-accent", "Ready for pickup")], step=210))
    write("05-lead-desk.html", page(
        "lead-desk", "05 · Lead technician desk", "Running the desk for 500 devices",
        "Every device is identified at check-in, routed to the right technician, watched on a live board and released only against the owner’s university ID card.",
        "\n".join(b),
        "Flow of the lead technician desk: online and walk-in requests are checked in with a tag number, assigned by workload and skills, watched on a live board with stuck alerts, handed over against the university ID card, and closed in bulk at the end of the week.",
        vb=(1280, 576), dy=-88))


# 6 — Technician flow -----------------------------------------------------------
def d6():
    b = []
    cy = 200
    b.append(path(f"M184,{cy} H216"))
    b.append(path(f"M376,{cy} H408"))
    b.append(path(f"M552,{cy} H584"))
    b.append(path(f"M696,{cy} H728"))
    b.append(label(712, cy - 16, "NO"))
    b.append(path(f"M840,{cy} H872"))
    b.append(label(856, cy - 16, "YES"))
    b.append(path(f"M1048,{cy} H1080", "accent"))
    b.append(path("M640,248 V360", dashed=True))
    b.append(label_right_v(640, 248, 360, "YES"))
    b.append(path("M560,400 H488 Q480,400 480,392 V236", dashed=True))
    b.append(label_left_v(480, 236, 400, "RESUMED"))
    b.append(path("M784,248 V360"))
    b.append(label_right_v(784, 248, 360, "NO"))
    b.append(node(40, 168, 144, 64, "Claim a repair", "max 3 at once", rx=32))
    b.append(node(216, 164, 160, 72, "Read the intake", "specs · photos"))
    b.append(node(408, 164, 144, 72, "Start repair", "one tap"))
    b.append(diamond(640, cy, 56, 48, "Blocked?"))
    b.append(diamond(784, cy, 56, 48, "Fixable?"))
    b.append(node(872, 156, 176, 88, "Record the fix", ["fault · actions", "test checklist"], "focal"))
    b.append(node(1080, 168, 160, 64, "Ready", "WhatsApp sent", rx=32))
    b.append(node(560, 360, 160, 80, "Waiting", ["for parts or", "the student"], "optional"))
    b.append(node(744, 360, 176, 80, "Can't be fixed", "lead confirms"))
    b.append(callout(960, 300, ["Every fix is recorded, so the", "report shows what broke", "and what worked."]))
    b.append(legend(536, [("backend", "Step"), ("focal", "Knowledge captured"), ("optional", "Paused"),
                          ("arrow-dashed", "Wait and resume"), ("arrow-accent", "Done")], step=210))
    write("06-technician-flow.html", page(
        "technician-flow", "06 · Volunteer technician", "From claim to ready, on a phone",
        "Technicians pick work themselves, see everything the student and the desk recorded, and cannot mark a device ready without recording the fix and passing the tests.",
        "\n".join(b),
        "Flowchart for a volunteer technician: claim a repair, read the intake, start, branch to waiting or cannot-be-fixed when needed, record the fault, actions and tests, then mark ready and send WhatsApp.",
        vb=(1280, 456), dy=-120))


# 7 — Admin event cycle --------------------------------------------------------
def d7():
    b = []
    base = 288
    b.append(f'<rect x="520" y="120" width="300" height="336" rx="8" fill="{PAPER2}" stroke="{RULE}" stroke-width="1"/>')
    b.append(t(670, 144, "MAINTENANCE WEEK", size=11, weight=500, fill=ACCENT, family=MONO, spacing="0.14em"))
    b.append(f'<line x1="64" y1="{base}" x2="1000" y2="{base}" stroke="{INK}" stroke-width="1"/>')
    b.append(f'<line x1="1028" y1="{base}" x2="1216" y2="{base}" stroke="{INK}" stroke-width="1"/>')
    b.append(f'<line x1="1004" y1="{base+8}" x2="1012" y2="{base-8}" stroke="{INK}" stroke-width="1"/>')
    b.append(f'<line x1="1016" y1="{base+8}" x2="1024" y2="{base-8}" stroke="{INK}" stroke-width="1"/>')
    for x, lab in ((290, "WEEKS BEFORE"), (670, "MON – FRI"), (910, "WEEK AFTER"), (1120, "12 MONTHS LATER")):
        b.append(t(x, 488, lab, size=11, weight=500, fill=SOFT, family=MONO, spacing="0.1em"))
    above = [(140, "Create the event", "dates · venue · hours", False),
             (380, "Registration opens", "form goes live", True),
             (670, "Live overview", "today · stuck · load", False),
             (910, "Event report", "PDF · CSV · ratings", True)]
    below = [(260, "Add volunteers", "paste a list · skills", False),
             (800, "Event ends", "bulk close · accounts off", False),
             (1120, "Personal data erased", "stats are kept", False)]
    for x, nm, sub, major in above:
        b.append(f'<line x1="{x}" y1="{base}" x2="{x}" y2="236" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(x, 200, nm, size=NAME, weight=700 if major else 600))
        b.append(t(x, 220, sub, size=SUB, weight=400, fill=SOFT, family=MONO))
    for x, nm, sub, major in below:
        b.append(f'<line x1="{x}" y1="{base}" x2="{x}" y2="340" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(x, 368, nm, size=NAME, weight=600))
        b.append(t(x, 388, sub, size=SUB, weight=400, fill=SOFT, family=MONO))
    for x, *_r in above + below:
        major = _r[2]
        if major:
            b.append(f'<circle cx="{x}" cy="{base}" r="6" fill="{ACCENT}"/>')
        else:
            b.append(f'<circle cx="{x}" cy="{base}" r="4" fill="{INK}"/>')
    b.append(legend(560, [("dot", "Admin action"), ("dot-accent", "Milestone"), ("band", "The event week")], step=220))
    write("07-admin-event-cycle.html", page(
        "admin-event-cycle", "07 · Admin", "One event, from setup to report",
        "The admin sets the week up once; registration, volunteer accounts, the report and data clean-up all follow the event’s dates automatically.",
        "\n".join(b),
        "Timeline of one Maintenance Week for the admin: create the event and add volunteers before, open registration, watch the live overview during the week, close out on the last day, publish the report after, and erase personal data twelve months later.",
        vb=(1280, 512), dy=-88))


# 8 — Before / after -----------------------------------------------------------
def d8():
    b = []
    b.append(t(300, 40, "TODAY", size=11, weight=500, fill=SOFT, family=MONO, spacing="0.16em"))
    b.append(t(940, 40, "WITH SIMADREPAIR", size=11, weight=500, fill=ACCENT, family=MONO, spacing="0.16em"))
    rows = [
        ("TRACKING", "Codes count up: 000123", "anyone can read every ticket", "Random tracking codes", "nothing to guess", "backend"),
        ("PICKUP", "Pickup is not verified", "a name is typed in, no ID", "University ID card at pickup", "collector recorded", "focal"),
        ("INTAKE", "One free-text box", "technician starts blind", "Specs, diagnosis and photos", "technician knows the device", "backend"),
        ("UPDATES", "Students keep checking", "no messages are sent", "WhatsApp at key moments", "Somali and English", "backend"),
        ("RESULTS", "No event report", "no figures from real data", "Event report, PDF and CSV", "fix rate · top faults · rating", "backend"),
    ]
    for i, (tag, l1, l2, r1, r2, kind) in enumerate(rows):
        y = 64 + i * 96
        b.append(path(f"M560,{y+36} H680", "accent" if kind == "focal" else "muted"))
        b.append(node(40, y, 520, 72, l1, l2, "optional", tag))
        b.append(node(680, y, 520, 72, r1, r2, kind, tag))
    b.append(legend(600, [("optional", "Today"), ("backend", "New platform"), ("focal", "Biggest risk removed")], step=230))
    write("08-before-after.html", page(
        "before-after", "08 · What changes", "Five problems the new platform removes",
        "Each row is a weakness of today’s system and the change that removes it. The biggest real-world risk, unverified pickup, is highlighted.",
        "\n".join(b),
        "Before-and-after comparison of five areas - tracking, pickup, intake, updates and results - showing today's weakness and the SIMADRepair change for each.",
        vb=(1280, 640)))


if __name__ == "__main__":
    which = sys.argv[1:] or ["1", "2", "3", "4", "5", "6", "7", "8"]
    for w in which:
        globals()["d" + w]()
