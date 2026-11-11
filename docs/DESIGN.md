# Design system

The site uses the "mission control × cinematic" look: a glass-over-scene UI, mono uppercase labels, corner
brackets on key panels, one blue accent (amber for highlights), and a persistent 3D robot assistant named
**Bolt**. It follows the device theme (light "studio daylight", dark "night console").

## Tokens (`src/app/globals.css`)

Semantic shadcn variables carry the palette, so every `ui/*` component follows the theme:

| Token | Light | Dark |
|---|---|---|
| `--background` | `#e8edf3` | `#070a10` |
| `--card` (glass) | `rgb(255 255 255 / .8)` | `rgb(11 19 30 / .7)` |
| `--popover` (solid) | `#ffffff` | `#0d1520` |
| `--foreground` | `#0e1b2a` | `#e8eff6` |
| `--muted-foreground` | `#4f6578` | `#8aa0b2` |
| `--border` | `rgb(10 100 170 / .26)` | `rgb(108 184 255 / .26)` |
| `--primary` (accent) | `#0b66b0` | `#6cb8ff` |
| `--accent` / `--accent-soft` (tint) | `rgb(11 102 176 / .1)` | `rgb(108 184 255 / .14)` |
| `--warn` / `--warn-soft` | `#b25400` / `#fbe8d3` | `#ffa43a` / `#2e2112` |
| `--destructive` | `#c32a3b` | `#ff5d6c` |
| `--good` | `#158a4e` | `#4be08f` |

`--surface-0..3` are elevation steps. `--chart-1..5` is the chart palette. `--radius` is 0.5rem.
`--page-glow` is the soft radial backdrop on `body`. Theme switching is `next-themes` with the `.dark` class;
the default follows the system.

The `--bolt-*` tokens (`shell`, `under`, `metal`, `line`, `glow`, `floor`, `pass`, `hi`) colour the 3D scene.
Bolt reads them with `getComputedStyle` and rebuilds when the theme class changes.

## Fonts (`src/app/layout.tsx`)

Space Grotesk for headings (`font-heading`), IBM Plex Sans for body, JetBrains Mono for labels and code
(`font-mono`). All three are self-hosted through `next/font/google`.

## Building blocks

- `.panel` (+ `.panel-interactive` for linked cards): glass card, translucent with a backdrop blur.
- `.bracket`: the four-corner HUD marks. Use on hero cards, the slide player, the chat. Not for every card.
- `.eyebrow` (+ `.eyebrow-accent`): mono uppercase label. `.chip`: small tinted pill for IDs and categories.
- `.callout` (dashed accent box) and `.note` (soft warning strip).
- `.text-display-*`, `.text-heading-*`, `.text-body*`: the type scale.
- `.glass`: translucent sticky chrome (header, footer).
- `BrandMark`, `SectionHeader`, `AnimatedSection` in `components/`.
- Prose: `.prose` (MDX) and `.course-prose` (lesson fragments) share the same look.

## Bolt, the 3D assistant (`src/components/bolt/`)

One persistent three.js scene sits behind the whole site (`BoltLayer` in the root layout). Bolt is the site's
AI assistant: clicking him, the "Ask Bolt" pill, or "Meet Bolt" opens the chat, which uses the existing chat
store and `/api/chat` backend.

- `bolt-scene.ts`: pure three.js (no React). The humanoid, the studio reflections, the look-at / scroll /
  point behaviours and the camera presets. Returns a controller.
- `bolt-layer.tsx`: owns the canvases, the speech bubble, the "Ask Bolt" pill, the laser-pointer overlay, and
  the document-level listeners (pointer, scroll, click, hover). three.js loads on demand after the page is idle.
- Behaviours: his head and eyes follow the pointer; he tilts toward the scroll direction; clicking anywhere
  makes him point at the spot (laser and reticle); hovering an element with `data-bolt-point` makes him point
  at it; while the assistant answers he talks and gestures.
- Camera presets: `hero` (home, above the fold), `companion` (small, in the right-hand gutter), `chat` (bust,
  above the chat panel).
- Modes per route (`boltMode`): `hero` for `/`, `dim` for reading pages (lessons, articles; he is faded),
  `off` for forms and dense tools. Add routes to the `OFF` and `DIM` lists in `bolt-layer.tsx`.
- Layout: on desktop, `#main-content` gets a right gutter (`--bolt-gutter`) so content never sits under him.
  On `/`, the sections below the hero get the same gutter and he shrinks to the corner when you scroll.
- Opt-outs: `data-bolt-ignore` on an element stops clicks on it from making him point.
- Off by design on phones (under 1000px), with reduced motion, and without WebGL. The `BoltFace` CSS launcher
  takes over, so the chat still works everywhere.
- Hide-and-seek rule for tests: Playwright runs with reduced motion (`contextOptions` in
  `playwright.config.ts`), so Bolt is off and the CSS launcher is used. One test turns 3D on.

## Notes

- Visualization internals (`components/visualizations/*`) keep their own data-series colours; only their
  surrounding chrome follows the tokens.
- The course has no per-lesson completion tracking yet, so the course page shows catalog stats, not progress bars.
- The screenshots in `docs/design-review/` predate this redesign. Regenerate them with
  `npx playwright test -c playwright.player.config.ts shots`.

# Player contract assumptions

Everything assumed about the content layout, AAD and deck schema is in `src/lib/player/format.ts`.
These were NOT checked against the private `CONTENT_FORMAT.md` / `MEDIA_FORMAT.md`; verify them first.
