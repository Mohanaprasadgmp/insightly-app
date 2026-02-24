# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Insightly is a Next.js 14 SaaS application for marketing agencies to automate client reporting. It connects to data sources (GA4, Meta Ads, Google Ads, etc.), generates AI-powered narrative summaries using Claude, and delivers white-labeled PDF reports to clients.

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Build & lint
npm run build
npm run lint

# Database (Prisma + Supabase PostgreSQL)
npm run db:push      # Push schema changes to the database (no migration file)
npm run db:generate  # Regenerate Prisma Client after schema changes
npm run db:studio    # Open Prisma Studio GUI
```

> There is no test suite yet.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in values. Required vars:
- `DATABASE_URL` / `DIRECT_URL` — Supabase PostgreSQL (pooled vs. direct)
- `AUTH_SECRET` — NextAuth secret (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth provider
- `ANTHROPIC_API_KEY` — Claude AI for report narrative generation
- Stripe vars for subscription billing

## Architecture

### App Router Structure

- `app/(auth)/` — Public login/signup pages (credentials + Google OAuth)
- `app/(dashboard)/` — Protected routes (dashboard, clients, reports, integrations, settings), guarded by `DashboardLayout` which checks `useSession()`
- `app/api/auth/[...nextauth]/` — NextAuth catch-all handler
- `app/api/auth/signup/` — Custom credentials signup endpoint

### Auth

Auth is handled by **NextAuth v5 (beta)** with the **Prisma adapter** and **JWT session strategy**. Configuration lives in `lib/auth.ts`. The `session.user.id` is injected via JWT callbacks and typed in `types/next-auth.d.ts`. Two providers: Google OAuth and email/password credentials (bcryptjs hashing).

### Database

**Prisma ORM** against **Supabase PostgreSQL**. The singleton client is in `lib/db.ts` (prevents HMR duplication). Schema in `prisma/schema.prisma`.

Key domain model relationships:
- `User` ↔ `Agency` via `AgencyMember` (many-to-many, with roles: OWNER/ADMIN/MEMBER)
- `Agency` → `Client` → `DataSource` (per-client integrations)
- `Agency` → `Report` → `ReportSection` (ordered sections with raw data + AI narrative)
- `Agency` has Stripe subscription fields (`planTier`: FREE/STARTER/PROFESSIONAL/ENTERPRISE)

### UI

- **Radix UI** primitives with **shadcn/ui** patterns in `components/ui/`
- **Tailwind CSS** with a custom `brand` color scale (indigo-based, `brand-500 = #6366f1`) and CSS variable theming. Always use `cn()` from `lib/utils.ts` for conditional class merging.
- App is always in **dark mode** (`<html class="dark">` is hardcoded)
- Layout: collapsible `Sidebar` + `TopNav` wrapping a scrollable `<main>`

### AI Integration

`@anthropic-ai/sdk` is installed. Report narrative generation targets the `summary` field on `Report` and `narrative` fields on `ReportSection`. Claude is invoked server-side via API routes (not yet fully implemented).

### Path Aliases

`@/` maps to the project root (configured in `tsconfig.json`).
