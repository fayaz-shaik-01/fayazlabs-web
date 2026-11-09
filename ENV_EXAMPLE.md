# Frontend Environment Variables

Create a `.env.local` file in the `fayazlabs-web` directory with:

```bash
# Local development
NEXT_PUBLIC_PLATFORM_URL=http://localhost:8080

# Production (Vercel deployment)
# NEXT_PUBLIC_PLATFORM_URL=https://fayazlabs-platform-HASH-el.a.run.app
```

## Notes

- **NEXT_PUBLIC_** prefix is required for Next.js to expose variables to the browser
- `PLATFORM_URL` is used in `src/lib/api.ts` to make requests to the backend
- In Vercel dashboard, set this as an environment variable (no need for `.env.local` file there)
- The value should be the deployed platform URL from GCP Cloud Run

## Course, billing and feature flags

```bash
# Catalog JSON for /learning/ai-product-testing (server-side fetched, cached 5 min).
# Unset = use src/lib/course/fixtures/catalog.json
# NEXT_PUBLIC_CATALOG_URL=https://cdn.example.com/ai-product-testing/catalog.json

# Run the UI against an in-browser mock of the backend (no backend needed).
# Mock rules are documented at the top of src/lib/course-api/mock.ts.
# NEXT_PUBLIC_API_MOCK=1

# CDN/bucket origin for lesson media; added to CSP media-src and connect-src.
# NEXT_PUBLIC_MEDIA_ORIGIN=https://media.example.com

# Optional product routes, all OFF by default (1 or true to enable):
# NEXT_PUBLIC_FEATURE_FLASHCARDS=1
# NEXT_PUBLIC_FEATURE_PRACTICE=1
# NEXT_PUBLIC_FEATURE_FORMULAS=1
# NEXT_PUBLIC_FEATURE_EXAM=1
# NEXT_PUBLIC_FEATURE_KNOWLEDGE_GRAPH=1
# NEXT_PUBLIC_FEATURE_DASHBOARD=1
# NEXT_PUBLIC_FEATURE_TAX=1
```

The Content-Security-Policy is built in `src/lib/security-headers.ts` and served from
`next.config.ts` (it moved out of `vercel.json` so it can read these variables).
