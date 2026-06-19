# NaliGrid — Sitemap Audit & SEO Action Plan
**Version:** 1.0
**Date:** June 2026

---

## Sitemap Audit — Issues Found

Before acting on anything, fix these problems in the current sitemap:

### Problem 1 — Duplicate Homepage
```xml
https://naligrid.com/       ← correct canonical home
https://naligrid.com/home   ← duplicate, should not exist
```
`/home` should either redirect 301 to `/` or not be a real route at all. Having two URLs with the same content splits your PageRank and confuses Google's crawl. **Remove `/home` from sitemap and add a redirect.**

### Problem 2 — Pages That Likely Don't Exist Yet
These are in the sitemap but are probably empty or not built:
- `/about`
- `/blog`
- `/careers`
- `/press`
- `/contact`
- `/faq`
- `/security`
- `/pricing` (removed from landing per earlier decision — confirm if this is a standalone page or gone)
- `/features/pipeline`, `/features/live-board`, `/features/client-portal`, `/features/vendor-tracker`, `/features/aftermath-reports`

Google crawls your sitemap and penalises URLs that return 404 or empty pages. **Every URL in the sitemap must return real, indexed content.** Remove any that don't exist yet — add them back only when the page is live and has real content.

### Problem 3 — `/vendors-landing` is an ugly URL
`/vendors-landing` reads like a developer placeholder name, not a real page. Rename to `/for-vendors` to match the pattern of `/planners` and `/coordinators`. Update the sitemap and add a 301 redirect from the old URL.

### Problem 4 — Missing High-Value SEO Pages
The sitemap is missing the keyword-targeted pages that will actually drive organic traffic. These need to be added once built (see Agent Tasks below).

---

## YOUR Tasks (Victor — No Code Required)

### Task 1 — Google Search Console
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add `naligrid.com` as a property
3. Choose **DNS verification** method
4. Copy the TXT record Google gives you
5. Add it to your `naligrid.com` DNS settings at your registrar
6. Click Verify in Search Console
7. Once verified: go to **Sitemaps** → enter `https://naligrid.com/sitemap.xml` → Submit
8. Come back in 48 hours and check **Coverage** — any 404s or crawl errors will appear here

### Task 2 — Google Business Profile
1. Go to [business.google.com](https://business.google.com)
2. Create a profile for **NaliGrid** (product of NaliTech Consults Limited)
3. Category: **Software Company** or **Business Management Software**
4. Location: Abuja, Nigeria
5. Website: `https://naligrid.com`
6. Description: "NaliGrid is Nigeria's event planning and management platform for professional event planners, coordinators, and vendors. Manage vendors, budgets, guests, and live event-day coordination — all in Nigerian Naira."
7. Add your logo and a clean product screenshot once available
8. This gets you into local Google results when people in Nigeria search for event management tools

### Task 3 — Confirm Which Sitemap Pages Are Actually Live
Go through each URL in the sitemap and open it in your browser. Mark each one:
- ✅ Live with real content
- ⚠️ Route exists but page is empty/placeholder
- ❌ 404 / doesn't exist

Share this list with the agent so they know which pages to build vs which to remove from the sitemap.

### Task 4 — Write (or Brief) the First Blog Post
You don't need to write code for this — you need to write content. The highest-value first article:

**Title:** "Why Nigerian Event Planners Are Still Using WhatsApp and Excel (And What to Use Instead)"

This directly targets the search intent of your exact buyer, is genuinely useful, and positions NaliGrid as the answer without being an advertisement. Aim for 800–1200 words. Real, specific, Nigerian context throughout. No generic SaaS fluff.

Publish it at `/blog/nigerian-event-planners-whatsapp-excel` once the blog route is built.

### Task 5 — Outreach for First Backlinks
These are the highest-leverage backlinks you can get for a Nigerian startup:

Priority 1:
- Email **TechCabal** (techcabal.com/tips) with a 3-paragraph pitch: "Nigerian founder builds event management software for local planners — here's the problem it solves"
- Email **Techpoint.Africa** (tips@techpoint.africa) with the same pitch
- Email **Bella Naija Weddings** (bellanaija.com/contact) — frame it as a tool for their planner community

Priority 2:
- Find 3 Nigerian event/wedding blogs that publish "tools for planners" content and offer to write a guest post
- Ask your beta testers if they'd mention NaliGrid on their own website or Instagram bio with a link

Each of these links is worth more than months of technical SEO work. One TechCabal mention alone can get you indexed and ranking for brand name searches within days.

### Task 6 — Instagram SEO Setup
Update the NaliGrid Instagram account bio to include searchable keywords:
```
Event planning software for Nigerian professionals 🇳🇬
Manage vendors, budgets & guests — all in Naira
naligrid.com
```
Post content uses hashtags: #NigerianEventPlanner #EventPlanningNigeria #WeddingPlannerNigeria #EventManagementNigeria #NaliGrid

---

## AGENT Tasks

### Agent Task 1 — Fix the Sitemap
Update `public/sitemap.xml`:

1. Remove `/home` entirely
2. Rename `/vendors-landing` to `/for-vendors`
3. Remove all pages that don't exist yet (see list below — add back once built)
4. Add the new keyword pages (see Task 4 below) once built

**Cleaned sitemap — use this as the new version:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Core public pages -->
  <url>
    <loc>https://naligrid.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://naligrid.com/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://naligrid.com/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <!-- Role landing pages -->
  <url>
    <loc>https://naligrid.com/planners</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://naligrid.com/coordinators</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://naligrid.com/for-vendors</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Legal -->
  <url>
    <loc>https://naligrid.com/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://naligrid.com/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://naligrid.com/cookies</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

</urlset>
```

Add these back once the pages are built and have real content:
```
/faq
/about
/contact
/blog (and individual blog post URLs)
/security
/for-wedding-planners
/for-corporate-events
/event-budget-tracker
/vendor-management
/features/* pages
```

### Agent Task 2 — Add robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /auth/
Disallow: /onboarding/
Disallow: /portal/
Disallow: /survey/

Sitemap: https://naligrid.com/sitemap.xml
```

The `Disallow` entries are important — they stop Google from crawling authenticated app routes (which it can't access anyway) and wasting crawl budget on them.

### Agent Task 3 — Fix the /home → / Redirect

In React Router, add a redirect so anyone hitting `/home` goes to `/`:

```tsx
// In router setup
<Route path="/home" element={<Navigate to="/" replace />} />
```

Also update the Vercel config to handle this at the edge level:

```json
// vercel.json — add to redirects array
{
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    },
    {
      "source": "/vendors-landing",
      "destination": "/for-vendors",
      "permanent": true
    }
  ]
}
```

### Agent Task 4 — Add Meta Tags to Every Public Page

Install and use `react-helmet-async` (already a dependency). Add unique title, description, and canonical tag to every public-facing route. Generic template for each page:

```tsx
// Landing page
<Helmet>
  <title>NaliGrid — Event Planning & Management Software for Nigeria</title>
  <meta name="description" content="NaliGrid is Nigeria's event management platform. Manage vendors, track budgets in Naira, coordinate teams, and run event-day operations — built for Nigerian event professionals." />
  <link rel="canonical" href="https://naligrid.com/" />
  <meta property="og:title" content="NaliGrid — Event Planning Software for Nigerian Professionals" />
  <meta property="og:description" content="Replace WhatsApp threads and Excel sheets. One platform for planners, coordinators, and vendors." />
  <meta property="og:url" content="https://naligrid.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://naligrid.com/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
</Helmet>

// /planners page
<Helmet>
  <title>NaliGrid for Event Planners — Nigeria's Event Planning Software</title>
  <meta name="description" content="Built for Nigerian event planners. Manage clients, vendors, budgets, and the full 9-phase event lifecycle — from first inquiry to aftermath report." />
  <link rel="canonical" href="https://naligrid.com/planners" />
</Helmet>

// /coordinators page
<Helmet>
  <title>NaliGrid for Event Coordinators — Live Event Control for Nigeria</title>
  <meta name="description" content="The live event board Nigerian coordinators need. Real-time station status, team task tracking, issue flagging, and guest check-in — all on your phone." />
  <link rel="canonical" href="https://naligrid.com/coordinators" />
</Helmet>

// /for-vendors page
<Helmet>
  <title>NaliGrid for Event Vendors — Manage Your Event Bookings in Nigeria</title>
  <meta name="description" content="Get invited to events, confirm your bookings, track your deliverables, and upload delivery proof — NaliGrid connects Nigerian event vendors with planners." />
  <link rel="canonical" href="https://naligrid.com/for-vendors" />
</Helmet>
```

### Agent Task 5 — Add JSON-LD Structured Data to Landing Page

Add this script block to the `<head>` of the landing page via `react-helmet-async`:

```tsx
<Helmet>
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "NaliGrid",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "description": "Event planning and management software built for Nigerian event professionals. Manage vendors, budgets, guests, and live event-day coordination — all in Nigerian Naira.",
      "url": "https://naligrid.com",
      "screenshot": "https://naligrid.com/og-image.png",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "NGN",
        "price": "5000",
        "description": "Per-event activation starting from ₦5,000"
      },
      "provider": {
        "@type": "Organization",
        "name": "NaliTech Consults Limited",
        "url": "https://naligrid.com",
        "logo": "https://naligrid.com/logo.png",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Abuja",
          "addressRegion": "FCT",
          "addressCountry": "NG"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "hello@naligrid.com"
        }
      }
    })}
  </script>
</Helmet>
```

### Agent Task 6 — Create OG Image

Create a static `public/og-image.png` — 1200×630px. Design it to match the brand: dark background (`#111827`), gold NaliGrid wordmark centred, tagline below: *"Event Planning Software for Nigerian Professionals."* This image appears when someone shares the link on WhatsApp, Twitter/X, or LinkedIn. Currently no OG image exists — every share shows a blank preview.

### Agent Task 7 — Build the Missing Pages (Priority Order)

Build these pages in this order. Each needs real content, not a placeholder:

**Priority 1 — These block the sitemap being fully clean:**

`/faq` — Frequently Asked Questions. At minimum cover:
- What is NaliGrid?
- Who is it for?
- How does per-event pricing work?
- Is my financial data private?
- What happens if my event is cancelled?
- Does it work on mobile?
- Is it available outside Nigeria?

`/contact` — Simple contact page. Email address, WhatsApp number, and a basic form (name, email, message). No backend required — EmailJS or a Formspree endpoint is fine for this use case (not for transactional emails, but a contact form is acceptable).

**Priority 2 — SEO value pages:**

`/for-wedding-planners` — keyword: "wedding planner software Nigeria"
`/for-corporate-events` — keyword: "corporate event management software Nigeria"
`/event-budget-tracker` — keyword: "event budget tracker Nigeria Naira"

Each page: hero headline targeting the keyword, the specific features relevant to that use case, 2–3 testimonials (use beta tester quotes once available), CTA to register.

**Priority 3 — Build when ready:**

`/about` — NaliTech/NaliGrid story, founder context, mission
`/security` — how data is protected, NDPA compliance summary, Supabase infrastructure
`/blog` — blog index page (even if there are no posts yet, the route should exist and render a "Coming soon — first post dropping soon" state, not a 404)

### Agent Task 8 — Page Speed Audit Fixes

Run `naligrid.com` through PageSpeed Insights and fix whatever scores below 80 on mobile. Common Vite/React issues to check and fix proactively:

- All images using correct dimensions and `loading="lazy"` where appropriate
- Landing page hero image (if any) is preloaded: `<link rel="preload" as="image" href="..." />`
- No unused JavaScript bundles loading on initial page render
- Google Fonts loaded with `display=swap`: `&display=swap` in the import URL (already in global.css — confirm it's there)
- Verify code splitting is active for dashboard routes so they don't inflate the landing page bundle

---

## Priority Order Summary

**Do this week (Victor):**
1. Verify `naligrid.com` in Google Search Console
2. Submit cleaned sitemap
3. Create Google Business Profile
4. Brief TechCabal / Techpoint.Africa

**Do this week (Agent):**
1. Fix sitemap (remove /home, rename /vendors-landing, trim non-existent pages)
2. Add robots.txt
3. Add /home and /vendors-landing redirects in router + vercel.json
4. Add meta tags to all existing public pages
5. Add JSON-LD structured data to landing page
6. Create og-image.png

**Do next sprint (Agent):**
7. Build /faq and /contact
8. Build /for-wedding-planners, /for-corporate-events, /event-budget-tracker
9. Page speed audit fixes

**Do when ready (Victor):**
- Write first blog post
- Collect beta tester quotes and swap into landing page testimonials
- Begin backlink outreach
