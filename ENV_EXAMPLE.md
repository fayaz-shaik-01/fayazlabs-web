# Frontend Environment Variables

Create a `.env.local` file in the `fayazlabs-web` directory with:

```bash
# Local development
NEXT_PUBLIC_PLATFORM_URL=http://localhost:8080

# Production (Vercel deployment)
# NEXT_PUBLIC_PLATFORM_URL=https://fayazlabs-platform.onrender.com
```

## Notes

- **NEXT_PUBLIC_** prefix is required for Next.js to expose variables to the browser
- `PLATFORM_URL` is used in `src/lib/api.ts` to make requests to the backend
- In Vercel dashboard, set this as an environment variable (no need for `.env.local` file there)
- The value should be the deployed platform URL from Render
