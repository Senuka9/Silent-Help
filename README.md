# Silent Help

A private, pathway-aware mental health companion. Encrypted journalling, AI support, offline-first calm tools, and a crisis safety net.

## Project Structure

```
silent-help/
├── frontend/   → Next.js 15 (React 19, TailwindCSS 4, Clerk Auth)
├── backend/    → Next.js 15 API (Prisma, PostgreSQL, Redis, Gemini/OpenAI)
└── vercel.json → Deployment config
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Clerk account (authentication)
- Google Gemini or OpenAI API key

### 1. Install dependencies

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in the required values.

### 3. Run locally

```bash
# Backend (port 4000)
cd backend && npm run dev

# Frontend (port 3000)
cd frontend && npm run dev
```

## Key Features

- **Pathway intelligence** — routes users to HIGH, MID, or LOW support based on assessment
- **Crisis safety net** — offline-first SOS page with geo-aware helplines, zero AI in crisis mode
- **Encrypted journal** — AES-256-GCM field encryption, PII scrubbing before AI calls
- **AI companion** — streaming chat with Gemini/OpenAI, emotion-aware personality
- **Clinical check-ins** — validated PHQ-9 and GAD-7 screeners with safety nudges
- **Calm tools** — box breathing, grounding, body scan, TIPP, and more
- **On-device AI** — optional browser-side CBT distortion detection (WebGPU/WASM)
- **GDPR compliance** — consent gate, data export, retention controls, right to erasure

## Deployment

Frontend and backend are deployed separately on Vercel. See each subfolder's README for details.

## License

Private — all rights reserved.
