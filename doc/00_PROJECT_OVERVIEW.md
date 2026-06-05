# EventGrid — Project Overview

## Agent Context Document 00

**For:** Antigravity / Cursor AI Agent
**Version:** 1.0
**Author:** Victor Ironali / NaliTech Consults

---

## What You Are Building

EventGrid is a multi-role SaaS platform for the event industry in Nigeria. It replaces the WhatsApp threads, Excel sheets, and phone-call confirmations that event planners in Nigeria currently use to manage their work.

It covers the full event lifecycle — from first client inquiry through to post-event analysis — and serves five distinct user roles in one unified platform.

---

## Core Value Propositions

1. **Single source of truth** for planners, coordinators, vendors, and clients
2. **Financial control** — Naira-based payment tracking replacing Excel, visible only to the planner
3. **Live event board** — real-time status monitoring on event day via mobile
4. **Client portal** — phase-by-phase visibility for clients without exposing operational detail
5. **Aftermath review** — photo log, issue history, and event report after every event

---

## Tech Stack

| Layer                   | Technology                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| Frontend                | React 18 + Vite                                                  |
| Styling                 | Vanilla CSS + CSS Modules (CSS custom properties for all tokens) |
| State                   | Zustand                                                          |
| Backend                 | Supabase (Auth + PostgreSQL + Realtime + Storage)                |
| Payments                | Paystack                                                         |
| PDF Export              | @react-pdf/renderer                                              |
| Drag & Drop             | @dnd-kit                                                         |
| Charts                  | Recharts                                                         |
| Forms                   | React Hook Form + Zod                                            |
| Deployment              | Vercel                                                           |
| Notifications (Phase 2) | Termii (WhatsApp Business API)                                   |

---

## User Roles (5 Total)

| Role                     | Entry              | Pays                 | Access Level                           |
| ------------------------ | ------------------ | -------------------- | -------------------------------------- |
| Planner                  | Self-register      | Per event (₦5k–15k)  | Full suite + financials                |
| Coordinator (Invited)    | Invited by planner | Free (planner pays)  | Team ops + live board                  |
| Coordinator (Standalone) | Self-register      | Per project (₦3k–5k) | Team ops + live board, no financials   |
| Vendor                   | Invited by planner | Free                 | Own deliverables + arrival only        |
| Client                   | Invited by planner | Free                 | Read-only phase visibility + approvals |

---

## Pricing Model

Per-event / per-project at launch. No monthly subscription in Phase 1.

| Planner Event Size          | Price   |
| --------------------------- | ------- |
| Intimate (under 100 guests) | ₦5,000  |
| Standard (100–300 guests)   | ₦10,000 |
| Large (300+ / corporate)    | ₦15,000 |

Coordinator standalone: ₦3,000–5,000 per project.
Payment processor: Paystack (naira, card + bank transfer + USSD).

---

## The 9 Event Phases

Every event created by a planner moves through these phases:

1. Lead & Client Onboarding
2. Event Planning & Strategy
3. Vendor Management
4. Team Coordination
5. Guest Management
6. Pre-Event Finalization
7. Event Day Operations (Live Board)
8. Event Closeout
9. Post-Event Analysis

Each phase has: status, owner, due date, checklist, and notes.

---

## Project File Structure (Target)

```
eventgrid/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/               # Reusable primitives (buttons, inputs, badges)
│   │   ├── layout/           # Shell, sidebar, header, mobile nav
│   │   ├── planner/          # Planner-specific components
│   │   ├── coordinator/      # Coordinator-specific components
│   │   ├── vendor/           # Vendor portal components
│   │   ├── client/           # Client portal components
│   │   └── shared/           # Cross-role components (phase tracker, etc.)
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
│   ├── store/                # Zustand stores
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── paystack.ts
│   │   └── utils.ts
│   ├── types/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .env.local
└── vite.config.ts
```

---

## Key Constraints the Agent Must Respect

1. **Financial data is planner-admin only.** Never render financial components for any other role. RLS enforces this at DB level; the frontend enforces it at route and component level.
2. **Client portal is read-only.** Clients access via token-based route. No auth account required.
3. **Vendor access is event-scoped.** A vendor invited to Event A cannot see Event B.
4. **Mobile-first.** All interactive components must be usable on a 390px screen. Live board especially.
5. **Nigerian context.** Currency is ₦ (Naira). Date format DD/MM/YYYY. Phone numbers +234.
6. **Supabase Realtime** powers the live event board. Do not poll. Use channel subscriptions.
7. **Never delete issues.** Issue flags on the live board are appended only. Resolved issues stay in the log for aftermath review.

---

## Reference Documents in This Suite

| File                   | Contents                                               |
| ---------------------- | ------------------------------------------------------ |
| 00_PROJECT_OVERVIEW.md | This file — project context and constraints            |
| 01_ARCHITECTURE.md     | System architecture, data flow, auth model             |
| 02_DATABASE_SCHEMA.md  | All Supabase tables, columns, RLS policies             |
| 03_FEATURE_SPECS.md    | Detailed feature logic per module                      |
| 04_API_CONTRACTS.md    | Supabase query patterns, edge functions                |
| 05_UI_GUIDELINES.md    | Design system, component patterns, mobile rules        |
| 06_BUILD_SEQUENCE.md   | Step-by-step implementation order with task checklists |
