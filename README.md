# NaliGrid

[![CI](https://github.com/app-eventgrid/eventgrid/actions/workflows/ci.yml/badge.svg)](https://github.com/app-eventgrid/eventgrid/actions/workflows/ci.yml)
[![X / Twitter](https://img.shields.io/badge/X-%40naligrid-000000?style=flat&logo=x)](https://twitter.com/naligrid)
[![Instagram](https://img.shields.io/badge/Instagram-%40naligrid-E4405F?style=flat&logo=instagram)](https://www.instagram.com/naligrid/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-naligrid-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/company/naligrid)
[![TikTok](https://img.shields.io/badge/TikTok-%40naligrid-000000?style=flat&logo=tiktok)](https://www.tiktok.com/@naligrid)
[![Facebook](https://img.shields.io/badge/Facebook-naligrid-1877F2?style=flat&logo=facebook)](https://facebook.com/naligrid)

A multi-role SaaS platform for the event industry in Nigeria. Replaces WhatsApp threads, Excel sheets, and phone-call confirmations with one unified platform covering the full event lifecycle — from first client inquiry through to post-event analysis.

## Tech Stack

| Layer           | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| Frontend        | React 19 + Vite 8 + TypeScript 6                             |
| Styling         | Vanilla CSS + CSS Modules (CSS custom properties)            |
| State           | Zustand 5                                                     |
| Backend         | Supabase (Auth + PostgreSQL + Realtime + Storage + Edge Functions) |
| Payments        | Paystack + Korapay (dual Nigerian gateways)                   |
| PDF Export      | @react-pdf/renderer, jspdf + jspdf-autotable                  |
| Drag & Drop     | @dnd-kit                                                      |
| Charts          | Recharts                                                      |
| Forms           | React Hook Form + Zod                                         |
| Spreadsheets    | xlsx, papaparse (CSV import/export)                           |
| Animations      | framer-motion, react-konva (canvas)                          |
| Monitoring      | Sentry, Vercel Analytics + Speed Insights                     |
| Testing         | Vitest (unit), Playwright (E2E), GitHub Actions (CI)          |
| CAPTCHA         | Cloudflare Turnstile                                          |
| Push            | Web Push API + PWA (service worker, manifest)                 |
| Mobile          | Expo SDK 54 (iOS + Android companion app)                     |
| Deployment      | Vercel (web) + EAS (mobile)                                   |

## Features

- **Role-Based Access** — Planner, Coordinator, Vendor, Client, Team Member, Admin — everyone sees only what they need
- **9-Phase Event Pipeline** — From lead onboarding to post-event analysis
- **Payment Tracker** — Naira-based tracking replacing Excel, visible only to the planner
- **Live Event Board** — Real-time status monitoring on event day via Supabase Realtime
- **Vendor Management** — Global vendor directory, sourcing, quotes, booking, payments, claims, merge, and portal access
- **Task Board** — Kanban-style + list view, drag-and-drop, CSV bulk upload
- **Guest Management** — List, RSVP, seating planner (drag-and-drop tables), CSV import, check-in
- **Client Portal** — Token-based read-only view for clients (no account required)
- **Aftermath & Reports** — Media library, issue log, PDF report generation
- **Budget Management** — Budget categories, allocations, petty cash, P&L summary, Excel/PDF export
- **Proposals** — Create, manage, and track client proposals
- **Questionnaires** — Client intake forms and questionnaires
- **Leads** — Lead tracking and pipeline management
- **Invoicing** — Invoice generation and management
- **Referrals** — Referral partner tracking with commission management
- **Notifications** — In-app notification center with real-time push notifications (Web Push + PWA badge)
- **Chat & Feedback** — Integrated feedback chat per event
- **Calendar** — Event calendar view
- **Checklists** — Per-event checklists
- **Notebook** — Event notes and journaling
- **Asset Management** — Event media and document library
- **Reviews** — Post-event review collection
- **Admin Dashboard** — Super admin analytics, event/vendor oversight, team management
- **Mobile Companion App** — Expo/React Native app for iOS and Android
- **Dual Payment Providers** — Paystack and Korapay supported
- **Automated Archiving** — Background archiving of completed events
- **E2E Testing** — Playwright test suite covering auth flows and core journeys

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- Paystack account (test keys)

### Installation

```bash
# Clone the repo
git clone <repo-url> eventgrid
cd eventgrid

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase and Paystack keys

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=           # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Your Supabase anon/public key
VITE_PAYSTACK_PUBLIC_KEY=    # Paystack public key (live or test)
VITE_KORAPAY_PUBLIC_KEY=     # Korapay public key
```

## Theme

NaliGrid supports both dark and light themes:

- **Dark** (default) — `#111827` base background with gold (#D4A017) accents
- **Light** — `#f5f2eb` base background with matching light surfaces

Toggle via the sun/moon icon in the top bar. Theme is persisted via the `data-theme` attribute on `<html>`.

All design tokens are defined in `src/styles/tokens.css` using CSS custom properties. The light theme overrides surface, text, border, and shadow variables while keeping brand colors consistent.

## Project Structure

```
eventgrid/
├── apps/
│   └── mobile/                # Expo/React Native companion app
├── packages/
│   └── shared/                # Shared types, utils, design tokens (web + mobile)
├── public/
│   ├── sw.js                  # Service worker (push notifications)
│   ├── manifest.json
│   └── site.webmanifest
├── supabase/
│   ├── migrations/            # 130+ database migration SQL files
│   ├── functions/             # 26 Edge Functions (webhooks, invites, archiving, AI)
│   │   ├── paystack-webhook/
│   │   ├── korapay-webhook/
│   │   ├── send-invite/
│   │   ├── auto-archive/
│   │   ├── generate-report-narrative/
│   │   └── ...
│   └── seed.sql               # Comprehensive demo data
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/                # Reusable primitives (buttons, inputs, badges)
│   │   ├── layout/            # Shell, sidebar, header, mobile nav
│   │   ├── planner/           # Planner-specific components
│   │   ├── coordinator/       # Coordinator-specific components
│   │   ├── vendor/            # Vendor portal components
│   │   ├── client/            # Client portal components
│   │   └── shared/            # Cross-role components
│   ├── pages/
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── planner/
│   │   ├── coordinator/
│   │   ├── vendor/
│   │   ├── client/
│   │   └── admin/             # Admin dashboard pages
│   ├── features/
│   │   ├── events/
│   │   ├── financials/        # Budget, P&L, petty cash, CSV/Excel/PDF export
│   │   ├── vendors/
│   │   ├── team/
│   │   ├── guests/            # RSVP, seating planner, check-in
│   │   ├── live-board/        # Real-time event day ops
│   │   ├── aftermath/         # Post-event reports, media library
│   │   ├── notifications/     # In-app + push notifications
│   │   ├── proposals/
│   │   ├── questionnaires/
│   │   ├── leads/
│   │   ├── invoicing/
│   │   ├── referrals/
│   │   ├── reviews/
│   │   ├── checklists/
│   │   ├── notebook/
│   │   ├── calendar/
│   │   ├── assets/
│   │   └── chat/
│   ├── hooks/
│   ├── store/                 # Zustand stores
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── korapay.ts         # Korapay integration
│   │   ├── paystack.ts        # Paystack integration
│   │   ├── payment.ts         # Unified payment abstraction
│   │   ├── notifications.ts   # In-app notification system
│   │   ├── webPush.ts         # Web Push subscription
│   │   ├── edgeFunctions.ts   # Edge Function invocation wrappers
│   │   ├── sentry.ts          # Error tracking
│   │   ├── captcha.tsx        # Cloudflare Turnstile integration
│   │   ├── pricing.ts         # Pricing configuration
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   └── styles/
│       ├── tokens.css         # Design tokens (dark + light themes)
│       ├── global.css         # Resets, base styles, typography
│       └── components.css     # Shared component classes
├── test/
│   └── e2e/                   # Playwright end-to-end tests
├── load-tests/                # Performance smoke tests
├── playwright.config.ts
├── .env.local
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## User Roles

| Role                     | Entry                          | Access Level                           |
| ------------------------ | ------------------------------ | -------------------------------------- |
| Planner                  | Self-register (pays per event) | Full suite + financials                |
| Coordinator (Invited)    | Invited by planner             | Team ops + live board                  |
| Coordinator (Standalone) | Self-register                  | Team ops + live board, no financials   |
| Vendor                   | Invited by planner             | Own deliverables, claims, arrival      |
| Client                   | Invited by planner             | Read-only phase visibility + approvals |
| Super Admin              | Internal                       | Full platform oversight                |
| Admin Monitor            | Internal                       | Read-only analytics & reports          |
| Admin Support            | Internal                       | Event-level support access             |
| Referral Partner         | Self-register                  | Referral tracking + commissions        |

## The 9 Event Phases

1. Lead & Client Onboarding
2. Event Planning & Strategy
3. Vendor Management
4. Team Coordination
5. Guest Management
6. Pre-Event Finalization
7. Event Day Operations (Live Board)
8. Event Closeout
9. Post-Event Analysis

## Payment System

NaliGrid supports two payment providers:

- **Paystack** — Inline popup integration. Loads `js.paystack.co/v1/inline.js` on demand.
- **Korapay** — Checkout modal integration. Loads Korapay collections script on demand.

Both are abstracted behind a unified `processPayment()` function in `src/lib/payment.ts`. The provider can be selected per transaction.

### Pricing (Planner Events)

Flat activation fee of ₦20,000 per event.

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # TypeScript check + production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run typecheck # TypeScript type checking (no emit)
npx vitest        # Run unit tests (Vitest)
npx playwright test  # Run E2E tests (Playwright)
```

## Architecture

NaliGrid is a React SPA powered entirely by Supabase — no custom API server:

```
Browser (React + Vite)
    ├── Supabase Auth        → JWT-based auth, role in user_metadata
    ├── Supabase Database    → PostgreSQL with Row Level Security
    ├── Supabase Realtime    → Live event board subscriptions
    ├── Supabase Storage     → Photos, documents, receipts
    └── Supabase Edge Functions → Paystack webhook, invite emails, PDF gen
```

### Key Constraints

- Financial data is planner-admin only (RLS + frontend route guard)
- Client portal is read-only, token-based, no auth required
- Vendor access is event-scoped
- Mobile-first — all interactive components usable on 390px screens
- Issues are append-only — never deleted, resolved issues stay in the log
- Currency is ₦ (Naira), dates are DD/MM/YYYY, phone numbers +234
- Payment webhooks use idempotency keys to prevent double-processing
- Completed events are automatically archived via cron-based Edge Function

## Supabase Setup

### Database

See `doc/02_DATABASE_SCHEMA.md` for the full schema including:

- 17+ table definitions with RLS policies
- Auto-update triggers
- Profile creation trigger
- Event phases auto-creation trigger
- Storage bucket configuration
- Activity logging triggers
- Vendor merge RPC

Run the SQL migrations in order via the Supabase SQL editor or `supabase migration` CLI.

### Edge Functions

26 Supabase Edge Functions handle server-side logic:

| Function | Purpose |
| -------- | ------- |
| `paystack-webhook` | Paystack payment callbacks (idempotent) |
| `korapay-webhook` | Korapay payment webhook |
| `send-invite` | Invite emails via Resend (HTML templates) |
| `auto-archive` | Cron-based background archiving of old events |
| `send-push-notification` | Web Push notification dispatch |
| `generate-report-narrative` | AI-powered report narration (Gemini API) |
| `guest-rsvp` | Guest RSVP processing |
| `confirm-signup` | Post-signup account setup |
| `onboarding-emails` | Onboarding email sequences |
| `brevo-*` | Brevo email campaign integrations |

### Demo Data

Run `supabase/seed.sql` to populate the database with sample data (5 events, 12 vendors, tasks, guests, media, financial entries, etc.).

## Testing

### Unit Tests (Vitest)

```bash
npx vitest run       # Run all unit tests
npx vitest           # Watch mode
```

Unit tests use `jsdom` environment with `@testing-library/jest-dom` matchers. Test files live in `src/test/`.

### E2E Tests (Playwright)

```bash
npx playwright test           # Run all E2E tests
npx playwright test --ui      # UI mode for debugging
npx playwright show-report    # View HTML report
```

E2E tests live in `src/test/e2e/` and cover:
- **Auth flows** — Login, registration, password reset (via Supabase magic links, bypassing CAPTCHA in test env)
- **Public pages** — Home, login, register, 404, RSVP
- **Authenticated flows** — Dashboard, events, financials

Tests run sequentially (1 worker) against a production build served via `npm run preview`.

### Performance Tests

```bash
node load-tests/api-smoke.mjs
```

Simple load test against the Supabase REST API (10 concurrent users × 20 requests, measures avg/p95/p99 response times).

### CI Pipeline

GitHub Actions runs on push/PR to `main`:
1. TypeScript check (`tsc --noEmit`)
2. Production build
3. Unit tests (`vitest run`)
4. E2E tests (`playwright test`)

Playwright reports are uploaded as artifacts on failure.

## Mobile App

NaliGrid includes a companion mobile app built with Expo SDK 54:

```bash
cd apps/mobile
npx expo start        # Start Expo dev server
npx expo run:ios      # Build for iOS
npx expo run:android  # Build for Android
```

The mobile app shares types, utilities, and design tokens with the web app via the `@naligrid/shared` package.

## Connect

| Platform        | Link                                              |
| --------------- | ------------------------------------------------- |
| **Instagram**   | [@naligrid](https://www.instagram.com/naligrid/)  |
| **TikTok**      | [@naligrid](https://www.tiktok.com/@naligrid)     |
| **Facebook**    | [naligrid](https://facebook.com/naligrid)         |
| **X / Twitter** | [@naligrid](https://twitter.com/nalugrid)         |
| **LinkedIn**    | [naligrid](https://linkedin.com/company/naligrid) |

## License

Proprietary — All rights reserved. See [LICENSE.md](LICENSE.md).

© 2024-2026 NaliTech Consults Limited.

---

Built for Nigerian event professionals.
