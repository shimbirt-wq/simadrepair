# Design system — SIMADRepair

Adapted from the SIMAD learning-platform design system. Same tokens, fonts, spacing and feel; the meanings are re-mapped to a repair service desk. Learning-only parts (skill icons, coursebook serif, note-bg side notes, AI surfaces, generated covers) are **not used**. Read with `ui-principles.md`.

Tokens become CSS variables in the global stylesheet and are exposed to Tailwind; components use only semantic tokens (`--accent`, `--text-secondary`…), never raw hex.

---

## 1. Colour

### 1.1 Neutral scale (`n`) — cool, with a whisper of green
| Token | Hex | | Token | Hex |
| --- | --- | --- | --- | --- |
| n-0 | `#FFFFFF` | | n-400 | `#99A19C` |
| n-25 | `#FBFCFB` | | n-500 | `#6E756F` |
| n-50 | `#F5F7F5` | | n-600 | `#515852` |
| n-100 | `#ECEFED` | | n-700 | `#3A403B` |
| n-150 | `#E4E8E5` | | n-800 | `#242926` |
| n-200 | `#D7DCD8` | | n-900 | `#131815` |
| n-300 | `#BEC5C0` | | n-950 | `#0A0D0B` |

### 1.2 Green scale (emerald)
| Token | Hex | | Token | Hex |
| --- | --- | --- | --- | --- |
| green-50 | `#EFF8F2` | | green-400 | `#45B27B` |
| green-100 | `#DBF0E3` | | green-500 | `#0F7A45` |
| green-200 | `#B4E1C7` | | green-600 | `#0C6539` |
| green-300 | `#82CCA4` | | green-700* | `#0A5130` |
| | | | green-900* | `#0B2A1C` |

\* not in the source screenshots — derived, to be confirmed.

### 1.3 Semantic tokens
| Token | Value | Use |
| --- | --- | --- |
| `bg-app` | n-25 | page background |
| `bg-muted` | n-50 | sunken areas, table headers, board columns |
| `surface` | n-0 | cards, inputs, dialogs |
| `bg-inverse` | green-900 | staff sidebar; public hero band |
| `border-default` | n-150 | hairline borders on cards and inputs |
| `border-strong` | n-200 | dividers needing more weight, input hover |
| `text-primary` | n-900 | body, headings (15.5:1) |
| `text-secondary` | n-600 | labels, secondary info (6.3:1) |
| `text-muted` | **`#646B65`** | hints, timestamps. *Darkened from n-500 (4.0:1 on bg-muted, fails AA) to pass on every surface (≥ 4.7:1).* |
| `text-disabled` | n-400 | disabled only |
| `text-on-accent` | n-0 | text on accent buttons (5.3:1) |
| `text-accent` | green-600 | links, active nav (6.1:1) |
| `accent` | green-500 `#0F7A45` | **the next action**, current position, progress |
| `accent-hover` | green-600 | |
| `accent-soft` | accent @ 10% | selected rows, active tab background |
| `green-bright` | green-400 | detail only on dark (dots, progress bars). **Never text.** |
| `success` / `success-soft` / `success-text` | `#15875A` / 10% / green-600 | Ready for pickup, completed checks |
| `warning` / `warning-soft` / `warning-text` | `#A8650A` / `#C77D14` 12% / `#8A520A` | Blocked, Urgent, Stuck |
| `error` / `error-soft` / `error-text` | `#C23A3A` / `#D14343` 10% / `#A42F2F` | **system errors and destructive actions only** |
| `info` / `info-soft` / `info-text` | `#2D6FB8` / `#2D74C4` 10% / `#245C99` | Received, neutral notices |

Badge text on a soft background always uses the `*-text` token (all ≥ 5.6:1).

### 1.4 Repair meaning → colour (one rule, used everywhere)
| Meaning | Tone | Icon (Lucide) |
| --- | --- | --- |
| Submitted (waiting drop-off) | neutral | `inbox` |
| Received | info | `package-check` |
| In repair | accent | `wrench` |
| Waiting for parts | warning | `package-search` |
| Action needed | warning | `message-circle-warning` |
| Ready for pickup | success | `circle-check` |
| Collected | neutral | `hand-helping` |
| Cannot be repaired | neutral (dark) | `circle-slash` |
| Cancelled | neutral (muted, strikethrough code) | `x` |
| Urgent priority | warning | `flame` |
| Stuck | warning border on the card | `clock-alert` |

Red is **not** used for any repair status: "Cannot be repaired" is an outcome, not an error.

---

## 2. Type

| Family | Use |
| --- | --- |
| **Hanken Grotesk** | all interface text |
| **IBM Plex Mono** (tabular figures) | tag numbers (`#147`), tracking codes, university IDs, counts, timers, eyebrows |

Source Serif 4 is not used (no long reading passages here).

| Style | Size / weight | Use |
| --- | --- | --- |
| display | 44 / 800 | public hero only |
| h1 | 30 / 700 | page title |
| h2 | 22 / 700 | section title |
| h3 | 17 / 600 | card title |
| body | 15 / 400 | default |
| small | 13.5 / 400 | secondary info |
| caption | 12.5 / 500 | hints, timestamps |
| eyebrow | Plex Mono 12 / 500, uppercase, +0.08em | section labels |
| tag | Plex Mono 28 / 600 | tag number on board cards and technician screen |

---

## 3. Layout, spacing, radius

- **4 px grid.** Spacing tokens: `space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48 · `16` 64.
- **Widths:** public pages max 1200; forms ≤ 680 (one column); staff sidebar 248; topbar 60; lead board and admin tables up to 1440.
- **Radius:** `r-xs` 6 · `r-sm` 8 (buttons) · `r-md` 12 (inputs, choice cards) · `r-lg` 16 (cards) · `r-xl` 22 · `r-2xl` 30 (dialogs, sheets) · `r-full` (chips, badges only).

## 4. Surfaces and elevation

- Solid white cards, hairline `border-default`, `shadow-sm`; `shadow-md` on hover for clickable cards.
- `shadow-sm` 0 1 2 @5% · `shadow-md` 2 layers @10% · `shadow-lg` 2 layers @14% (popovers) · `shadow-xl` 2 layers @18% (dialogs).
- `glow-accent` (2 layers @22% accent) — **only** the one card that is the current next step (e.g. the selected board card, the active form step).
- `focus-ring`: 0 0 0 3px accent @24% on every focusable element.

## 5. Motion

120 / 200 / 360 ms on `cubic-bezier(.22,1,.36,1)`. Fades and 8 px rises; no bounce, nothing that loops (except a loading spinner). Respect `prefers-reduced-motion`.

## 6. Icons

Lucide (`lucide-react`, already installed): 24 grid, 1.75 stroke, round caps/joins, `currentColor`. No emoji, no filled or duotone icons. Status icons are fixed by table 1.4.

## 7. Core components (built once, used everywhere)

Button (primary = accent, secondary = outline, ghost, destructive = error), Input, Select, Choice card (radio/checkbox as cards for picklists), Badge (status tones above), Card, Board column, Dialog/Sheet, Toast, Empty state, Stepper (request form), Photo uploader, Tag number display, Timeline.

## 8. Migration from today's styles

Today: slate/blue palette, many inline `style={{…}}` blocks, a dark "editorial" landing page. The token names in the global stylesheet already follow a semantic pattern, so the move is: replace the palette values with the tokens above → build the core components → replace inline styles screen by screen as each role is rebuilt.
