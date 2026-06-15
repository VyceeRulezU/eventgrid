import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function SecurityPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Security Infrastructure — EventGrid"
        description="Enterprise-grade row-level database security, server-validated payment gateways, and strict authorization protocols."
        url="/security"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Trust & Safety"
        title="EventGrid Security Infrastructure"
        subtitle="We implement enterprise-grade row-level database security, server-validated gateways, and strict authorization protocols."
      />

      <section className={styles.legalSection} aria-label="Security policies">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            {/* Table of Contents */}
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#sec-rls">1. Row-Level Security (RLS)</a></li>
                <li><a href="#sec-trigger">2. Server-Side Payment Triggers</a></li>
                <li><a href="#sec-secrets">3. Secret Key Protection</a></li>
                <li><a href="#sec-escrow">4. Escrow Fund Security</a></li>
              </ul>
            </nav>

            {/* Document Content */}
            <div className={styles.textContent}>
              <section id="sec-rls" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. Row-Level Security (RLS)</h2>
                <p>
                  Every data row in our PostgreSQL database is secured using Supabase RLS policies:
                </p>
                <ul>
                  <li>Planners can only read and write data belonging to their registered organization.</li>
                  <li>Coordinators can only read events and tasks they are explicitly invited to via `event_access` linkages.</li>
                  <li>Client portals are secured using UUID tokens, preventing enumeration attacks.</li>
                </ul>
              </section>

              <section id="sec-trigger" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. Server-Side Payment Triggers</h2>
                <p>
                  To prevent malicious manipulation of budget records and event states, we enforce database constraints:
                </p>
                <p>
                  Direct client-side updates attempting to change `payment_status` variables on the `events` table are blocked by database triggers. All payments must be verified server-to-server via Deno Edge Functions using private keys.
                </p>
              </section>

              <section id="sec-secrets" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. Secret Key Protection</h2>
                <p>
                  All integration keys are handled with industry standard protection models:
                </p>
                <ul>
                  <li>Private keys for Resend, Paystack, and Flutterwave are never exposed to the client application or client browser network logs.</li>
                  <li>Secrets are stored encrypted in the Supabase Vault and are only injected at runtime into isolated Deno Deno.env environments.</li>
                </ul>
              </section>

              <section id="sec-escrow" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Escrow Fund Security</h2>
                <p>
                  Vendor advances and deposit records are secured against unauthorized transfers. Payout triggers require dual validation (Planner checkoff plus database constraint verification) before disbursement commands are sent to gateway settlement API endpoints.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
