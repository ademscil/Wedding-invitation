# WedInvite - Undangan Pernikahan Digital

Platform SaaS undangan pernikahan digital yang memungkinkan pasangan membuat, mengelola, dan membagikan undangan pernikahan secara online.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Auth:** NextAuth.js v4
- **API:** tRPC v10
- **State:** Zustand
- **Forms:** React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client & create database
npx prisma generate
npx prisma db push

# Seed database with templates
npx prisma db seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

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
