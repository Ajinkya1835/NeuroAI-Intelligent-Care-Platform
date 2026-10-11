# NeuroAI Intelligent Care Platform

NeuroAI is a full-stack platform for autism care workflows. It combines caregiver/therapist dashboards, behavior tracking, routines, insights, guided learning/teaching modules, and optional AI-assisted analysis.

## Repository Overview

This repository contains multiple apps:

- `main/` — Primary care platform UI (Next.js) used by parents and therapists.
- `neuroai-backend/` — Express + MongoDB API used by the `main` app.
- `neuro_website/` — Separate marketing/information site (Next.js).
- `neuroai-upgrade-v2/` and zipped files — archived/upgrade artifacts, not required for local development.

## Core Features (`main` + `neuroai-backend`)

- Role-based login for **Parent** and **Therapist**
- Child profile and care timeline
- Episode logging and search
- Routine planning and daily tracking
- Pattern and insights views
- Activities planning and feedback
- Parent learning hub
- Home teaching worksheets, scoring, and submission history
- Therapist caseload, goals, private notes, and milestones
- Optional Ollama-backed AI analysis/chat with fallback behavior when unavailable

## Tech Stack

- **Frontend (`main`)**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend (`neuroai-backend`)**: Node.js, Express, Mongoose, JWT auth, Multer, PDFKit
- **Database**: MongoDB
- **Monorepo orchestration**: npm scripts from repository root

## Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- npm 9+
- MongoDB running locally or reachable via connection string

## Quick Start (Primary Platform)

From repository root:

```bash
npm run setup
cp neuroai-backend/.env.example neuroai-backend/.env
cp main/.env.example main/.env.local
npm run dev
```

What this does:

- Installs root + backend + frontend dependencies
- Seeds demo data (`npm run seed`)
- Starts backend on `http://localhost:5000`
- Starts frontend (`main`) on `http://localhost:3000`

## Demo Login (after seed)

Default seed password: `password123` (or `SEED_PASSWORD` from backend env).

- Parent: `goon@example.com`
- Therapist: `dr.ajinkya@neurocare.com`

## Environment Variables

### `neuroai-backend/.env`

Based on `neuroai-backend/.env.example`:

- `PORT` (default `5000`)
- `MONGO_URI` (default `mongodb://127.0.0.1:27017/neuroai`)
- `CORS_ORIGIN` (default `http://localhost:3000`)
- `OLLAMA_URL` (optional; if empty, AI routes fall back where implemented)
- `OLLAMA_MODEL` (default `llama3`)
- `JWT_SECRET` (required for secure deployments)
- `JWT_TTL` (default `7d`)
- `AUTO_SEED` (`true` by default)
- `SEED_PASSWORD` (default `password123`)

### `main/.env.local`

Based on `main/.env.example`:

- `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`)
- `NEXT_PUBLIC_SHOW_DEMO_HINT` (optional; set `false` to hide demo hint)

## Useful Scripts

### Root

- `npm run setup` — install dependencies for root, backend, and main frontend
- `npm run dev` — seed and run backend + main frontend together
- `npm run backend` — run backend only
- `npm run frontend` — run `main` frontend only
- `npm run seed` — run backend seed script
- `npm run seed:reset` — reseed with reset (`--force`)

### `main`

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### `neuroai-backend`

- `npm run start`
- `npm run seed`

### `neuro_website`

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## API Surface (high level)

The backend exposes authenticated `/api` routes for:

- Auth: `/api/auth/login`, `/api/auth/me`
- Child and care data: `/api/children/*`
- Episodes, routines, activities, notes, team, goals, contacts
- Insights and AI routes
- Learning module routes
- Teaching module routes (including worksheet PDF and submission file access)
- Health check: `/api/health`

## Notes

- Most `/api` routes require a valid JWT bearer token.
- Access checks enforce parent ownership and therapist grants.
- Seed process is designed to be non-destructive by default.
- `neuro_website` is independent from the main care platform app.

