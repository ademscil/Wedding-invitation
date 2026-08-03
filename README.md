# WedInvite - Undangan Pernikahan Digital

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/ademscil/Wedding-invitation/actions/workflows/ci.yml/badge.svg)](https://github.com/ademscil/Wedding-invitation/actions/workflows/ci.yml)

Platform SaaS undangan pernikahan digital yang memungkinkan pasangan membuat, mengelola, dan membagikan undangan pernikahan secara online.

Open source under the [MIT License](LICENSE) — contributions welcome, see [Contributing](#contributing) below.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** PostgreSQL via Prisma ORM (driver adapter: `@prisma/adapter-pg`)
- **Auth:** NextAuth.js v4
- **API:** tRPC v10
- **State:** Zustand
- **Forms:** React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A PostgreSQL database (free options: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/storage/postgres))

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables and fill in DATABASE_URL with your Postgres connection string
cp .env.example .env.local

# Generate Prisma client & push schema to your database
npx prisma generate
npx prisma db push

# Seed database with templates
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values you need. The app runs locally with only `DATABASE_URL` and `NEXTAUTH_SECRET` set — everything else is optional and degrades gracefully when left empty.

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Always | PostgreSQL connection string (Neon, Supabase, Vercel Postgres, or self-hosted) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Always | `openssl rand -base64 32` to generate a secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in | From Google Cloud Console OAuth credentials |
| `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | Google sign-in | Set to `"true"` to show the Google button once credentials are set |
| `UPLOADTHING_TOKEN` | Photo/music upload | From [uploadthing.com](https://uploadthing.com/dashboard) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Email notifications | From [resend.com](https://resend.com/api-keys) |
| `MIDTRANS_SERVER_KEY` / `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Paid subscriptions | Sandbox keys from [Midtrans dashboard](https://dashboard.sandbox.midtrans.com/settings/access-keys) |

## Project Structure

```
src/
  app/              # Next.js App Router pages
    (marketing)/    # Landing page & pricing
    (auth)/         # Login & register
    (dashboard)/    # User dashboard
    (invitation)/   # Public invitation pages
    api/            # API routes (auth, tRPC)
  components/       # React components
    ui/             # Base UI components
    marketing/      # Landing page components
    dashboard/      # Dashboard components
    invitation/     # Invitation sections
  templates/        # Wedding invitation templates
  server/           # tRPC server & routers
  lib/              # Utilities, auth, validation
  hooks/            # Custom React hooks
  stores/           # Zustand state stores
  types/            # TypeScript types
prisma/
  schema.prisma     # Database schema
  seed.ts           # Template seed data
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run type-check` | TypeScript type check |

## Branching Strategy & CI/CD

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code only | Vercel Production (`saas-wedding-two.vercel.app`) |
| `staging` | Pre-production integration testing | Vercel Preview deployment |
| `development` | Active day-to-day development | Vercel Preview deployment |
| `claude/*`, feature branches | Short-lived work branches | Vercel Preview deployment (PR into `development`) |

Workflow:
1. Branch off `development` for new work, open a PR back into `development`.
2. Periodically merge `development` → `staging` to validate a release candidate.
3. Merge `staging` → `main` to ship to production.

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, type-check, unit tests, and a production build on every push/PR to `main`, `staging`, and `development`. Vercel's Git integration automatically deploys pushes to `main` to Production and all other branches/PRs as Preview deployments.

## Features

- Multiple premium wedding invitation templates
- RSVP management with guest tracking
- Digital envelope (bank transfer details)
- Photo gallery & love story timeline
- Countdown timer
- Guestbook / wishes
- Background music
- WhatsApp sharing with OG preview
- Analytics dashboard
- Multi-tier subscription (Free, Starter, Premium, Business)

## Contributing

Contributions are welcome!

1. Fork the repo and create a feature branch
2. Run `npm run lint`, `npm run type-check`, and `npm test` before opening a PR
3. Open a pull request describing the change

Please don't commit real API keys or secrets — use `.env.example` as the template and keep `.env.local` untracked.

## License

This project is licensed under the [MIT License](LICENSE).
