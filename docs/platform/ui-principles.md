# UI principles

Applies to every screen, public and staff. Colours and fonts come later from the design system; these rules don't depend on them.

## Feel
Clean and calm, like the best modern AI products (ChatGPT, Claude, Linear): lots of white space, one font, few colours, no decoration that doesn't carry meaning.

## Rules
1. **One primary action per screen.** The next step is always the biggest, most obvious button. Secondary actions are quiet.
2. **No explaining text.** Labels and layout should be self-evident. No paragraphs of instructions, no "Click here to…". If a screen needs explaining, redesign the screen.
3. **No vague choices.** Every option means exactly one thing. Same word for the same thing everywhere (see `GLOSSARY.md`). Never two buttons that could both seem right.
4. **Show only what's needed now.** Steps and progressive disclosure instead of long forms. Hide advanced or rare fields until asked for.
5. **Status is visible at a glance.** One consistent status badge style; colour + label, never colour alone.
6. **Fast feedback.** Every action shows a result immediately (toast or inline state). Buttons show loading; nothing silently fails.
7. **Errors say how to fix it**, in one short line, next to the field.
8. **Mobile-first** for requesters and technicians; desktop-first for the lead board and admin, but still usable on a phone.
9. **Big targets, large tag numbers**, readable in a busy room.
10. **Consistent components.** One button, input, badge, card, table and dialog style, used everywhere. No one-off inline styles (today many pages use `style={{…}}` — to be replaced).
11. **Accessible:** keyboard-usable, visible focus, labels on every input, contrast AA.
12. **Empty states are useful**: one line + the action to take, never a blank area.
