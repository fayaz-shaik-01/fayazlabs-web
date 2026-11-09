# Design notes

**Status: the design revamp is NOT done.** The course design tokens and component CSS live in the private
course repository, which could not be attached in this session, so no site-wide restyle was attempted
(inventing a look would have to be redone).

What exists:

- `src/app/course-prose.css` styles lesson fragments under `.course-prose` (callouts, cards, tables, code,
  quiz blocks, links, reduced motion). It uses the site's existing theme variables (`--foreground`,
  `--border`, `--card`, `--muted`, `--primary`, `--ring`), so light and dark follow the theme.
  It is not the private course's CSS.
- Player styles (`.player-btn`, `.player-watermark`) are at the end of `src/app/globals.css`.
- `docs/design-review/` has desktop/phone, light/dark screenshots of the lesson page, synthetic content only.

To apply the real tokens: add them as CSS variables in `globals.css` (map them onto the shadcn variables
above), replace the rules in `course-prose.css` with the course's component rules, then re-run
`npx playwright test -c playwright.player.config.ts shots` to refresh the screenshots.

# Player contract assumptions

Everything assumed about the content layout, AAD and deck schema is in `src/lib/player/format.ts`.
These were NOT checked against the private `CONTENT_FORMAT.md` / `MEDIA_FORMAT.md`; verify them first.
