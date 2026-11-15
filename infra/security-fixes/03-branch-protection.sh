#!/usr/bin/env bash
# Protect main: PRs required, the CI "checks" job must pass, no force-push or deletion.
# Safe to re-run. Requires gh logged in with admin rights. Run AFTER ci.yml has run once on main.
set -euo pipefail

REPO="${REPO:-fayaz-shaik-01/fayazlabs-web}"
BRANCH="${BRANCH:-main}"

gh api -X PUT "repos/${REPO}/branches/${BRANCH}/protection" --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["checks"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0, "dismiss_stale_reviews": true },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
echo "Branch protection set on ${REPO}@${BRANCH}."
