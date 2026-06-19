# Domain Migration Plan: eventgrid.ng → naligrid.com

## Overview

Migrate the production domain from `eventgrid.ng` to `naligrid.com` across Vercel, Supabase, and all integrations. Plan assumes both domains are owned by you and DNS is managed by your registrar.

---

## Phase 1: Pre-migration (You)

### 1.1 Buy & verify ownership
- [ ] Purchase `naligrid.com` at your registrar if not owned
- [ ] Add it to the same registrar account as `eventgrid.ng`

### 1.2 Update registrar DNS
| Record | Type | Value | TTL |
|--------|------|-------|-----|
| `@` (root) | A | `76.76.21.21` (Vercel's IP) | 300 |
| `www` | CNAME | `cname.vercel-dns.com` | 300 |
| `app` (if using subdomain) | CNAME | `cname.vercel-dns.com` | 300 |

> **Note:** Vercel may later replace the A record with their edge network IPs after domain verification. The CNAME approach is preferred.

---

## Phase 2: Vercel Domain Setup (You)

### 2.1 Add domain in Vercel dashboard
- [ ] Go to Vercel Dashboard → **Project** → **Settings** → **Domains**
- [ ] Enter `naligrid.com` and click **Add** — Vercel will verify ownership by checking the DNS records above
- [ ] Once verified, Vercel auto-provisions an SSL certificate (Let's Encrypt)

### 2.2 Set as primary domain
- [ ] In the Domains settings, make `naligrid.com` the **primary** domain
- [ ] Keep `eventgrid.ng` as a redirect/alias during migration

### 2.3 Update Vercel Environment Variables
| Variable | Current Value | New Value |
|----------|--------------|-----------|
| `VITE_SITE_URL` | `https://eventgrid.ng` | `https://naligrid.com` |
| `PUBLIC_URL` | `https://eventgrid.ng` | `https://naligrid.com` |

- [ ] Update these env vars in Vercel → Settings → Environment Variables
- [ ] Redeploy

---

## Phase 3: Supabase Configuration (You)

### 3.1 Update Auth redirect URLs
- [ ] Supabase Dashboard → **Authentication** → **URL Configuration**
- [ ] Add `https://naligrid.com` to **Site URL**
- [ ] Add `https://naligrid.com/**` to **Redirect URLs** (keep existing `eventgrid.ng` ones during migration)

### 3.2 Update Supabase Edge Function URLs
- No action needed — Edge Functions use `https://<ref>.supabase.co/functions/v1/` (not domain-dependent)

---

## Phase 4: Code Changes (Me to execute)

### 4.1 Search & replace hardcoded `eventgrid.ng` references
- [ ] Scan all `.ts`, `.tsx`, `.js` files for `eventgrid.ng` strings
- [ ] Replace any hardcoded URLs with `import.meta.env.VITE_SITE_URL` where appropriate
- [ ] For URLs that can't be env-var-driven, update to `naligrid.com`

### 4.2 Update invite link proxy
- [ ] `supabase/functions/send-invite/index.ts` — verify `proxyInviteLink()` uses `VITE_SITE_URL`; if hardcoded, fix it

### 4.3 Verify storage URL references
- [ ] `src/features/guests/GuestRsvpPage.tsx` — ensure `VITE_STORAGE_URL` is used (already done per earlier session)
- [ ] Check for any other hardcoded `eventgrid.ng` storage URLs

---

## Phase 5: Third-party Integrations (You)

### 5.1 Paystack
- [ ] Paystack Dashboard → **Settings** → **Webhooks** → Update webhook URLs to `https://naligrid.com/api/...`
- [ ] Add `naligrid.com` to allowed domains (if Paystack requires this)

### 5.2 Korapay (when approved)
- [ ] Korapay Dashboard → Update webhook URLs similarly

### 5.3 OAuth providers (Google, Apple, etc.)
- [ ] Google Cloud Console → Update **Authorized JavaScript origins** to include `https://naligrid.com`
- [ ] Update **Authorized redirect URIs** to `https://naligrid.com/auth/v1/callback`
- [ ] Same for any other OAuth providers (Apple, Facebook, etc.)

---

## Phase 6: Testing (You)

### 6.1 Pre-cutover checks
- [ ] `https://naligrid.com` loads the app (Vercel)
- [ ] SSL certificate is valid (no mixed content warnings)
- [ ] Login/signup flow works (Supabase auth redirects to new domain)
- [ ] Paystack payment popup opens correctly
- [ ] Invite links resolve (test with a team member invite)
- [ ] Storage images load (event media, profile photos)

### 6.2 Parallel testing
- [ ] Both `eventgrid.ng` and `naligrid.com` work simultaneously
- [ ] Auth sessions persist across the cutover (users stay logged in)
- [ ] No CORS errors in console

---

## Phase 7: Cutover & Cleanup (You)

### 7.1 Set 301 redirects
- [ ] In Vercel → Domains → `eventgrid.ng` → Set **Redirect to** `naligrid.com` (301 permanent)
- [ ] All `eventgrid.ng/*` routes redirect to `naligrid.com/*`

### 7.2 Update Supabase site URL
- [ ] Supabase → Auth → URL Configuration → Change **Site URL** to `https://naligrid.com`
- [ ] Remove `eventgrid.ng` from redirect URLs once traffic fully migrated

### 7.3 Monitor
- [ ] Check Vercel Analytics for 404s on old domain (after 1 week)
- [ ] Check Supabase Auth logs for failed redirects

### 7.4 Optional: Remove old domain
- [ ] After 2–4 weeks, remove `eventgrid.ng` from Vercel Domains
- [ ] Remove `eventgrid.ng` from Supabase redirect whitelist

---

## Rollback Plan

If `naligrid.com` has issues:
1. Revert Vercel primary domain to `eventgrid.ng`
2. Keep Supabase redirect URLs for `eventgrid.ng` (already present)
3. No DNS changes needed — Vercel handles both domains
