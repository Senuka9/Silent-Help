# Silent Help — Backend

Next.js 15 API backend with Prisma ORM, PostgreSQL, Redis, and cloud AI providers.

## Tech Stack

- **Framework** — Next.js 15 (API Routes)
- **ORM** — Prisma with PostgreSQL
- **Cache / Queue** — Redis, pg-boss
- **AI** — Google Gemini (`@google/genai`), OpenAI
- **Auth** — Clerk JWT verification + guest JWT
- **Validation** — Zod
- **Logging** — Pino

## Getting Started

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Runs on `http://localhost:4000` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `CLERK_SECRET_KEY` | Clerk secret for JWT verification |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `JWT_SECRET` | Secret for guest JWT signing |
| `ENCRYPTION_KEY` | AES-256 key for field encryption |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 4000 |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

Deployed to Vercel. Image optimization is disabled to avoid bundling `sharp`. AI mode defaults to `cloud` to stay within the 250 MB serverless function limit.
