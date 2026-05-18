# Bolao Copa do Mundo FIFA 2026

## Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- PostgreSQL 16 + Prisma ORM
- NextAuth.js v5 beta (credentials + Google OAuth)
- Docker + Docker Compose on Hostinger VPS KVM 2 (2 vCPU, 8GB RAM)
- Domain: bolao.bubhug.com

## Commands
- `npm run dev` — development server (localhost:3000)
- `npm run build` — production build
- `npx prisma migrate dev` — run migrations
- `npx prisma studio` — database UI (localhost:5555)
- `npx prisma db seed` — seed initial match data
- `docker compose -f docker-compose.prod.yml up -d` — start production containers

## Conventions
- **Code in English** (variables, functions, types, API routes, database columns)
- **UI text in Brazilian Portuguese (PT-BR) only** — all user-facing strings
- Mobile-first (design for 375px, then scale up)
- Server Components by default — "use client" only for interactive elements
- API Routes in /api with Zod validation on every input
- File names in kebab-case
- React components in PascalCase
- Dark theme mandatory (FIFA 2026 official color palette)

## Architecture
- Single pool model: one pool, one admin, all users participate in the same pool
- `src/app/(public)/` — public routes (landing, login, register)
- `src/app/(app)/` — authenticated participant routes
- `src/app/(admin)/` — admin-only routes
- `src/app/api/` — API routes

## Important Business Rules
- Predictions lock exactly 10 minutes before match kickoff
- After lock: all predictions from all participants become publicly visible
- Payment via static PIX QR code — admin approves manually
- Mercado Pago webhook for auto-approval (configured last)
- Balanced scoring = odds-based base points + bonuses
- Odds fetched automatically from The Odds API / API-Football
- Admin can override odds manually before match starts
- No mata-mata between participants (out of scope v1)

## FIFA 2026 Color Palette (Dark Theme)
- Background: #0a1628 to #0d2137 (gradient)
- Card bg: rgba(255,255,255,0.05)
- Primary green: #3CAC3B
- Blue accent: #2A398D
- Red accent: #E61D25
- Gold: #C9A84C
- Text primary: #FFFFFF
- Text secondary: #94a3b8

## Never Do
- Never expose CRON_SECRET, DB credentials, or API keys
- Never skip Zod validation in API routes
- Never allow prediction changes after lock time
- Never approve payment without admin action (until Mercado Pago webhook is set up)
