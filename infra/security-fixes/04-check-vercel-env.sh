#!/usr/bin/env bash
# Audit Vercel Production env var NAMES (values are never fetched or printed).
# Requires: vercel CLI logged in and the project linked (vercel link). Read-only, safe to re-run.
set -uo pipefail

names="$(vercel env ls production 2>/dev/null | awk 'NR>1 && $1 ~ /^[A-Z][A-Z0-9_]+$/ {print $1}')"
[ -n "$names" ] || { echo "No env names read; is the project linked (vercel link)?"; exit 2; }
fail=0

for bad in NEXT_PUBLIC_API_MOCK NEXT_PUBLIC_FEATURE_TAX; do
  if grep -qx "$bad" <<<"$names"; then echo "FAIL  $bad is set in Production (remove it)"; fail=1; else echo "ok    $bad not set"; fi
done

leaky="$(grep -E '^NEXT_PUBLIC_.*(SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|ADMIN)' <<<"$names" || true)"
if [ -n "$leaky" ]; then echo "FAIL  secret-looking NEXT_PUBLIC_ names (they ship to browsers):"; sed 's/^/        /' <<<"$leaky"; fail=1; else echo "ok    no secret-looking NEXT_PUBLIC_ names"; fi

echo
echo "MANUAL: confirm the backend base URL in Production (PLATFORM_URL / NEXT_PUBLIC_PLATFORM_URL)"
echo "        points at the Cloud Run service and not an old host. Check it in the Vercel dashboard."
exit $fail
