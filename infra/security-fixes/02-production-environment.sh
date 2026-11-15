#!/usr/bin/env bash
# F-19: create the protected "production" GitHub environment used by ingest-content.yml,
# limited to deployments from main. Safe to re-run (PUT is idempotent).
# Requires gh logged in with admin rights. Never prints secret values.
#
# Optional: REVIEWER_ID=<numeric GitHub user id> to require that reviewer's approval
#           (find it with: gh api users/<login> --jq .id)
set -euo pipefail

REPO="${REPO:-fayaz-shaik-01/fayazlabs-web}"
ENV_NAME="production"

if [ -n "${REVIEWER_ID:-}" ]; then
  gh api -X PUT "repos/${REPO}/environments/${ENV_NAME}" \
    -F "reviewers[][type]=User" -F "reviewers[][id]=${REVIEWER_ID}" \
    -F 'deployment_branch_policy[protected_branches]=false' \
    -F 'deployment_branch_policy[custom_branch_policies]=true' --silent
else
  gh api -X PUT "repos/${REPO}/environments/${ENV_NAME}" \
    -F 'deployment_branch_policy[protected_branches]=false' \
    -F 'deployment_branch_policy[custom_branch_policies]=true' --silent
fi

# Allow only main to use the environment (ignore "already exists" on re-run).
gh api -X POST "repos/${REPO}/environments/${ENV_NAME}/deployment-branch-policies" \
  -f name=main -f type=branch --silent 2>/dev/null || true

echo "Environment '${ENV_NAME}' ready for ${REPO}."
echo "Next, add the secrets to it WITHOUT echoing values, e.g.:"
echo "  gh secret set PLATFORM_URL --env ${ENV_NAME} --repo ${REPO}          # prompts for the value"
echo "  gh secret set ADMIN_INGEST_SECRET --env ${ENV_NAME} --repo ${REPO}   # prompts for the (rotated) value"
echo "Then delete the same-named repository-level secrets:"
echo "  gh secret delete PLATFORM_URL --repo ${REPO}; gh secret delete ADMIN_INGEST_SECRET --repo ${REPO}"
