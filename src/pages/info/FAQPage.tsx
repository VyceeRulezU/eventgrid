import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import styles from './InfoPages.module.css'

const FAQS = [
  {
    category: 'General',
    items: [
      {
        question: 'What is EventGrid?',
        answer: 'EventGrid is a premium, multi-role event management workspace. We help planners, venue coordinators, and vendors collaborate in real-time, trace phase milestones, and manage secure contract payouts.'
      },
      {
        question: 'How do I invite team members?',
        answer: 'Once you create an event, you can go to the "Team" tab and send an invite to coordinators, team members, or vendors. They will receive a secure email link to sign up and access their custom dashboard.'
      }
    ]
  },
  {
    category: 'Coordinators & Operations',
    items: [
      {
        question: 'How do on-site checklists synchronize?',
        answer: 'When a coordinator checks off a task, it updates in real-time on the master planner dashboard. If the team is operating in an offline area, checklists save locally and sync immediately when a connection is restored.'
      },
      {
        question: 'What is the Live Feed board?',
        answer: 'The Live Feed is a websocket-powered timeline that broadcasts active checklists, vendor logs, and schedule overruns on a screen during event day operations.'
      }
    ]
  },
  {
    category: 'Payments & Security',
    items: [
      {
        question: 'How secure are event payments?',
        answer: 'Extremely secure. All event activations are verified server-to-server via our API. Payment status variables are protected from client-side direct database write modifications using database constraints.'
      },
      {
        question: 'How are vendor payouts handled?',
        answer: 'Deposits and contract balances are secured. Planners can track milestones on their financial spreadsheets and authorize transfers directly to verified vendor bank accounts.'
      }
    ]
  }
]

export function FAQPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="FAQ — EventGrid Help Center"
        description="Find answers about EventGrid's event management platform — team invites, live board, payments, security, and vendor coordination."
        url="/faq"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Help & FAQ"
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about setting up event pipelines, coordinator invitations, and payment security."
      />

      <FaqSection items={FAQS} />

      <LandingCTA
        title="Still have questions?"
        description="Our customer operations support desk is available 24/7. Send us your inquiry."
        primaryText="Contact Support"
        primaryHref="/contact"
      />

      <Footer />
    </div>
  )
}
