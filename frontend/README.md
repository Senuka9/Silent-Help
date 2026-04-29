# Silent Help — Frontend

Next.js 15 client application with React 19, TailwindCSS 4, and Clerk authentication.

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **UI** — React 19, TailwindCSS 4, Radix UI, Framer Motion
- **Auth** — Clerk (`@clerk/nextjs`)
- **Charts** — Recharts
- **Icons** — Lucide React
- **Notifications** — Sonner

## Getting Started

```bash
npm install
npm run dev
```

Runs on `http://localhost:3000` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_API_URL` | Backend API URL (used for rewrites) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

Deployed to Vercel. The `next.config.ts` includes API rewrites to proxy `/api/*` requests to the backend, and `outputFileTracingExcludes` to keep serverless bundles under the 250 MB limit.
