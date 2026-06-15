# EventGrid

[![CI](https://github.com/app-eventgrid/eventgrid/actions/workflows/ci.yml/badge.svg)](https://github.com/app-eventgrid/eventgrid/actions/workflows/ci.yml)

A multi-role SaaS platform for the event industry in Nigeria. Replaces WhatsApp threads, Excel sheets, and phone-call confirmations with one unified platform covering the full event lifecycle — from first client inquiry through to post-event analysis.

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Frontend    | React 19 + Vite 8                                 |
| Styling     | Vanilla CSS + CSS Modules (CSS custom properties) |
| State       | Zustand 5                                         |
| Backend     | Supabase (Auth + PostgreSQL + Realtime + Storage) |
| Payments    | Paystack + Flutterwave                            |
| PDF Export  | @react-pdf/renderer                               |
| Drag & Drop | @dnd-kit                                          |
| Charts      | Recharts                                          |
| Forms       | React Hook Form + Zod                             |
| Deployment  | Vercel                                            |

## Features

- **Role-Based Access** — Planner, Coordinator, Vendor, Client, Team Member — everyone sees only what they need
- **9-Phase Event Pipeline** — From lead onboarding to post-event analysis
- **Payment Tracker** — Naira-based tracking replacing Excel, visible only to the planner
- **Live Event Board** — Real-time status monitoring on event day via Supabase Realtime
- **Vendor Management** — Sourcing, quotes, booking, payments, and portal access
- **Task Board** — Kanban-style task management per event
- **Guest Management** — List, RSVP, seating plan, CSV import, check-in
- **Client Portal** — Token-based read-only view for clients (no account required)
- **Aftermath & Reports** — Media library, issue log, PDF report generation
- **Dual Payment Providers** — Paystack and Flutterwave supported

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- Paystack account (test keys)
- Flutterwave account (test keys)

### Installation

```bash
# Clone the repo
git clone <repo-url> eventgrid
cd eventgrid

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase, Paystack, and Flutterwave keys

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=           # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Your Supabase anon/public key
VITE_PAYSTACK_PUBLIC_KEY=    # Paystack public key (live or test)
VITE_FLUTTERWAVE_PUBLIC_KEY= # Flutterwave public key (live or test)
```

## Theme

EventGrid supports both dark and light themes:

- **Dark** (default) — `#111827` base background with gold (#D4A017) accents
- **Light** — `#f5f2eb` base background with matching light surfaces

Toggle via the sun/moon icon in the top bar. Theme is persisted via the `data-theme` attribute on `<html>`.

All design tokens are defined in `src/styles/tokens.css` using CSS custom properties. The light theme overrides surface, text, border, and shadow variables while keeping brand colors consistent.

## Project Structure

```
eventgrid/
├── public/
├── supabase/
│   └── migrations/            # Database migration SQL files
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
│   │   └── client/
│   ├── features/
│   │   ├── events/
│   │   ├── financials/
│   │   ├── vendors/
│   │   ├── team/
│   │   ├── guests/
│   │   ├── live-board/
│   │   ├── aftermath/
│   │   └── notifications/
│   ├── hooks/
│   ├── store/                 # Zustand stores
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── paystack.ts        # Paystack integration
│   │   ├── flutterwave.ts     # Flutterwave integration
│   │   ├── payment.ts         # Unified payment abstraction
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   └── styles/
│       ├── tokens.css         # Design tokens (dark + light themes)
│       ├── global.css         # Resets, base styles, typography
│       └── components.css     # Shared component classes
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
| Vendor                   | Invited by planner             | Own deliverables + arrival only        |
| Client                   | Invited by planner             | Read-only phase visibility + approvals |

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

EventGrid supports two payment providers:

- **Paystack** — Inline popup integration. Loads `js.paystack.co/v1/inline.js` on demand.
- **Flutterwave** — Checkout modal integration. Loads `checkout.flutterwave.com/v3.js` on demand.

Both are abstracted behind a unified `processPayment()` function in `src/lib/payment.ts`. The provider can be selected per transaction.

### Pricing (Planner Events)

| Size     | Guests           | Price   |
| -------- | ---------------- | ------- |
| Intimate | Under 100        | ₦5,000  |
| Standard | 100–300          | ₦10,000 |
| Large    | 300+ / Corporate | ₦15,000 |

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # TypeScript check + production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Architecture

EventGrid is a React SPA powered entirely by Supabase — no custom API server:

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

## Supabase Setup

See `doc/02_DATABASE_SCHEMA.md` for the full schema including:

- 17 table definitions with RLS policies
- Auto-update triggers
- Profile creation trigger
- Event phases auto-creation trigger
- Storage bucket configuration

Run the SQL in Supabase SQL editor before using the app.

## License

Proprietary — All rights reserved. See [LICENSE.md](LICENSE.md).

© 2024-2026 NaliTech Consults Limited.

---

Built for Nigerian event professionals.
