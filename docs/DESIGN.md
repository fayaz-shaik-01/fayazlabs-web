# Design system

The site uses a flat, editorial "test report" look: paper-coloured page, white cards with 1px borders,
one teal accent, mono uppercase labels. There is no glow, glass, gradient text or grid overlay.

## Tokens (`src/app/globals.css`)

Semantic shadcn variables carry the palette, so every `ui/*` component follows the theme:

| Token | Light | Dark |
|---|---|---|
| `--background` | `#f1f4f6` | `#0d1a22` |
| `--card` / `--popover` | `#ffffff` | `#132530` |
| `--foreground` | `#11222e` | `#e5eef2` |
| `--muted-foreground` | `#55676f` | `#93a6b0` |
| `--border` | `#d6dfe4` | `#24394a` |
| `--primary` (teal accent) | `#0b6e63` | `#4fd1be` |
| `--accent` / `--accent-soft` (tint) | `#dcefeb` | `#13383a` |
| `--warn` / `--warn-soft` | `#a8500a` / `#f8e8d9` | `#f0a566` / `#3a2a1b` |
| `--destructive` | `#b42318` | `#f07167` |

`--surface-0..3` are elevation steps (page, card, inset/code, pressed). `--chart-1..5` is the chart palette.
`--radius` is 0.5rem. Theme switching is `next-themes` with the `.dark` class; the default follows the system.

## Fonts (`src/app/layout.tsx`)

Bricolage Grotesque for headings (`font-heading`), Source Sans 3 for body, JetBrains Mono for labels and code
(`font-mono`). All three are self-hosted through `next/font/google`.

## Building blocks

- `.panel` (+ `.panel-interactive` for linked cards): flat card surface.
- `.eyebrow`: mono uppercase label. `.chip`: small tinted pill for IDs and categories (`.chip-warn` variant).
- `.callout` (dashed accent box) and `.note` (soft warning strip).
- `.text-display-*`, `.text-heading-*`, `.text-body*`: the type scale.
- `BrandMark`, `SectionHeader`, `AnimatedSection` (now a plain section with the header offset) in `components/`.
- Prose: `.prose` (MDX) and `.course-prose` (lesson fragments) share the same look.

## Notes

- Visualization internals (`components/visualizations/*`) keep their own data-series colours; only their
  surrounding chrome follows the tokens.
- The course has no per-lesson completion tracking yet, so the course page shows catalog stats, not progress bars.
- Screenshots: `npx playwright test -c playwright.player.config.ts shots` refreshes `docs/design-review/`.

# Player contract assumptions

Everything assumed about the content layout, AAD and deck schema is in `src/lib/player/format.ts`.
These were NOT checked against the private `CONTENT_FORMAT.md` / `MEDIA_FORMAT.md`; verify them first.
