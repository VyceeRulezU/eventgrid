# EventGrid — UI Guidelines & Design System
## Agent Context Document 05
**For:** Antigravity / Cursor AI Agent
**Version:** 2.0 (Vanilla CSS)

---

## Styling Approach

EventGrid uses **vanilla CSS with CSS custom properties**. No Tailwind. No CSS-in-JS. No utility frameworks.

Structure:
- `src/styles/tokens.css` — all design tokens (imported once in `main.tsx`)
- `src/styles/global.css` — resets, base element styles, typography
- `src/styles/components.css` — shared component classes used across the app
- Per-component `.module.css` files — component-scoped styles using CSS Modules
- All token variables available globally via `:root`

Never hardcode hex values in component stylesheets. Always reference a token variable.

---

## Design Philosophy

EventGrid is a **professional operations tool** used on mobile under pressure — inside venues, at night, in low light. The UI must be:

- **Fast to scan** — status and priority readable at a glance
- **Touch-friendly** — minimum 44px tap targets everywhere
- **Premium** — gold/black signals quality in the Nigerian market
- **Reliable feeling** — dense data organised, never cluttered

---

## tokens.css

```css
/* src/styles/tokens.css */
/* Import first in main.tsx — all other files consume these variables */

:root {

  /* ─── Brand ─────────────────────────────────────── */
  --color-bg-base:           #111827;
  --color-accent:            #D4A017;
  --color-accent-hover:      #B8860B;
  --color-accent-muted:      rgba(212, 160, 23, 0.15);
  --color-accent-border:     rgba(212, 160, 23, 0.25);

  /* ─── Surface Hierarchy ──────────────────────────── */
  /* Prevents flat all-black look — cards sit above the base */
  --color-surface-1:         #1F2937;   /* Sidebar, section backgrounds */
  --color-surface-2:         #374151;   /* Cards, modals, panels */
  --color-surface-3:         #4B5563;   /* Inputs, tags, tertiary elements */
  --color-surface-hover:     #2D3748;   /* Hover state on surface-1 items */

  /* ─── Text ───────────────────────────────────────── */
  --color-text-primary:      #F9FAFB;
  --color-text-secondary:    #9CA3AF;
  --color-text-muted:        #6B7280;
  --color-text-inverse:      #111827;   /* Text on gold backgrounds */
  --color-text-accent:       #D4A017;

  /* ─── Borders ────────────────────────────────────── */
  --color-border:            #374151;
  --color-border-subtle:     #1F2937;
  --color-border-focus:      #D4A017;

  /* ─── Status (Live Board, Badges) ────────────────── */
  --color-status-green:      #22C55E;
  --color-status-green-bg:   rgba(34, 197, 94, 0.10);
  --color-status-yellow:     #EAB308;
  --color-status-yellow-bg:  rgba(234, 179, 8, 0.10);
  --color-status-red:        #EF4444;
  --color-status-red-bg:     rgba(239, 68, 68, 0.10);
  --color-status-grey:       #6B7280;
  --color-status-grey-bg:    rgba(107, 114, 128, 0.10);

  /* ─── Semantic ───────────────────────────────────── */
  --color-success:           #22C55E;
  --color-success-bg:        rgba(34, 197, 94, 0.10);
  --color-warning:           #EAB308;
  --color-warning-bg:        rgba(234, 179, 8, 0.10);
  --color-error:             #EF4444;
  --color-error-bg:          rgba(239, 68, 68, 0.10);
  --color-info:              #3B82F6;
  --color-info-bg:           rgba(59, 130, 246, 0.10);

  /* ─── Payment Status ─────────────────────────────── */
  --color-payment-unpaid:    var(--color-error);
  --color-payment-unpaid-bg: var(--color-error-bg);
  --color-payment-advance:   var(--color-warning);
  --color-payment-advance-bg:var(--color-warning-bg);
  --color-payment-paid:      var(--color-success);
  --color-payment-paid-bg:   var(--color-success-bg);

  /* ─── Typography ─────────────────────────────────── */
  --font-base:               'Plus Jakarta Sans', sans-serif;

  --text-display:            2rem;       /* 32px */
  --text-title-lg:           1.5rem;     /* 24px */
  --text-title:              1.25rem;    /* 20px */
  --text-subtitle:           1.125rem;   /* 18px */
  --text-base:               1rem;       /* 16px */
  --text-sm:                 0.875rem;   /* 14px */
  --text-xs:                 0.75rem;    /* 12px */

  --weight-regular:          400;
  --weight-medium:           500;
  --weight-semibold:         600;
  --weight-bold:             700;
  --weight-extrabold:        800;

  --leading-tight:           1.25;
  --leading-normal:          1.5;
  --leading-relaxed:         1.75;

  /* ─── Spacing ────────────────────────────────────── */
  --space-1:                 0.25rem;    /* 4px */
  --space-2:                 0.5rem;     /* 8px */
  --space-3:                 0.75rem;    /* 12px */
  --space-4:                 1rem;       /* 16px */
  --space-5:                 1.25rem;    /* 20px */
  --space-6:                 1.5rem;     /* 24px */
  --space-8:                 2rem;       /* 32px */
  --space-10:                2.5rem;     /* 40px */
  --space-12:                3rem;       /* 48px */
  --space-16:                4rem;       /* 64px */

  /* ─── Border Radius ──────────────────────────────── */
  --radius-sm:               0.375rem;   /* 6px */
  --radius-md:               0.5rem;     /* 8px */
  --radius-lg:               0.75rem;    /* 12px */
  --radius-xl:               1rem;       /* 16px */
  --radius-full:             9999px;

  /* ─── Shadows ────────────────────────────────────── */
  --shadow-sm:               0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md:               0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg:               0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-gold:             0 0 0 2px var(--color-accent);

  /* ─── Transitions ────────────────────────────────── */
  --transition-fast:         150ms ease;
  --transition-base:         200ms ease;
  --transition-slow:         300ms ease;

  /* ─── Z-Index ────────────────────────────────────── */
  --z-base:                  0;
  --z-dropdown:              100;
  --z-sticky:                200;
  --z-overlay:               300;
  --z-modal:                 400;
  --z-toast:                 500;

  /* ─── Layout ─────────────────────────────────────── */
  --sidebar-width:           240px;
  --sidebar-collapsed-width: 72px;
  --bottom-bar-height:       64px;
  --top-bar-height:          56px;
  --page-padding-x:          var(--space-4);     /* mobile */
  --page-padding-x-md:       var(--space-6);     /* tablet */
  --page-padding-x-xl:       var(--space-8);     /* desktop */
  --content-max-width:       1200px;
}
```

---

## global.css

```css
/* src/styles/global.css */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
@import './tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-base);
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Typography defaults ── */
h1 { font-size: var(--text-display);  font-weight: var(--weight-bold);     line-height: var(--leading-tight); }
h2 { font-size: var(--text-title-lg); font-weight: var(--weight-bold);     line-height: var(--leading-tight); }
h3 { font-size: var(--text-title);    font-weight: var(--weight-semibold); line-height: var(--leading-tight); }
h4 { font-size: var(--text-subtitle); font-weight: var(--weight-semibold); }
h5 { font-size: var(--text-base);     font-weight: var(--weight-semibold); }

p  { color: var(--color-text-primary); line-height: var(--leading-relaxed); }

a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color var(--transition-fast);
}
a:hover { color: var(--color-accent-hover); }

button {
  font-family: var(--font-base);
  cursor: pointer;
  border: none;
  background: none;
}

input, textarea, select {
  font-family: var(--font-base);
  font-size: var(--text-sm);
}

img, video {
  max-width: 100%;
  display: block;
}

/* ── Focus visible (keyboard nav) ── */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* ── Scrollbar ── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-surface-1); }
::-webkit-scrollbar-thumb { background: var(--color-surface-3); border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }

/* ── Selection ── */
::selection {
  background-color: var(--color-accent-muted);
  color: var(--color-text-primary);
}
```

---

## components.css

Shared classes used across many components. Not utility classes — actual component abstractions.

```css
/* src/styles/components.css */

/* ── Buttons ── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  font-family: var(--font-base);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color var(--transition-fast),
              color var(--transition-fast),
              border-color var(--transition-fast),
              transform var(--transition-fast);
  white-space: nowrap;
  text-decoration: none;
}

.btn:active { transform: scale(0.97); }
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-primary {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  border-color: var(--color-accent);
}
.btn-primary:hover {
  background-color: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
.btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
  border-color: transparent;
}
.btn-ghost:hover {
  background-color: var(--color-surface-2);
  color: var(--color-text-primary);
}

.btn-destructive {
  background-color: transparent;
  color: var(--color-error);
  border-color: var(--color-error);
}
.btn-destructive:hover {
  background-color: var(--color-error-bg);
}

.btn-sm {
  min-height: 36px;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.btn-lg {
  min-height: 52px;
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}

.btn-icon {
  width: 44px;
  min-height: 44px;
  padding: 0;
  flex-shrink: 0;
}

/* ── Cards ── */

.card {
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .card { padding: var(--space-6); }
}

.card-elevated {
  background-color: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}

.card-interactive {
  cursor: pointer;
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast);
}
.card-interactive:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-accent-border);
}

/* ── Inputs ── */

.input {
  width: 100%;
  min-height: 44px;
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  font-family: var(--font-base);
  transition: border-color var(--transition-fast);
  outline: none;
}

.input::placeholder { color: var(--color-text-muted); }

.input:focus {
  border-color: var(--color-border-focus);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error { border-color: var(--color-error); }

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.input-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-label .required {
  color: var(--color-accent);
  margin-left: 2px;
}

.input-error-msg {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.input-helper {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Currency input — ₦ prefix */
.input-currency-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-currency-prefix {
  position: absolute;
  left: var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  pointer-events: none;
  z-index: 1;
}

.input-currency {
  padding-left: calc(var(--space-4) + 1.25rem);
  text-align: right;
}

/* ── Badges ── */

.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge-green  { background-color: var(--color-status-green-bg);  color: var(--color-status-green);  }
.badge-yellow { background-color: var(--color-status-yellow-bg); color: var(--color-status-yellow); }
.badge-red    { background-color: var(--color-status-red-bg);    color: var(--color-status-red);    }
.badge-grey   { background-color: var(--color-status-grey-bg);   color: var(--color-status-grey);   }

.badge-green  .badge-dot { background-color: var(--color-status-green);  }
.badge-yellow .badge-dot { background-color: var(--color-status-yellow); }
.badge-red    .badge-dot { background-color: var(--color-status-red);    }
.badge-grey   .badge-dot { background-color: var(--color-status-grey);   }

/* Payment status badges */
.badge-unpaid  { background-color: var(--color-payment-unpaid-bg);  color: var(--color-payment-unpaid);  }
.badge-advance { background-color: var(--color-payment-advance-bg); color: var(--color-payment-advance); }
.badge-paid    { background-color: var(--color-payment-paid-bg);    color: var(--color-payment-paid);    }

/* Priority badges */
.badge-low     { background-color: var(--color-status-grey-bg);   color: var(--color-status-grey);   }
.badge-medium  { background-color: var(--color-info-bg);           color: var(--color-info);           }
.badge-high    { background-color: var(--color-status-yellow-bg);  color: var(--color-status-yellow);  }
.badge-urgent  { background-color: var(--color-status-red-bg);     color: var(--color-status-red);     }

/* ── Dividers ── */
.divider {
  height: 1px;
  background-color: var(--color-border-subtle);
  border: none;
  margin: var(--space-4) 0;
}

/* ── Section Label ── */
.section-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-16) var(--space-8);
}

.empty-state__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
}

.empty-state__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.empty-state__description {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  max-width: 220px;
  line-height: var(--leading-relaxed);
}

.empty-state .btn {
  margin-top: var(--space-4);
}

/* ── Skeleton Loading ── */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-2) 0%,
    var(--color-surface-3) 50%,
    var(--color-surface-2) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text  { height: 14px; width: 100%; margin-bottom: var(--space-2); }
.skeleton-title { height: 20px; width: 60%; margin-bottom: var(--space-3); }
.skeleton-card  { height: 80px; width: 100%; border-radius: var(--radius-xl); }

/* ── Toasts ── */
.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface-2);
  border-radius: var(--radius-lg);
  border-left: 4px solid;
  box-shadow: var(--shadow-lg);
  max-width: 360px;
  width: 100%;
}

.toast-success { border-color: var(--color-success); }
.toast-error   { border-color: var(--color-error);   }
.toast-warning { border-color: var(--color-warning);  }
.toast-info    { border-color: var(--color-info);     }

.toast__icon { flex-shrink: 0; margin-top: 2px; }
.toast__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}
.toast__body {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: var(--z-overlay);
  display: flex;
  align-items: flex-end;     /* bottom sheet on mobile */
  justify-content: center;
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;     /* centered on tablet/desktop */
  }
}

.modal {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--space-6);
  z-index: var(--z-modal);
}

@media (min-width: 768px) {
  .modal {
    width: 520px;
    border-radius: var(--radius-xl);
    max-height: 80vh;
  }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.modal__title {
  font-size: var(--text-subtitle);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

/* ── Page Layout Shell ── */
.app-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-base);
}

.app-shell__main {
  flex: 1;
  min-width: 0;
  padding-bottom: var(--bottom-bar-height); /* mobile bottom bar offset */
}

@media (min-width: 768px) {
  .app-shell__main {
    padding-bottom: 0;
    margin-left: var(--sidebar-collapsed-width);
  }
}

@media (min-width: 1024px) {
  .app-shell__main {
    margin-left: var(--sidebar-width);
  }
}

.page-content {
  padding: var(--space-4) var(--page-padding-x);
}

@media (min-width: 768px) {
  .page-content { padding: var(--space-6) var(--page-padding-x-md); }
}

@media (min-width: 1280px) {
  .page-content {
    padding: var(--space-8) var(--page-padding-x-xl);
    max-width: var(--content-max-width);
    margin: 0 auto;
  }
}

/* ── Dashboard Grid ── */
.dashboard-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1280px) {
  .dashboard-grid { grid-template-columns: repeat(4, 1fr); }
}

/* ── Live Board Grid ── */
.live-board-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .live-board-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1280px) {
  .live-board-grid { grid-template-columns: repeat(3, 1fr); }
}

/* ── Financial Table ── */
.financial-table-wrapper {
  overflow-x: auto;
  margin: 0 calc(-1 * var(--page-padding-x));
  padding: 0 var(--page-padding-x);
}

.financial-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.financial-table th {
  text-align: left;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.financial-table th.col-amount,
.financial-table td.col-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.financial-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.financial-table tr:hover td {
  background-color: var(--color-surface-1);
}

/* Category group header row */
.financial-table .category-row td {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: var(--space-2) var(--space-3);
  border-bottom: none;
}

/* Balance column colouring */
.financial-table .col-balance.is-outstanding { color: var(--color-error); }
.financial-table .col-balance.is-settled     { color: var(--color-success); }

/* Footer total row */
.financial-table tfoot tr td {
  border-top: 2px solid var(--color-border);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  padding-top: var(--space-4);
}
```

---

## CSS Modules Pattern (Per-Component)

Each component has its own `.module.css`. Import it as `styles`:

```tsx
// Sidebar.tsx
import styles from './Sidebar.module.css'

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>...</div>
      <nav className={styles.nav}>...</nav>
    </aside>
  )
}
```

```css
/* Sidebar.module.css */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-collapsed-width);
  background-color: var(--color-surface-1);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sticky);
  transition: width var(--transition-slow);
}

@media (min-width: 1024px) {
  .sidebar { width: var(--sidebar-width); }
}

.logo {
  padding: var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) 0;
}

.navItem {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  border-radius: var(--radius-lg);
  margin: 0 var(--space-2);
  transition: background-color var(--transition-fast),
              color var(--transition-fast);
  text-decoration: none;
  min-height: 44px;
}

.navItem:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.navItem.active {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
}

/* Hide text labels on collapsed sidebar */
.navItem span {
  display: none;
}

@media (min-width: 1024px) {
  .navItem span { display: block; }
}
```

---

## main.tsx Import Order

```tsx
// src/main.tsx
import './styles/tokens.css'    // 1st — tokens must be available to everything
import './styles/global.css'    // 2nd — resets and base styles
import './styles/components.css' // 3rd — shared component classes
```

Component `.module.css` files are imported in their respective component files — never globally.

---

## Breakpoints Reference

| Name | Width | Primary Target |
|---|---|---|
| Mobile | 360px–767px | Phone (PRIMARY) |
| Tablet | 768px–1023px | iPad, Android tablet |
| Laptop | 1024px–1279px | Laptop |
| Desktop | 1280px+ | Full dashboard |

All media queries are `min-width` (mobile-first). Never use `max-width` unless unavoidable.

---

## Accessibility Rules

- All interactive elements: `min-height: 44px; min-width: 44px`
- Focus rings: handled globally in `global.css` via `:focus-visible`
- Never rely on colour alone — pair status colours with text labels
- Financial module: hidden from navigation entirely for non-planners (not greyed out, not visible)
- ARIA labels on all icon-only buttons: `aria-label="Flag issue"`
- All form inputs associated with `<label>` via `htmlFor` / `id`

---

## Do Not

- Do not hardcode any hex value in a component file — use a token variable
- Do not install Tailwind, styled-components, emotion, or any CSS-in-JS library
- Do not use inline `style={{}}` except for dynamic values (e.g. computed widths, progress percentages)
- Do not use white backgrounds — the entire app is dark-themed
- Do not use more than one `.btn-primary` per view — hierarchy collapses
- Do not show the financial module link in navigation for non-planner roles — remove it from the DOM entirely
- Do not use `!important` — specificity issues indicate a structural problem, fix it properly
- Do not stack multiple modals
- Do not use red for anything other than errors, blocked states, or critical issues
