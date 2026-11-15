# Security fixes: owner actions (web repo)

Everything the code changes could not do. Scripts take `REPO=owner/name` (default is this repo),
never print or contain secret values, and are safe to re-run.

## Order

1. **Merge `security-fixes-web` to `main` and deploy it first.** The platform change that makes the AI
   routes require auth must go out *after* this, because the web proxies now send the bearer token.
2. `./01-enable-secret-scanning.sh` — secret scanning + push protection (F-01).
3. `./02-production-environment.sh` — protected `production` environment, main only (F-19).
   Then move `PLATFORM_URL` and `ADMIN_INGEST_SECRET` into it (commands are printed) and delete the
   repo-level copies.
4. After CI has run once on `main`: `./03-branch-protection.sh` (requires the `checks` job).
5. `./04-check-vercel-env.sh` — Vercel Production env audit, plus the manual items below.
6. Platform deploy that enforces auth on the AI routes.

## Vercel Production checklist (manual)

- `NEXT_PUBLIC_API_MOCK` must **not** be set.
- `NEXT_PUBLIC_FEATURE_TAX` is no longer read (the tax feature was removed); delete it if present.
- No secret may have a `NEXT_PUBLIC_` name (those are bundled into browser JS).
- Confirm the backend base URL (`PLATFORM_URL` / `NEXT_PUBLIC_PLATFORM_URL`) points at Cloud Run, not an old host.

## GitHub settings (manual, if you skip the scripts)

- Settings > Code security: secret scanning and push protection on.
- Settings > Environments > `production`: deployment branches = `main`, optional required reviewer.
- Settings > Branches: protect `main`, require PR and the `checks` status.

## F-01 history

`payload.json` (a webhook secret) is still in git history from commit `e326df4`. The value was rotated,
so rewriting history is optional. If you do it anyway (git filter-repo, then force-push and re-clone
everywhere), do it deliberately; nothing in this branch depends on it.

## Open items / follow-ups

- **F-19 payload keys:** the workflow now sends `file_path` per file and a boolean `clear_existing`, matching the platform's `AdminIngestRequest` (contract confirmed by the platform session, not read directly from this repo). Worth one real ingest run after deploy to confirm.
- **COOP:** set to `same-origin-allow-popups`, not `same-origin`, because Google sign-in and Razorpay
  checkout use popups that need to reach back to the page. Tighten only after testing both.
- **F-12 not started (needs platform work):**
  - localStorage tokens to httpOnly cookies: platform sets `Set-Cookie` (httpOnly, Secure, SameSite=Lax)
    on login/refresh, web drops `token-store.ts` localStorage use and sends `credentials: "include"`,
    plus CSRF protection for cookie-authenticated POSTs.
  - Nonce-based CSP: generate a per-request nonce in `src/proxy.ts`, set it in the CSP header and
    drop `'unsafe-inline'`/`'unsafe-eval'` from `script-src`; needs testing against Plotly, Razorpay and GIS.
- **Lint** is not gated in CI: 18 pre-existing eslint errors. Fix, then add `npm run lint` to `ci.yml`.
- **Action pinning:** actions are on version tags (`@v4`). Pin to SHAs when you can verify them; Dependabot
  (github-actions) will keep them updated.
- **Dependencies:** 4 low-severity advisories remain (katex chain); the only fix is a breaking downgrade.
