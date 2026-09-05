# Phase 2 changes — visual polish, responsive behaviour, accessibility and localization

This document records what changed in Phase 2, why, and what was deliberately left alone. It is
written against `docs/inventory.md` (Phase 0) for file paths and real scripts, and against
`docs/phase1-changes.md` for the storage, persistence and routing work this phase builds on.

The goal of this phase was narrow: make the app look and feel professional and polished —
consistent, confident, not templated — inside the existing Cobalt Workshop visual language, and
bring it up to WCAG 2.2 AA as far as a static client-only app allows. No new features, no
framework changes, no new dependencies.

Package manager: **pnpm 10.4.1**, invoked as `corepack pnpm …` because `pnpm` is not on the PATH
in this environment. Real scripts: `dev`, `build`, `start`, `preview`, `check`, `format`. There is
still no `test` script; the project-specific audits are plain Node scripts under `scripts/`.

The non-negotiable constraints from Phase 1 were kept: no analytics, tracking, ads, accounts,
database or always-on backend; English stays the default and the English/Bangla toggle keeps
working; static hosting including GitHub Pages keeps working; small reversible changes only; no
secret is persisted by default; no `eval`, `new Function` or unsanitized HTML injection.

---

## 1. Visual consistency

### 1.1 Typography — Bangla no longer falls through to whatever the platform picks

**Before.** The stylesheet loaded Space Grotesk and DM Mono only. Space Grotesk has no Bengali
coverage at all, so every Bangla string in the app fell through to the platform default — usually
Nirmala UI on Windows, at a mismatched weight and x-height against the Latin text beside it, and
frequently a boxes-and-tofu fallback on Linux. The two languages did not look like the same
product.

**After.** Noto Sans Bengali is loaded at 400/500/600/700 and named in every sans stack. The
stacks are declared by role, not by typeface, so a future swap happens in one place:

```css
--font-bengali: "Noto Sans Bengali", "Nirmala UI", "Shonar Bangla", "Vrinda", sans-serif;
--font-latin-display: "Space Grotesk", "Noto Sans Bengali", "Nirmala UI", "Shonar Bangla", "Vrinda", system-ui, sans-serif;
--font-ui: "Noto Sans Bengali", "Space Grotesk", "Nirmala UI", "Shonar Bangla", "Vrinda", system-ui, sans-serif;
--font-code: "DM Mono", ui-monospace, "Cascadia Mono", Menlo, monospace;
```

`--font-ui` leads with Bengali. Because font fallback is per-codepoint, the browser only reaches
Space Grotesk for the codepoints Noto Sans Bengali does not cover — which is exactly the Latin
text — so one stack serves both languages with no `:lang()` switch and no flash of the wrong face
on toggle. `--font-latin-display` keeps Space Grotesk first, because the brief asks for it on the
compact English display labels where it was already in use, and Bangla in a display heading falls
through to Noto for the same reason.

The platform Bengali faces (`Nirmala UI`, `Shonar Bangla`, `Vrinda`) were added to the two
mixed-script stacks late in this phase, not only to `--font-bengali`. Noto arrives over the
network, and this app is meant to stay usable offline once loaded. If that request fails,
`system-ui` was the next entry, and on Windows that resolves to Segoe UI, which has no Bengali
coverage — leaving the browser to do last-resort matching. Naming the platform faces explicitly
means Bangla lands on a real Bengali typeface either way.

Bangla also sits on a slightly taller line than Latin text: its ascenders, descenders and the
matra bar above the letters collide at the 1.5 that suits Latin.

**Verified.** `document.fonts.check("400 16px 'Noto Sans Bengali'")` and the 700 weight both
return `true` after `document.fonts.ready`, and the loaded face list contains a
`Noto Sans Bengali 400 loaded` entry. The computed `font-family` on `<body>` is the full stack
with Noto first.

### 1.2 The stitch texture was covering the whole app

**Before.** The fine stitch/coordinate texture overlay sat at `z-index: 30` — above every page
surface. All body text on every page was rendered through the noise. It was intended as a
background detail and was behaving as a foreground scrim.

**After.** `z-index: -1`. The texture is a background detail, which is what the brief asks for.

### 1.3 Decorative artwork replaced with token-driven CSS

**Before.** The hero, games and AI panels each loaded a PNG hotlinked from
`raw.githubusercontent.com`. That put a third-party request on the first paint of the home page —
leaking the visitor's IP and referrer to a host with nothing to do with this app, which is
straightforwardly at odds with the privacy-first constraint — and the local copies of those three
files come to 15.98 MB for art that is purely decorative (`alt=""`, inside `aria-hidden`).

**After.** The same staging is drawn from the token set: a drafting-sheet grid, the
diamond-and-crosshair registration mark taken from the wordmark, a nakshi stitch inset and a
cobalt edge light. No bytes, no network request, and it recolours with the active theme. The
games plate takes the warm accent so the play half of the site is distinguishable from the work
half by more than position.

The nakshi stitch inset is the one place the embroidery reference is allowed to be legible rather
than a background texture.

### 1.4 Glassmorphism, one-off colours and organic shapes removed

- **Header blur.** The sticky header used `backdrop-filter: blur(...)`. It read as
  glassmorphism, which the brief rules out, and cost a compositing layer on every scroll. A
  near-opaque background gives the same separation from the content behind it.
- **Game card wash.** `workbench-overrides.css` overrode the circular wash behind a game card
  with an organic blob (`border-radius: 38% 62% 60% 40%`), which read as a different design
  language from everything else in the app. The override is gone; the plain circle from
  `index.css` applies.
- **`ManusDialog.tsx` deleted.** This was dead template scaffolding — nothing imported it, and a
  repository-wide grep found only self-references. It was also the app's single largest
  concentration of everything this phase was meant to remove: four hardcoded hex colours outside
  the token system (`#f8f8f7`, `#34322d`, `#858481`, `#1a1a19`), a one-off `rounded-[20px]`
  radius, `backdrop-blur-2xl` glassmorphism, hardcoded English strings, and a login/account
  concept that would have breached the no-accounts constraint had anyone wired it up. Removed
  rather than fixed. It is recoverable with
  `git checkout HEAD -- client/src/components/ManusDialog.tsx` if that judgement was wrong.

### 1.5 Token drift

**Before.** The brand mark's two paper wedges were painted with `--secondary`. Since Phase 1
`--secondary` is derived as a near-surface neutral and no longer means "the second brand colour",
so the wedges were nearly invisible against the mark. The same token was used to tint the trophy
icon on a game card, which made the trophy almost the card colour.

**After.** The wedges name a paper token explicitly. The trophy uses the warm accent, which is
the token that means "achievement" everywhere else in the app.

**Before.** The tool bench, the data manager dialogs, the error boundary and the not-found panel
rendered completely unstyled — none of those class names existed in any stylesheet.

**After.** All four surfaces are styled, and every rule is written from custom properties only, so
a user-defined theme repaints them along with the rest of the app. A separate audit script
(`scripts/class-audit.mjs`) now fails if any project class name has no stylesheet rule; it reports
`All project class names are defined in a stylesheet.`

Static defaults are declared for the tokens the theme effect sets imperatively on
`documentElement.style`. An inline style always wins over a stylesheet, so those values only apply
before the first paint or if the effect never runs — which is exactly when a missing default would
show as unstyled content.

### 1.6 Focus rings

**Before.** Radix and shadcn controls set their own ring utilities, which resolved to Tailwind's
default ring blue rather than the theme's accent. Nothing guaranteed a focus indicator on
hand-written elements.

**After.** `--tw-ring-color` is set to `var(--primary)` at the root, so every shadcn ring follows
the theme. A shared `:focus-visible` outline is declared through `:where()`, which contributes no
specificity: a component style can still override it deliberately, but nothing removes it by
accident. The tool textarea has no border of its own, so its focus ring is drawn on the inside
rather than outside, where it would have been clipped.

### 1.7 Motion

**Before / after.** No `@keyframes` rule exists anywhere in this project's CSS, so there was no
looping decorative motion to remove. What exists is transitions.

**Verified across 12 routes** (`/`, `/tools`, `/games`, `/links`, `/ai`, `/settings`, `/about`,
`/privacy`, `/how-to`, a tool page, a game page and a 404): the complete set of non-zero computed
transition durations is **150ms, 180ms and 200ms** — every one inside the brief's 120–220ms
window, with **0 offenders**. `document.getAnimations()` returns only `CSSTransition` objects:
**0 `CSSAnimation` instances and 0 infinite-iteration animations**, confirming there is no ambient
looping motion.

`prefers-reduced-motion` is honoured globally:

```css
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
```

This was checked for real rather than assumed. `main.tsx` imports `index.css` and then
`workbench-overrides.css`, so the override file wins on equal specificity — but it contains no
animation or transition declarations at all, so the reduced-motion block is not undermined. Sonner
ships its own reduced-motion block. Functionally, with motion forced off, all three dialogs still
open, trap focus, close on Escape and restore focus correctly, with no stuck intermediate state.

---

## 2. Responsive behaviour

Checked manually at **320, 375, 768, 1024 and 1440** CSS pixels across `/`, `/tools`, `/games`,
`/links`, `/settings`, a tool page, a game page, `/ai` and `/about`.

**Result: no unintended horizontal scroll at any width on any route.**
`documentElement.scrollWidth - documentElement.clientWidth` is `0` in every combination.

### 2.1 The 320px floor

**Before.** Display headings are sized with `clamp()` against `vw`, and the `vw` term bottoms out
around 375px. Below that, the lower clamp bounds were still wider than the screen, so the headings
were the one thing forcing horizontal scroll at 320px.

**After.** A narrow-phone tier pins those headings to fixed sizes and lets long unbroken strings
wrap. Separately, a long URL, hash or generated token in tool output must not widen the page, so
`.tool-output` and the card paragraph styles carry `overflow-wrap: anywhere`. `body` keeps
`min-width: 320px` as the declared floor.

### 2.2 The 641–900px dead zone

**Before.** Header search collapsed into the mobile drawer at 900px, but the drawer and its
trigger button only appeared at 640px. Every viewport between 641px and 900px therefore had **no
way to reach search at all** — the field was hidden and the button that would reveal it was not
yet displayed.

**After.** The drawer and its trigger appear at 900px, matching where search collapses.

### 2.3 Surfaces covered

Shell and nav, header search and the drawer search, tool cards and the directory grid, the tool
workspace, settings including the theme builder, all three data manager dialogs, tables, code
output blocks, file drop zones and toasts. The `.directory-grid` span-2 rhythm is driven by
`:nth-child(11n+1)` and `:nth-child(11n+6)`, so adding any child to that grid shifts the rhythm —
noted here because it is a real constraint on future edits, not a defect.

---

## 3. Accessibility

### 3.1 Landmarks and heading hierarchy

**Verified across all 12 routes:** exactly one `<header>`, one `<main>`, one `<footer>` and one
`<h1>` inside `main` on every route. **0 landmark issues.**

**Before.** The two footer column headings were `<h3>`. On any page whose main content has no
`<h2>` of its own — an info page, a tool page, a game page, the 404 — the next heading in document
order after the page `<h1>` was that footer `<h3>`, which skips a level. That was **6 heading-level
skips across 6 routes** (`/about`, `/privacy`, `/how-to`, `/tools/word-counter`, `/games/snake` and
the 404), all of the form `h1 → h3`.

**After.** They are `<h2>`, which is the correct level: each is the heading of a top-level section
of the footer landmark, and each already labels its own `<nav>` through `aria-labelledby`. The
`.footer-column h3` selector in `index.css` was updated to `h2` in the same change, so the visual
result is byte-for-byte identical — computed style is still `10px DM Mono`, uppercase, with the
same letter-spacing. **0 heading skips across 12 routes** after the fix.

### 3.2 Accessible names

**Verified across all 12 routes: 0 interactive elements without an accessible name**, counting
`aria-label`, `title`, text content, an associated `<label>`, `aria-labelledby` and `placeholder`,
and skipping anything inside an `aria-hidden` subtree.

Icon-only controls — the theme toggle, the language toggle, the menu button, the search clear
button, the dialog close button, the colour swatches in the theme builder — all carry an
`aria-label` from the dictionary. Every decorative `lucide` icon is `aria-hidden="true"` so its
glyph never lands in the button's name.

### 3.3 The skip link

**Before.** The skip link revealed itself on `:focus-visible`.

That is subtly wrong for this one element. Programmatic focus and some assistive-technology focus
do not set `:focus-visible`, which left the link at `translateY(-200%)` — off the top of the
viewport — precisely when a keyboard or AT user landed on it. The usual reason to prefer
`:focus-visible` is to suppress a ring on mouse click, and a skip link is unreachable by pointer,
so that reason does not apply here.

**After.** `.skip-link:focus`. The link stays in the tab order at all times rather than being
removed and re-inserted, so the first Tab press on any page reaches it, and it is hidden with
`clip-path` rather than `display: none`, because a `display: none` element cannot receive focus at
all.

**Verified** by reading the rule back out of the CSSOM and force-measuring the focused state: the
link renders at `{ top: 8, left: 8, width: 200, height: 35 }`, fully on screen — which also
satisfies the 24×24 target minimum.

### 3.4 Focus restoration in the data manager — a real defect, fixed

**Before.** The data manager's two inner confirmation dialogs (restore-from-file and clear-all)
are controlled through `open={...}` rather than opened by a `DialogTrigger`. Radix restores focus
to `triggerRef.current` on close, and with no trigger that ref is `null`, so focus fell to
`<body>`. A keyboard user who opened a confirmation and cancelled it lost their place entirely,
even though the outer dialog was still open behind it.

**After.** Both dialogs pass `onCloseAutoFocus` and send focus back to the exact button that
opened them:

```tsx
/** Sends focus back to the control that opened a confirmation dialog. */
const restoreFocus = (target: React.RefObject<HTMLButtonElement | null>) => (event: Event) => {
  if (!target.current) return;
  event.preventDefault();
  target.current.focus();
};
```

**Verified** end to end for both dialogs: after cancelling, `document.activeElement` is the
originating button (`"Choose file"` and the destructive clear button respectively). The check ran
against live storage and `storageKeys` stayed at `4` throughout, so nothing was destroyed while
testing the destructive path.

### 3.5 Dialogs

All three data manager dialogs were audited individually and each one:

- resolves `aria-labelledby` and `aria-describedby` to real title and description text;
- moves focus inside itself on open, with Radix's focus guards present;
- closes on Escape, and Escape closes only the topmost layer;
- locks body scroll on open and restores it on close;
- has an accessible name on every focusable control inside it;
- preselects **merge**, the non-destructive import mode, rather than replace;
- lands initial focus on "Cancel" rather than on the destructive confirm button.

One thing worth recording because it looks like a defect and is not: Radix Dialog does **not** set
`aria-modal="true"`. It hides the rest of the page from assistive technology using `hideOthers()`
from the `aria-hidden` package instead, which stamps `data-aria-hidden="true"` markers on sibling
subtrees. That was verified rather than taken on trust — 16 elements carry the marker while a
dialog is open (header, footer, skip link, page intro, the settings sections, the overlay), and a
direct probe found **0 exposed headings and 0 exposed interactive elements inside `main`**. The
outcome is equivalent, so this was left as designed.

### 3.6 Status is never signalled by colour alone

Each state carries a non-colour cue as well as its tint:

- a tool error carries a bar and a tinted panel, not just red text;
- a warning carries a rule and a tinted panel as well as its icon;
- the one irreversible action on the data manager panel is marked by a rule, not only by the
  destructive colour;
- the selected import mode is marked by an inset rule as well as by the radio button;
- a listed-but-unbuilt tool does not borrow the cobalt "verified" accent, so "planned" and
  "available" differ by more than hue;
- the selected theme preset carries an inset border as well as an accent.

Tailwind's `destructive` utilities are wired to the same two custom properties the hand-written
error panels use, so a button variant and a hand-styled panel cannot drift apart.

### 3.7 Live regions

Announcements exist for every state change that has no visual result of its own:

| What | Where | Mechanism |
| --- | --- | --- |
| Recomputed tool output | `ToolWorkspace.tsx` | `<pre role="status" aria-live="polite">` |
| Copy / download success | `ToolWorkspace.tsx` | `sr-only` `role="status"` `aria-live="polite"` |
| Import / export / clear result | `DataManager.tsx` | `role="status"` `aria-live="polite"` |
| Theme saved, imported, invalid | `ThemePanel.tsx` | `role="status"` `aria-live="polite"` |
| Game score and state | `GamePage.tsx` | `role="status"` `aria-live="polite"` |
| Storage unavailable | `GamePage.tsx` | `role="alert"` |
| Filter and search result counts | `Tools.tsx`, `Games.tsx`, `Links.tsx` | `role="status"` |
| Render crash | `ErrorBoundary.tsx` | `role="alert"` with `aria-labelledby` (added in Phase 1) |

Copy and download are the important pair: both produce no visible change at all, so without an
announcement a screen-reader user has no way to know whether the button worked.

### 3.8 Target size (WCAG 2.2 SC 2.5.8)

**Before.** A sweep at 375px against the 24×24 CSS pixel minimum found four undersized controls:

| Control | Size | Routes |
| --- | --- | --- |
| Directory search `<input>` | 305×21 | `/tools`, `/games`, `/links` |
| `.back-link` | 53×20 | `/tools/word-counter` |
| `.back-link` | 116×20 | `/games/snake` |
| Header search `<input>` | 192×17 | every route ≥900px, and inside the drawer below it |

Both search inputs took their height from their font size alone and neither was any larger as a
pointer target than the text itself: the padded wrapper is a plain `<div>` with no click handler,
and the `<label>` that would extend the target is `sr-only`. `.back-link` is standalone page
navigation rather than a link inside a sentence, so 2.5.8's inline exception does not cover it.

**After.** All three raised to a 24px minimum height, **unconditionally** rather than inside the
existing `@media (pointer: coarse)` block, because 2.5.8 is a pointer criterion and not a
touch-only one:

```css
.back-link,
.search-field input,
.header-search input { min-height: 24px; }
```

24px is close enough to their previous heights that the dense desktop layout is unaffected: the
header inner row stayed at 42px, and the directory bar went from 48px to 50px.

**Verified at 375px with touch emulation on across 9 routes: 0 undersized targets, 0 horizontal
scroll.** Verified again with a fine pointer at 1024px, where `.search-field input` measures 24px
and `.back-link` measures 24px.

Two things were deliberately not changed:

- **Footer and section links under a fine pointer.** With `pointer: coarse` off, the six footer
  links measure 225×20 and `.text-link` measures 21px tall. These meet 2.5.8's **spacing
  exception**, and that was measured rather than asserted: the minimum centre-to-centre distance
  from any of them to the nearest other target is **27px**, above the 24px the exception requires.
  Under `pointer: coarse` they are already raised to 44px, where finger accuracy actually matters.
  Raising them unconditionally would add 24px of footer height on desktop for no real benefit.
- **The theme builder's specimen link.** `/settings` reports one 245×15 `<a>` reading "Secondary
  link →". It is a type specimen inside the live theme preview, has no `href`, and sits inside a
  block that is `aria-hidden="true"` within a `role="img"` container. It accepts no pointer action,
  so it is not a target. The specimen input and button beside it already carry `tabIndex={-1}`; the
  anchor needs none, because an anchor without `href` is not focusable.

### 3.9 The `lang` attribute

**Verified live.** Clicking the language toggle flips `document.documentElement.lang` from `en` to
`bn` and back. `document.title` and `og:locale` follow it in the same effect (`en_US` ⇄ `bn_BD`),
and the toggle button itself carries `lang` for the *other* language, so a screen reader
pronounces "বাংলা" in Bangla while the surrounding page is English.

### 3.10 200% zoom

Covered by the same reflow work as §2: with no fixed pixel widths on any container and `clamp()`
sizing on the display type, 200% zoom is equivalent to halving the viewport width, and the 320px
tier is the narrowest case that was tested.

---

## 4. Localization

### 4.1 The dictionary is now the single source of truth

**288 keys per locale.** Locale parity is enforced at compile time rather than at runtime:
`TranslationKey = keyof typeof en` and `const bn: Record<TranslationKey, string>`, so a missing
Bangla key is a TypeScript error, not something a test has to find. Keys are stable semantic
identifiers (`data.restore.title`, `a11y.switchLanguage`, `tool.mode.yaml`), never raw English
sentences.

### 4.2 Hardcoded strings found and fixed

Three leaks remained after the bulk translation work, all of them in places easy to miss because
they are not visible prose:

| Leak | Before | After |
| --- | --- | --- |
| Toast region name | Sonner's English default, `"Notifications alt+T"` | `containerAriaLabel={t("a11y.notifications")}` |
| Dialog close button | `<span className="sr-only">Close</span>` | `{t("common.close")}` |
| Footer copyright | `© 2026 Tools & Games BD`, year frozen in the markup | `t("footer.copyright", { year: new Date().getFullYear() })` |

The dialog close button is worth calling out: it has no visible text, so that `sr-only` span was
its *only* accessible name — which made it the single label on the page a Bangla screen-reader user
could not have understood. **Verified** flipping from `"Close"` to `"বন্ধ"` in the browser on
toggle.

The footer copyright had a second bug hiding behind the first: the year was a literal. It now
comes from the runtime, verified rendering `© 2026 Tools & Games BD`.

Two keys were added for these: `a11y.notifications` and `footer.copyright`.

### 4.3 Sonner was reading its theme from a provider that does not exist

**Before.** `sonner.tsx` shipped from the shadcn template reading its theme from `next-themes`.
This app never installs a `next-themes` provider, so `useTheme()` always returned the default
`"system"` and Sonner picked its light/dark internals from the *operating system* rather than from
the theme the user chose in the app. With twelve presets and an explicit light/dark toggle, that
meant a light toast could appear over a dark page.

**After.** It reads the app's own resolved theme, which `AppSettingsContext` already exposes as
`"light" | "dark"`. Background, text and border still come from the app's custom properties, so a
toast stays inside the token system instead of carrying Sonner's own palette.

### 4.4 Registry descriptions

The dictionary is not the only place user-facing prose lives. Tools, games and links each carry a
`description: { en, bn }` pair in `client/src/data`, and those had the same failure mode —
`links.ts` set `en: bn` for all 22 entries, and both other data files generated one locale from a
template. All three registries are now checked: **283 tool description pairs, 32 game description
pairs, 22 link description pairs**, all with genuinely distinct locales.

Tool *names* stay English-only, which is deliberate: they are what people search for. Descriptions,
categories, controls, instructions, keyboard hints and accessibility labels are all localized.

### 4.5 Two audit scripts

The brief asked for "a lightweight dev/test check that flags missing translation keys or
English-only text where Bangla is expected". There are two, because they catch different things.

**`scripts/i18n-parity.mjs`** — run with
`node --experimental-strip-types scripts/i18n-parity.mjs`. Since a *missing* key is already a
compile error, this script catches the failure mode the type system cannot see: a Bangla entry
filled in with the English string, which typechecks, renders and looks finished. It also checks
that interpolation placeholders survive translation (a dropped `{count}` breaks the value at
runtime), flags English keys left as `TODO`/`FIXME`, and runs the same three checks over all three
data registries.

Five keys are identical across locales by design and are allowlisted with a reason each:
`static.eyebrow` (product name, a proper noun kept Latin for searchability), `nav.ai` ("AI" is the
form in ordinary Bangla usage; the transliteration "এআই" is not), `tool.mode.yaml` and
`tool.mode.xml` (serialization format names are identifiers, not prose), and `footer.copyright`
(a symbol, an interpolated runtime year and a proper noun — no prose in it to translate).

Current output:

```
Checked 288 translation keys across 2 locales.
Checked 283 tools description pairs.
Checked 32 games description pairs.
Checked 22 links description pairs.

5 key(s) identical by design (proper nouns, identifiers, punctuation) — not a problem.

0 problem(s) found.
```

**`scripts/hardcoded-strings.mjs`** — run with `node scripts/hardcoded-strings.mjs`. Parity only
sees strings that made it into the dictionary. A string typed straight into a component bypasses
the dictionary silently: it typechecks, it renders, and it shows English to a Bangla reader with
nothing to flag it. This catches the two ways that happens in JSX — text between tags, and a
localizable attribute (`aria-label`, `placeholder`, `title`, `alt` and four more) given a literal
instead of a `t(...)` call.

It walks the module graph from `main.tsx` and scans only what the app actually reaches — **24
reachable `.tsx` files**. `client/src/components/ui` carries the full shadcn set, most of which
this app never renders, and auditing dead vendor files would bury the real findings. A primitive
becomes subject to the check the moment something imports it.

Six literals are allowlisted with a reason: the four wordmark fragments (`TOOLS`, `GAMES`,
`BANGLADESH`, `BD` — the visible letters are inside `aria-hidden`, and the link's accessible name
comes from `a11y.home`, so they are decoration and stay Latin in both locales), and the two
language-switch labels (`বাংলা` and `English`, each being the name of the *other* language written
in that language, which is what a reader needs to see on the button).

Current output:

```
Scanned 24 reachable component file(s) for hardcoded user-facing text.
No hardcoded user-facing text in any reachable component.
```

One false positive was fixed during development rather than allowlisted. The `>` … `<` text-node
pattern also spans a pair of comparison operators in ordinary TypeScript, so
`saved.length > 0 && saved.length < 64` read as a text node. `isProse()` now rejects any match
containing `&&`, `||`, `===`, `!==`, `=>`, `??`, `.length` or `()`, since all of those mean the
match came from an expression rather than from JSX.

---

## 5. Verification

All five checks run clean, and the production build succeeds.

```
corepack pnpm run check                                     # tsc --noEmit, no output
node --experimental-strip-types scripts/i18n-parity.mjs     # 0 problem(s) found
node scripts/hardcoded-strings.mjs                          # no hardcoded user-facing text
node scripts/class-audit.mjs                                # all class names defined
node --experimental-strip-types scripts/theme-contrast.mjs   # 12/12 presets pass
corepack pnpm run build                                      # built in 5.85s
```

`scripts/theme-contrast.mjs` computes WCAG contrast ratios for all twelve theme presets using the
maths in `client/src/lib/color.ts`, and reports
`0 failure(s) in default presets, 0 warning(s) in opt-in presets.`

### Manual browser verification

| Area | Coverage | Result |
| --- | --- | --- |
| Horizontal scroll | 320 / 375 / 768 / 1024 / 1440 px × 9 routes | 0 overflow |
| Target size, coarse pointer | 375px, touch emulated, 9 routes | 0 undersized |
| Target size, fine pointer | 1024px, 9 routes | spacing exception met, min 27px centre distance |
| Accessible names | 12 routes | 0 unnamed interactive elements |
| Heading hierarchy | 12 routes | 0 level skips |
| Landmarks | 12 routes | 1 header / 1 main / 1 footer / 1 h1 each |
| Transition durations | 12 routes | {150, 180, 200} ms, 0 outside 120–220ms |
| Looping animation | 12 routes | 0 `CSSAnimation`, 0 infinite iterations |
| Dialogs | all 3 data manager dialogs | labelled, trapped, Escape-closable, focus restored |
| Reduced motion | motion forced off | dialogs open, trap, close and restore with no stuck state |
| `lang` attribute | toggle both directions | `en` ⇄ `bn`, title and `og:locale` follow |

### Build output

| Asset | Phase 1 baseline | Before Phase 2 close-out | Now |
| --- | --- | --- | --- |
| CSS | 139.97 kB | 149.40 kB (gzip 24.96) | **146.86 kB** (gzip 24.56) |
| JS | 1,118.78 kB | 1,201.89 kB (gzip 353.88) | **1,201.62 kB** (gzip 354.59) |
| `index.html` | — | 368.00 kB (gzip 105.70) | **368.00 kB** (gzip 105.70) |
| Build time | — | 18.63s | **5.85s** |

CSS shrank by 2.54 kB despite the new rules, because deleting `ManusDialog.tsx` removed the
Tailwind utilities only it used. Rollup still warns
`Some chunks are larger than 500 kB after minification`, unchanged from the Phase 1 baseline;
code-splitting is a performance concern rather than a polish one and is out of scope for this
phase.

---

## 6. Deliberately deferred, and why

**`next-themes` is still a dependency.** `package.json` lists `next-themes@^0.4.6` and nothing
imports it any more, now that `sonner.tsx` reads the app's own theme. Removing it churns the
lockfile, which is a bigger and less reversible change than anything else in this phase and has no
effect on the shipped bundle (it was already tree-shaken out). Left for a dependency-hygiene pass.

**The unused shadcn primitives are untouched.** `client/src/components/ui` carries the full shadcn
set; the app imports only `sonner`, `tooltip`, `button`, `dialog` and `input`. Several of the
unused files would fail this phase's own bars — `sheet.tsx` uses `duration-300` and `duration-500`,
`input-otp.tsx` uses `duration-1000`, `skeleton.tsx` uses `animate-pulse` and `spinner.tsx` uses
`animate-spin`, all outside the 120–220ms window or looping. None of them renders, so none of them
affects a user today. Editing five vendor files to fix a problem nobody can observe is churn; the
honest options are to delete them or to leave them, and deleting a primitive someone may reach for
next week is the more destructive choice. The `hardcoded-strings.mjs` reachability walk means any
of them comes under audit automatically the moment it is imported.

**`aria-modal="true"` is not added to dialogs.** Radix omits it deliberately and uses
`hideOthers()` instead. The outcome was verified equivalent (§3.5): 0 headings and 0 interactive
elements are exposed inside `main` while a dialog is open. Overriding a primitive's deliberate
design to satisfy a checklist item it already satisfies in substance would be a change with risk
and no benefit.

**Prettier was not run.** `.prettierrc` sets `printWidth: 80` against a codebase written in
200-plus column one-liners. Running `corepack pnpm run format` would reformat effectively every
file, producing a diff that buries this phase's actual changes and makes the work unreviewable.
This was the Phase 1 decision and it still stands. New code in this phase matches the density of
the code around it.

**Code-splitting the 1.2 MB JS bundle.** Real, measurable, and a performance task rather than a
polish task. The Rollup warning is recorded above so it is not lost.

**Footer and section links are not raised to 24px under a fine pointer.** Explained in §3.8: they
meet 2.5.8's spacing exception with a measured 27px minimum centre distance, and they are already
44px under `pointer: coarse`.

**`--font-latin-display` still leads with Space Grotesk.** That means Bangla in a display heading
is rendered by the second face in the stack rather than the first. This is correct per-codepoint
fallback and the brief explicitly asks for Space Grotesk on the compact English display labels
where it was already in use, so the alternative — a `:lang()` switch — would add complexity to
achieve the same rendering.

---

## 7. Files changed in this phase

| File | Change |
| --- | --- |
| `client/src/index.css` | Bengali font loading and stacks, texture z-index, CSS-drawn plates, header blur removed, focus ring tokens, skip link `:focus`, workbench/data-manager/error/not-found surfaces, 320px tier, target-size rules, footer heading selector |
| `client/src/workbench-overrides.css` | Brand mark and trophy tokens, organic blob override removed, drawer breakpoint moved to 900px |
| `client/src/components/SiteShell.tsx` | Footer copyright from the dictionary with a runtime year; footer column headings `h3` → `h2` |
| `client/src/components/DataManager.tsx` | `onCloseAutoFocus` focus restoration for both confirmation dialogs |
| `client/src/components/ThemePanel.tsx` | Live preview marked as a specimen (`role="img"`, `aria-hidden` children, `tabIndex={-1}`) |
| `client/src/components/ToolWorkspace.tsx` | Live-region announcements for output, copy and download |
| `client/src/components/ui/dialog.tsx` | Close button name from the dictionary |
| `client/src/components/ui/sonner.tsx` | Theme from `AppSettingsContext` instead of `next-themes`; localized region name |
| `client/src/components/ManusDialog.tsx` | **Deleted** — dead template scaffolding |
| `client/src/i18n/translations.ts` | 288 keys per locale; `a11y.notifications` and `footer.copyright` added this phase |
| `scripts/hardcoded-strings.mjs` | **New** — reachability-aware hardcoded-text audit |
| `scripts/i18n-parity.mjs` | `footer.copyright` allowlisted with a reason |

`scripts/class-audit.mjs`, `scripts/theme-contrast.mjs`, `scripts/i18n-parity.mjs` and the
`role="alert"` treatment in `client/src/components/ErrorBoundary.tsx` were added in Phase 1 and are
listed in `docs/phase1-changes.md`. They are re-run here as part of the verification suite, and
`i18n-parity.mjs` gained one allowlist entry this phase.
</content>
</invoke>
