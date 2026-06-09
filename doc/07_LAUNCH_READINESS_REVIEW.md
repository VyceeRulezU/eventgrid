# EventGrid — Launch Readiness Review & Plan

**Status:** Pre-Launch Review  
**Date:** June 2026  
**App:** React 19 SPA + Vite 8 + Supabase (not Next.js)

---

## 1. What We Have (Already Done ✅)

### Domain & Deployment
- `vercel.json` configured with rewrites for SPA routing
- `VITE_APP_URL` env var in `.env.example` (not `NEXT_PUBLIC_APP_URL` — checklist template mismatch)
- Build pipeline: `tsc -b && vite build` works

### Security & Authentication
- Supabase Auth with email/password + email verification
- `AuthGuard` and `RoleGuard` components for route protection
- Role-based access (planner, coordinator, vendor, client, team_member, super_admin)
- 36 SQL migration files with RLS policies
- Client portal: token-based access with expiry (`client-portal` edge function)
- Paystack webhook HMAC signature verification
- `.env.example` exists; `*.local` in `.gitignore` covers `.env.local`
- Password strength meter

### Monitoring & Error Tracking
- **Sentry**: Integrated in `src/lib/sentry.ts`, initialized in `main.tsx` with `ErrorBoundary` wrapping the app, 0.25 sample rate for traces
- **Vercel Analytics + Speed Insights**: Integrated in `App.tsx`

### Payments & Financials
- Dual provider: Paystack (`src/lib/paystack.ts`) and Flutterwave (`src/lib/flutterwave.ts`)
- `processPayment()` abstraction in `src/lib/payment.ts`
- **Paystack webhook**: `supabase/functions/paystack-webhook/index.ts` with HMAC verification + idempotency check (`.neq('payment_status', 'paid')`)
- **Payment verification**: `supabase/functions/verify-payment/index.ts` supports both Paystack and Flutterwave
- Kobo-based storage: `formatNaira(kobo)` in `utils.ts`, amounts stored as integers
- `financial_entries` table for transaction logging

### Emails & Notifications
- **Resend** via Edge Functions: `send-invite` and `onboarding-emails`
- **React email templates**: 7 templates (Welcome, QuickStart, TrialReminder, Feedback, Payment, EmailWrapper, index)
- **EmailJS** as client-side fallback
- **Push notifications**: Web Push API + VAPID + Service Worker (`public/sw.js`)
- `FROM_EMAIL` configured in env

### Performance & UX
- **Code splitting**: `React.lazy()` on heavy pages (financials, aftermath, guests, admin pages)
- **Skeleton loading**: CSS skeleton classes in `src/styles/components.css`; used in App.tsx, financials, notifications, admin pages, client dashboard, vendor directory, client portal
- **Toast notifications**: `ToastContainer.tsx` + `ui.store.ts` for toast queue
- **Dark/Light theme**: `ui.store.ts` with CSS custom properties
- **Mobile responsive**: CSS with mobile breakpoints, `BottomTabBar` for mobile nav
- **PWA**: `site.webmanifest`, service worker, icons

### SEO, Marketing & Content — **FULLY DONE**
- `SEO.tsx` component with react-helmet-async (title, description, OG, Twitter cards, JSON-LD)
- `public/robots.txt` — allows all, disallows private routes
- `public/sitemap.xml` — 4 URLs
- Comprehensive favicon set (8 files)
- Full landing page with Hero, Features, Testimonials, How It Works, etc.
- Pricing page with feature comparison
- Info pages: About, Blog, Careers, Press, Contact, FAQ, Privacy, Terms, Cookies, Security (15 files)

### Legal & Compliance — **DONE**
- `TermsPage.tsx` — live
- `PrivacyPage.tsx` — live, covers data collection, guest info
- `CookiesPage.tsx` — live
- Pricing disclosure on PricingPage
- Terms mention automated daily backups

### Documentation
- `doc/` — 9 developer docs (architecture, schema, API contracts, etc.)
- `docs/manual/` — 10 user manual files
- `README.md` — full project documentation

---

## 2. What's Not Done (Gaps / Action Required 🔴)

| # | Area | Gap | Priority | Effort |
|---|------|-----|----------|--------|
| 1 | **Testing** | Zero test infrastructure. No unit, integration, or E2E tests. No Vitest config. | **HIGH** | Large |
| 2 | **Flutterwave Webhook** | Only Paystack webhook exists. Flutterwave webhook handler is missing. | **HIGH** | Medium |
| 3 | **Rate Limiting** | Not implemented anywhere. Critical for payments and client portal endpoints. | **HIGH** | Medium |
| 4 | **Supabase Usage Monitoring** | No monitoring dashboard or alerts for DB size, realtime, egress. | **HIGH** | Small |
| 5 | **Sentry Error Alerts** | Sentry captures errors but no alerting rules configured. | **HIGH** | Small |
| 6 | **Feature Flags** | Referenced in `PROMPT_ux_improvements_features.md` but not implemented. | **MEDIUM** | Medium |
| 7 | **Empty States** | Inconsistent — only FeedbackChat and PhasePipeline have empty states. Most pages lack them. | **MEDIUM** | Medium |
| 8 | **JWT Verification in Edge Functions** | Edge functions use `SUPABASE_SERVICE_ROLE_KEY` directly without verifying the caller's JWT where needed. | **MEDIUM** | Small |
| 9 | **Backup Strategy** | Not documented or configured. Only mentioned in Terms. | **MEDIUM** | Small |
| 10 | **Guest Data Consent** | Privacy page covers this, but no in-app consent checkbox for guest info collection. | **LOW** | Small |
| 11 | **CI/CD Pipeline** | No GitHub Actions or automated deploy pipeline. | **LOW** | Medium |
| 12 | **Domain/DNS Setup** | eventgrid.ng SSL, www redirect, Vercel production env vars not verifiable from code. | — | Ops task |

---

## 3. What's Supposed to Be Done (Checklist Items Clarified)

### Checklist items that are **N/A or adapt** for this codebase:
| Checklist Item | Verdict |
|---|---|
| `NEXT_PUBLIC_APP_URL` | N/A — Vite app uses `VITE_APP_URL`. Already in `.env.example`. |
| "Manual E2E testing" sections | Operations task, not code. |
| "Beta testers" / "Feedback from beta" | Not code — organizational task. |
| "Support channels ready" | Contact page exists; WhatsApp/email readiness is ops. |

### Checklist items that need **code-level work** (from gaps above):
- Rate limiting on critical endpoints
- Flutterwave webhook handler
- Feature flags for controlled rollout
- Test infrastructure
- Sentry alert configuration
- Supabase monitoring

---

## 4. What Can Be Ignored

| Item | Reason |
|---|---|
| NEXT_PUBLIC_APP_URL | Not a Next.js app. VITE_APP_URL already configured. |
| "Resend domain verified" | Cannot verify from code — ops task. |
| "Live mode payment test" | Cannot verify from code — ops task. |
| "Mobile responsiveness on real devices" | Not a code change — QA task. |
| "Beta tester feedback" | Organizational task. |
| Full E2E checklist items (manual) | Not code — these are testing/QA tasks. |

---

## 5. Action Plan (Prioritized)

### Phase 1 — Launch Blockers (Do before launch)
1. **Rate limiting** — Implement on critical Edge Functions (payments, client portal) and Supabase endpoints
2. **Flutterwave webhook** — Create `supabase/functions/flutterwave-webhook/index.ts` mirroring paystack-webhook pattern
3. **Sentry alert rules** — Configure in Sentry dashboard (at minimum: error rate spike, new error types)
4. **Supabase monitoring** — Enable project usage alerts in Supabase dashboard

### Phase 2 — Quality (Do before or shortly after launch)
5. **Vitest setup** — Add `vitest.config.ts`, write tests for critical paths (auth guards, payment flow, edge functions)
6. **Empty states** — Add consistent empty state components across all list pages (events, vendors, tasks, guests, notifications)
7. **JWT verification** — Add `req.headers.get('Authorization')` verification to edge functions that need user context

### Phase 3 — Nice to Have (Post-launch)
8. **Feature flags** — Implement AdminFlagsPage and flag-checking utilities
9. **CI/CD** — GitHub Actions for lint → test → deploy
10. **Guest data consent UI** — Add consent checkbox on guest creation forms
11. **Backup strategy doc** — Document automated backup process

---

## 6. Checklist Status Summary

| Section | Complete | Partial | Missing |
|---------|----------|---------|---------|
| Domain & Deployment | `vercel.json` | Env vars in prod, DNS/SSL | — |
| Security & Auth | Auth guards, RLS, portal tokens, HMAC | — | Rate limiting, JWT verify in EFs |
| Monitoring & Error | Sentry init, ErrorBoundary, Vercel Analytics | — | Supabase monitoring, Sentry alerts |
| Payments & Financials | Paystack webhook, payment flow, kobo storage | — | Flutterwave webhook |
| Emails & Notifications | Resend EFs, React email templates, push notifications | — | — |
| Performance & UX | Code splitting, skeletons, toast, theme, PWA | Empty states | — |
| Testing | — | — | **Everything** |
| SEO & Marketing | **Complete** ✅ | — | — |
| Legal & Compliance | **Complete** ✅ | — | — |
| Launch Readiness | Onboarding flow, contact page | Feature flags | Backup strategy, beta testing |
