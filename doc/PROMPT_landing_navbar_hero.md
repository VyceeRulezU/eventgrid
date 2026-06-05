# Agent Prompt — Landing Page: Navbar + Hero Section

## Context
You are building the public-facing landing page for **EventGrid**, a multi-role SaaS platform for Nigerian event planners. Refer to the following documents in your context before writing any code:

- `05_UI_GUIDELINES.md` — all design tokens, CSS custom properties, component patterns
- `00_PROJECT_OVERVIEW.md` — product context, value props, user roles
- `03_FEATURE_SPECS.md` — feature language for copy accuracy

Do not install any new packages. Do not use Tailwind. All styling is vanilla CSS using the token variables already defined in `src/styles/tokens.css`.

---

## Task
Build two components:

1. `src/components/layout/Navbar.tsx` + `Navbar.module.css`
2. `src/pages/landing/HeroSection.tsx` + `HeroSection.module.css`

These will be composed into `src/pages/landing/LandingPage.tsx`.

---

## Layout Constraint — Content Width

The global content container max-width for the landing page is **1800px**, centered with auto horizontal margins. Define this as a reusable wrapper:

```css
/* In Navbar.module.css and HeroSection.module.css */
.container {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

@media (min-width: 768px) {
  .container { padding: 0 var(--space-8); }
}

@media (min-width: 1280px) {
  .container { padding: 0 var(--space-12); }
}
```

---

## 1. Navbar Component

### File locations
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Navbar.module.css`

### Behaviour
- Fixed to the top of the viewport (`position: fixed; top: 0; left: 0; right: 0`)
- `z-index: var(--z-sticky)`
- On scroll past 60px: background transitions from fully transparent to `var(--color-surface-1)` with `border-bottom: 1px solid var(--color-border)` and `box-shadow: var(--shadow-md)` — use a scroll event listener + a CSS class toggle
- Default (at top of page): transparent background, no border

### Desktop layout (1024px+)
```
[Logo + Wordmark]          [Nav Links]          [CTA Buttons]
```

- **Logo area:** SVG logo mark (a simple gold grid/diamond shape — generate a clean inline SVG) + wordmark "EventGrid" in `var(--font-base)`, `var(--weight-bold)`, `var(--text-subtitle)`, `var(--color-text-primary)`
- **Nav links (centre):** Features | How It Works | Pricing | For Coordinators
  - Font: `var(--text-sm)`, `var(--weight-medium)`, `var(--color-text-secondary)`
  - Hover: `var(--color-text-primary)`, smooth transition
  - These are anchor links (`#features`, `#how-it-works`, `#pricing`, `#coordinators`) — smooth scroll
- **CTA buttons (right):**
  - "Log In" — `.btn .btn-ghost` from `components.css`
  - "Get Started" — `.btn .btn-primary` from `components.css`

### Mobile layout (below 1024px)
- Logo left, hamburger icon right (use `lucide-react` `Menu` and `X` icons)
- Hamburger toggles a full-width dropdown menu below the navbar
- Mobile menu background: `var(--color-surface-1)`, `border-bottom: 1px solid var(--color-border)`
- Mobile menu items stacked vertically with `min-height: 52px` each
- "Log In" and "Get Started" both visible in mobile menu
- Menu closes on nav link click or outside click

### Accessibility
- Hamburger button: `aria-label="Open menu"` / `aria-label="Close menu"` based on state
- Nav `<nav>` element with `aria-label="Main navigation"`
- Active section highlighting optional for now

---

## 2. Hero Section Component

### File locations
- `src/pages/landing/HeroSection.tsx`
- `src/pages/landing/HeroSection.module.css`

### Layout
- Full viewport height minimum: `min-height: 100vh`
- Vertically centred content with `padding-top` equal to navbar height (`72px`) so content isn't hidden behind the fixed navbar
- Background: `var(--color-bg-base)` with a subtle radial gradient centred top-centre:
  ```css
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%,
      rgba(212, 160, 23, 0.12) 0%,
      transparent 70%),
    var(--color-bg-base);
  ```
- A very subtle dot-grid pattern overlay using CSS (no image files):
  ```css
  background-image:
    radial-gradient(circle, rgba(212,160,23,0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  ```
  Layer this on top of the main background using a pseudo-element `::before` with `position: absolute; inset: 0; pointer-events: none`

### Content structure (desktop: two columns, mobile: single column stacked)

**Desktop (1024px+):** 55% left text column, 45% right visual column, `gap: var(--space-16)`
**Mobile:** single column, text centred, visual below

#### Left Column — Text Content

**Badge/label (top):**
```
[⚡ icon]  Built for Nigerian Event Professionals
```
- Pill shape: `background: var(--color-accent-muted)`, `border: 1px solid var(--color-accent-border)`, `border-radius: var(--radius-full)`
- Text: `var(--text-xs)`, `var(--weight-semibold)`, `var(--color-accent)`
- Use `Zap` icon from `lucide-react`, size 12

**Headline:**
```
Run Every Event.
Coordinate Every Detail.
```
- Font size: `clamp(2.5rem, 5vw, 4rem)` — responsive, no media query needed
- Weight: `var(--weight-extrabold)`
- Line height: `1.1`
- Colour: `var(--color-text-primary)`
- "Every Detail." — wrap in a `<span>` with `color: var(--color-accent)` to gold-highlight the second line

**Subheadline (below headline):**
```
Replace WhatsApp threads, Excel sheets, and last-minute
chaos with one platform — from first inquiry to aftermath review.
```
- Font: `var(--text-base)` on mobile, `var(--text-subtitle)` on desktop
- Weight: `var(--weight-regular)`
- Colour: `var(--color-text-secondary)`
- Line height: `var(--leading-relaxed)`
- Max width: `520px`

**CTA Buttons:**
- Side by side on desktop, stacked on mobile
- Primary: "Create Your First Event" — `.btn .btn-primary .btn-lg`
  - Add `ArrowRight` icon from `lucide-react` (size 18) on the right
- Secondary: "See How It Works" — `.btn .btn-secondary .btn-lg`
  - Add `Play` icon from `lucide-react` (size 18) on the left, filled with `var(--color-accent)`
- Gap between buttons: `var(--space-4)`

**Social proof line (below CTAs):**
```
[✓] No credit card required  [✓] First event free  [✓] Setup in 5 minutes
```
- Font: `var(--text-xs)`, `var(--weight-medium)`, `var(--color-text-muted)`
- Checkmarks in `var(--color-success)`
- Horizontal on desktop, wrapped on mobile
- Gap: `var(--space-5)` between items

#### Right Column — Visual / App Preview

Build a **mock dashboard card** in pure CSS/HTML (no images, no screenshots) that previews the Live Event Board. This makes the product tangible without needing real screenshots yet.

The card structure:

```
┌─────────────────────────────────────────────┐
│  🟡 Live Event Board  •  Eko Wedding 2025   │  ← card header
│  Event Day • 14 stations active             │
├─────────────────────────────────────────────┤
│  🟢 Registration      Ready          ✓      │
│  🟢 Catering          Confirmed      ✓      │
│  🟡 Decor             80% Complete   ↻      │
│  🔴 Photography       Delayed 15min  !      │
│  🟢 AV / Sound        Functional     ✓      │
│  🟡 Ushers            In Transit     ↻      │
└─────────────────────────────────────────────┘
     ↑ 2 issues flagged    342 / 500 guests arrived
```

Styling rules for the mock card:
- `background: var(--color-surface-2)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-xl)`
- `box-shadow: var(--shadow-lg)`, slight tilt: `transform: perspective(1000px) rotateY(-6deg) rotateX(2deg)`
- On hover: transition to `rotateY(-2deg) rotateX(0deg)` for a subtle 3D interactive feel
- Card header: gold dot indicator (pulsing animation — see below), event name, "Live" badge in red
- Each station row: status dot (coloured), station name, status label, action icon
- Status dots use the status colour tokens from `05_UI_GUIDELINES.md`
- Footer strip: issue count badge + guest check-in counter
- Card should have a subtle `overflow: hidden` with the bottom rows slightly fading out using a `::after` gradient mask — implies more content below

**Pulsing live indicator animation:**
```css
@keyframes pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.3); }
}

.liveDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-status-red);
  animation: pulse-live 1.5s ease-in-out infinite;
}
```

**Floating stat chips** — 2 small pill badges floating outside the card edges:
- Top-right: `"9 Phases Tracked"` — `background: var(--color-surface-3)`, gold border, `var(--text-xs)`
- Bottom-left: `"₦2.4M Budget Managed"` — same style

These use `position: absolute` relative to a `position: relative` wrapper around the card. On mobile, hide these floating chips.

---

## Scroll Indicator
At the bottom of the hero, centred:
- A subtle animated scroll chevron:
  ```
  Scroll to explore  [animated chevron down]
  ```
- `var(--text-xs)`, `var(--color-text-muted)`
- Chevron uses `ChevronDown` from `lucide-react` with a CSS bounce animation:
  ```css
  @keyframes bounce-y {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(6px); }
  }
  ```
- Hide on mobile (`display: none` below 768px)

---

## LandingPage Composition

Update or create `src/pages/landing/LandingPage.tsx`:

```tsx
import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/pages/landing/HeroSection'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        {/* Additional sections will be added in future prompts */}
      </main>
    </>
  )
}
```

Ensure `LandingPage` is wired to the `/` route in the router.

---

## Quality Checklist — Verify Before Finishing

- [ ] Navbar is fully transparent at page top, styled on scroll
- [ ] Mobile hamburger menu opens and closes correctly
- [ ] All CSS uses `var(--token-name)` — zero hardcoded hex values
- [ ] Content container never exceeds 1800px on any screen
- [ ] Hero headline uses `clamp()` — no font size media queries needed
- [ ] Mock dashboard card has 3D tilt and hover transition
- [ ] Pulsing live dot animation runs on page load
- [ ] Floating stat chips are hidden on mobile
- [ ] Scroll indicator is hidden on mobile
- [ ] Both CTA buttons are full-width and stacked on mobile
- [ ] No Tailwind classes anywhere
- [ ] No inline `style={{}}` except for truly dynamic values
- [ ] Component renders without TypeScript errors
- [ ] Page is deployed and visible at the Vercel preview URL
