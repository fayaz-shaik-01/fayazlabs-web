#!/usr/bin/env bash
# F-01: enable GitHub secret scanning + push protection on this repo.
# Safe to re-run. Requires: gh CLI logged in with admin rights on the repo.
set -euo pipefail

REPO="${REPO:-fayaz-shaik-01/fayazlabs-web}"

gh api -X PATCH "repos/${REPO}" \
  -F 'security_and_analysis[secret_scanning][status]=enabled' \
  -F 'security_and_analysis[secret_scanning_push_protection][status]=enabled' \
  --silent

gh api "repos/${REPO}" --jq '.security_and_analysis | {secret_scanning: .secret_scanning.status, push_protection: .secret_scanning_push_protection.status}'
