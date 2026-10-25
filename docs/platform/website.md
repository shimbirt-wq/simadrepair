# Public website

Status: **agreed**. Covers the public pages around the requester flow (home, about, login, errors). The request form, tracking, find-my-request and closed page are specified in `requester.md` and tickets 03–06, 18.

---

## 1. How it is today

- **Home** (`src/app/page.tsx`, `src/components/landing/*`): dark "editorial" page (`#050D1B` background, blue accents). Sections: navbar (Home / Services / About Us anchors), hero with a mock status-card animation, stats strip, how it works (4 steps), features (4 cards), engineering team (4 developers with photos), CTA banner, footer.
- **Request** and **Track** pages each have their own copy of the dark navbar with inline styles.
- **Staff login** at `/auth/login`.
- An earlier light version exists in `docs/audits/landing-service-desk-ux/01-home.png`; an audit in the same folder lists the same credibility issues found below.

## 2. Problems

| # | Problem |
| --- | --- |
| W1 | **Made-up numbers.** "500+ repairs", "15,000+", "98.6% satisfaction", "Same day", "4 engineers" are hard-coded, not from data. The event actually has 8–15 volunteer technicians. Damages trust the moment someone notices. |
| W2 | **Wrong promises.** "No walk-in required", "Online — submit from anywhere", "WhatsApp updates", "Enterprise-grade security" don't match how the event works (devices are dropped off at the venue; messages are sent manually). |
| W3 | **Doesn't answer the real questions**: when is the event, where, what hours, what to bring, what's free, what happens if I lose my code. |
| W4 | **Dead links.** Footer "Help Center", "IT Policies", "Guidelines", "Announcements", "Status Page", and nav "Services"/"About Us" point to sections that don't exist. |
| W5 | **Off-brand.** Dark navy + blue conflicts with the design system (light surfaces, emerald accent, Hanken Grotesk). Navbar duplicated with inline styles on each public page. |
| W6 | **Developer team on the home page.** Valuable credit, but not what a student coming for a repair needs first. |
| W7 | Decorative animation and heavy hero visuals slow the page on campus mobile data. |

## 3. Proposal — one event-centred page

**Goal:** a student lands, understands in 5 seconds *when, where, and what to do*, and taps one button.

### 3.1 Home structure
```
┌ Top bar ─ logo · Track · Staff sign-in (quiet) ··········· [Request repair] ┐
│                                                                             │
│ HERO                                                                        │
│  Computer Maintenance Week 2026                     ● Registration open     │
│  10–14 Nov · Main Hall, Block B · 8:00–16:00                                │
│  Free repair and maintenance for SIMAD students and staff.                  │
│  [Request repair]   Track: [ SIM-26-______ ] →                              │
│                                                                             │
│ HOW IT WORKS  ① Register online  ② Drop off at the venue                    │
│               ③ We repair — status + technician on WhatsApp                 │
│               ④ Collect with your university ID card                        │
│                                                                             │
│ BEFORE YOU COME  ☐ Back up your files  ☐ Bring the charger                  │
│                  ☐ Bring your university ID card  ☐ Know your password      │
│                                                                             │
│ WHAT WE FIX   Slow / virus · Won't turn on · Screen · Keyboard · Battery ·  │
│               Windows & licensed software · Wi-Fi  (+ what we don't do)     │
│                                                                             │
│ THIS WEEK     312 registered · 241 repaired · 4.7 ★   ← real data only      │
│                                                                             │
│ FAQ           Is it free? · How long? · Lost my code · Someone else collects│
│               · My data · Uncollected devices                               │
│                                                                             │
└ Footer ─ venue · desk WhatsApp · About · Staff sign-in · © SIMAD University ┘
```

- **Hero state follows the Event** (ticket 03): *Registration open* · *Opens on 10 Nov* · *Event running — registration closed* · *No upcoming event* (then: track / find my request only).
- **Track input inside the hero** — the second most common reason to visit, one step instead of two pages.
- **Live numbers** only from the event report (ticket 20), hidden when there is no data. No hard-coded stats anywhere.
- **FAQ answers come from the decisions** (free, ID-card pickup, 30-day hold, data backup, licensed software only).

### 3.2 Other public pages
| Page | Change |
| --- | --- |
| Request, Track, Find my request, Closed | Share one public layout (top bar + footer) instead of copied inline navbars. |
| About (`/about`) | The team section moves here, with the project story and SIMAD IT contact. |
| Staff sign-in | Restyled: minimal card, "Staff only — students use Request repair / Track". |
| 404 / error | Friendly one-line message + the two main actions. |

### 3.3 Assumed decisions (say if any is wrong)
| # | Decision |
| --- | --- |
| WA1 | **Light theme only** for v1 (design system is light); the theme toggle is removed. Dark mode can come later from the same tokens. |
| WA2 | **No decorative animation**; motion only per design system (fades, 8 px rises). |
| WA3 | **English website** (WhatsApp messages are bilingual — D-decisions). |
| WA4 | **All public text that depends on the event** (dates, venue, hours, number, hold days) reads from Event settings. |
| WA5 | **Remove every unbacked claim and dead link** (W1, W2, W4). |
| WA6 | **Performance budget:** home page loads under ~200 KB of JS+images on mobile; images optimised via Next Image. |
| WA7 | **SEO/sharing:** page titles, description, Open Graph image with the event name and dates. |
| WA8 | **Accessibility:** AA contrast, keyboard navigation, visible focus, alt text on every image. |

### 3.4 Proposed tickets (after 01 and 03)
| # | Ticket | Blocked by |
| --- | --- | --- |
| 23 | Public layout + event-centred home page (hero states, track input, how it works, before you come, what we fix, FAQ, footer); remove fake stats, dead links, theme toggle | 01, 03 |
| 24 | About page with the team and project story | 01, 23 |
| 25 | Live event numbers on the home page | 20, 23 |
| 26 | Staff sign-in, 404/error pages, metadata/Open Graph, accessibility pass on public pages | 01, 23 |

---

## 4. Decisions log

| # | Decision | Round |
| --- | --- | --- |
| WD1 | Assumed decisions WA1–WA8 accepted. | 1 |
| WD2 | **Product name: SIMADRepair** everywhere (tagline "SIMAD University IT Service Desk"). "FarsamoTech Repair Hub" retired; XeelTech Solutions credited on the About page. | 1 |
| WD3 | **Real photography, not illustrations:** use free-licence stock photos of computers and repair work (e.g. Unsplash/Pexels licence — commercial use, no attribution required), self-hosted in the repo and optimised. Only devices, hands, workbenches and generic campus/student scenes — never stock faces presented as SIMAD staff or students. Replace with real Maintenance Week photos when available. | 1 |
| WD4 | **About page:** the 4 developers with photos and titles, plus a count of volunteer technicians ("delivered by N student volunteers", from Event data), not their names. | 1 |
