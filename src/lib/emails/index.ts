import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { WelcomeEmail } from './WelcomeEmail.tsx'
import type { WelcomeEmailProps } from './WelcomeEmail.tsx'
import { QuickStartEmail } from './QuickStartEmail.tsx'
import type { QuickStartEmailProps } from './QuickStartEmail.tsx'
import { TrialReminderEmail } from './TrialReminderEmail.tsx'
import type { TrialReminderEmailProps } from './TrialReminderEmail.tsx'
import { FeedbackEmail } from './FeedbackEmail.tsx'
import type { FeedbackEmailProps } from './FeedbackEmail.tsx'
import { PaymentEmail } from './PaymentEmail.tsx'
import type { PaymentEmailProps } from './PaymentEmail.tsx'

// Re-export templates and props
export { WelcomeEmail, QuickStartEmail, TrialReminderEmail, FeedbackEmail, PaymentEmail }
export type { WelcomeEmailProps, QuickStartEmailProps, TrialReminderEmailProps, FeedbackEmailProps, PaymentEmailProps }

/**
 * Strips HTML tags and formats spacing to generate a readable plain-text fallback.
 */
export function convertHtmlToText(html: string): string {
  return html
    .replace(/<style([\s\S]*?)<\/style>/gi, '')
    .replace(/<script([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/div>/ig, '\n')
    .replace(/<\/li>/ig, '\n')
    .replace(/<li>/ig, ' * ')
    .replace(/<\/p>/ig, '\n\n')
    .replace(/<br\s*\/?>/ig, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

/**
 * Transactional Email Definitions
 */
export type OnboardingEmailType = 'welcome' | 'quick_start' | 'trial_reminder' | 'feedback' | 'payment'

export interface EmailRenderResult {
  subject: string
  html: string
  text: string
}

/**
 * Helper function to render any onboarding email template by type and props.
 */
export function renderOnboardingEmail(
  type: OnboardingEmailType,
  props: Record<string, any>
): EmailRenderResult {
  let element: React.ReactElement
  let subject: string

  switch (type) {
    case 'welcome':
      subject = `Welcome to EventGrid, ${props.first_name || 'there'}! 🎉`
      element = React.createElement(WelcomeEmail, {
        first_name: props.first_name || 'there',
        dashboard_url: props.dashboard_url || 'https://eventgrid.ng/login',
      })
      break

    case 'quick_start':
      subject = `Onboarding Step 1: Launch your first event 🚀`
      element = React.createElement(QuickStartEmail, {
        first_name: props.first_name || 'there',
        create_event_url: props.create_event_url || 'https://eventgrid.ng/events/new',
      })
      break

    case 'trial_reminder':
      subject = `Say goodbye to Excel payment grids, ${props.first_name || 'there'} 💸`
      element = React.createElement(TrialReminderEmail, {
        first_name: props.first_name || 'there',
        financials_url: props.financials_url || 'https://eventgrid.ng/financials',
      })
      break

    case 'feedback':
      subject = `How is EventGrid working out for you, ${props.first_name || 'there'}? 💬`
      element = React.createElement(FeedbackEmail, {
        first_name: props.first_name || 'there',
        feedback_url: props.feedback_url || 'https://eventgrid.ng/settings',
      })
      break

    case 'payment':
      subject = `Payment Confirmed: ${props.amount || '₦0'} for ${props.event_name || 'Event'} 💳`
      element = React.createElement(PaymentEmail, {
        first_name: props.first_name || 'Valued User',
        event_name: props.event_name || 'Event',
        amount: props.amount || '₦0',
        payment_method: props.payment_method || 'Card',
        portal_url: props.portal_url || 'https://eventgrid.ng/login',
      })
      break

    default:
      throw new Error(`Unsupported email type: ${type}`)
  }

  const html = '<!DOCTYPE html>' + renderToStaticMarkup(element)
  const text = convertHtmlToText(html)

  return { subject, html, text }
}
