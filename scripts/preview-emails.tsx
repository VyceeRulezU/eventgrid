import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'dist', 'emails')

// Workaround: set appUrl so <EmailWrapper> can resolve the logo
const APP_URL = 'https://naligrid.com'

// Stub the EmailWrapper's appUrl default via props — we'll just render with explicit appUrl
import { EmailWrapper } from '../src/lib/emails/EmailWrapper.tsx'
import { WelcomeEmail } from '../src/lib/emails/WelcomeEmail.tsx'
import { QuickStartEmail } from '../src/lib/emails/QuickStartEmail.tsx'
import { TrialReminderEmail } from '../src/lib/emails/TrialReminderEmail.tsx'
import { FeedbackEmail } from '../src/lib/emails/FeedbackEmail.tsx'
import { PaymentEmail } from '../src/lib/emails/PaymentEmail.tsx'
import { LinkNotificationEmail } from '../src/lib/emails/LinkNotificationEmail.tsx'

interface Template {
  name: string
  filename: string
  element: JSX.Element
}

const templates: Template[] = [
  {
    name: 'Welcome Email',
    filename: 'welcome.html',
    element: <WelcomeEmail first_name="Adebayo" dashboard_url={`${APP_URL}/login`} create_event_url={`${APP_URL}/events/new`} role="planner" />,
  },
  {
    name: 'Quick Start',
    filename: 'quick-start.html',
    element: <QuickStartEmail first_name="Adebayo" create_event_url={`${APP_URL}/events/new`} />,
  },
  {
    name: 'Trial Reminder',
    filename: 'trial-reminder.html',
    element: <TrialReminderEmail first_name="Adebayo" financials_url={`${APP_URL}/financials`} />,
  },
  {
    name: 'Feedback',
    filename: 'feedback.html',
    element: <FeedbackEmail first_name="Adebayo" feedback_url={`${APP_URL}/settings`} />,
  },
  {
    name: 'Payment Confirmed',
    filename: 'payment.html',
    element: <PaymentEmail first_name="Adebayo" event_name="Wedding of Zainab & Tunde" amount="₦20,000" payment_method="Paystack" portal_url={`${APP_URL}/login`} />,
  },
  {
    name: 'Google Linked',
    filename: 'google-linked.html',
    element: <LinkNotificationEmail first_name="Adebayo" provider="google" action="linked" settings_url={`${APP_URL}/settings`} />,
  },
  {
    name: 'Google Unlinked',
    filename: 'google-unlinked.html',
    element: <LinkNotificationEmail first_name="Adebayo" provider="google" action="unlinked" settings_url={`${APP_URL}/settings`} />,
  },
  {
    name: 'Facebook Linked',
    filename: 'facebook-linked.html',
    element: <LinkNotificationEmail first_name="Adebayo" provider="facebook" action="linked" settings_url={`${APP_URL}/settings`} />,
  },
  {
    name: 'Facebook Unlinked',
    filename: 'facebook-unlinked.html',
    element: <LinkNotificationEmail first_name="Adebayo" provider="facebook" action="unlinked" settings_url={`${APP_URL}/settings`} />,
  },
]

function renderEmail(element: JSX.Element): string {
  return '<!DOCTYPE html>' + renderToStaticMarkup(element)
}

function buildIndexHtml(files: { name: string; filename: string }[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Previews — NaliGrid</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0B1120; color: #F9FAFB; padding: 32px; }
    h1 { font-size: 24px; font-weight: 300; margin-bottom: 8px; letter-spacing: -0.02em; }
    p.subtitle { color: #6B7280; font-size: 14px; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 20px; }
    .card { background: #1a2432; border: 1px solid #2a3a4e; border-radius: 12px; overflow: hidden; }
    .card summary { padding: 14px 20px; font-size: 14px; font-weight: 600; cursor: pointer; color: #D4A017; user-select: none; }
    .card summary:hover { background: #1e2a3a; }
    .card iframe { width: 100%; height: 600px; border: none; border-top: 1px solid #2a3a4e; display: block; }
  </style>
</head>
<body>
  <h1>Email Template Previews</h1>
  <p class="subtitle">Rendered with sample data. Open each to inspect.</p>
  <div class="grid">
    ${files.map((f) => `<div class="card"><details><summary>${f.name}</summary><iframe src="${f.filename}" title="${f.name}"></iframe></details></div>`).join('\n    ')}
  </div>
</body>
</html>`
}

// ── Main ──────────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true })

const files: { name: string; filename: string }[] = []

for (const t of templates) {
  const html = renderEmail(t.element)
  writeFileSync(resolve(OUT_DIR, t.filename), html, 'utf-8')
  files.push({ name: t.name, filename: t.filename })
  console.log(`  ✓ ${t.name} → dist/emails/${t.filename}`)
}

writeFileSync(resolve(OUT_DIR, 'index.html'), buildIndexHtml(files), 'utf-8')
console.log(`  ✓ index.html → dist/emails/index.html`)
console.log(`\nDone. Open dist/emails/index.html in your browser to preview.`)
