import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function PrivacyPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Privacy Policy — EventGrid"
        description="Learn how EventGrid collects, protects, and handles your personal information in compliance with the Nigeria Data Protection Act."
        url="/privacy"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Legal Documents"
        title="Privacy Policy"
        subtitle="Last updated: June 9, 2026. This policy explains how EventGrid collects, protects, and handles your data."
      />

      <section className={styles.legalSection} aria-label="Privacy terms">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#intro">1. Introduction</a></li>
                <li><a href="#role">2. Our Role: Controller and Processor</a></li>
                <li><a href="#collect">3. Information We Collect</a></li>
                <li><a href="#use">4. How We Use Information</a></li>
                <li><a href="#legal-basis">5. Legal Basis for Processing</a></li>
                <li><a href="#share">6. Sharing Your Information</a></li>
                <li><a href="#retention">7. Data Retention</a></li>
                <li><a href="#security">8. Data Security</a></li>
                <li><a href="#rights">9. Your Rights</a></li>
                <li><a href="#children">10. Children's Information</a></li>
                <li><a href="#cookies">11. Cookies and Similar Technologies</a></li>
                <li><a href="#changes">12. Changes to This Policy</a></li>
                <li><a href="#contact">13. Contact Us</a></li>
              </ul>
            </nav>

            <div className={styles.textContent}>
              <section id="intro" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. Introduction</h2>
                <p>This Privacy Policy explains how NaliTech Consults Limited collects, uses, shares, and protects personal information through the EventGrid platform ("Platform").</p>
                <p>We are committed to handling personal information responsibly and in accordance with the Nigeria Data Protection Act 2023 and the Nigeria Data Protection Regulation 2019.</p>
              </section>

              <section id="role" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. Our Role: Controller and Processor</h2>
                <p>NaliTech acts in two different capacities depending on the type of data:</p>
                <p><strong>As a Data Controller</strong> — for account information you provide directly to us (such as your name, email, phone number, and business details when you register), NaliTech determines how and why this data is processed, and is the controller for this data.</p>
                <p><strong>As a Data Processor</strong> — for information about other individuals that Planners or Coordinators input into the Platform (such as guest lists, client contact details, or vendor contacts — "Event Data"), the Planner or Coordinator who entered that data is the controller, and NaliTech processes it only on their instructions, as described in our Terms of Service.</p>
                <p>If you are a guest, client, or vendor whose information has been added to the Platform by a Planner or Coordinator, your relationship for data protection purposes is primarily with that Planner or Coordinator, who can address requests regarding your data. NaliTech will support such requests as the processor.</p>
              </section>

              <section id="collect" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. Information We Collect</h2>
                <h3 className={styles.subTitle}>3.1 Account Information</h3>
                <p>Name, email address, phone number, business/organisation name, role (Planner, Coordinator, Vendor, Client), and password (stored securely, encrypted).</p>
                <h3 className={styles.subTitle}>3.2 Event Data</h3>
                <p>Information entered by Planners and Coordinators about events, including event details, vendor records, task assignments, guest lists (names, contact details, RSVP status, dietary or accessibility notes, table assignments), team member information, and budget/financial entries.</p>
                <h3 className={styles.subTitle}>3.3 Payment Information</h3>
                <p>When you activate an event, payment is processed by third-party processors (Paystack and/or Flutterwave). We receive confirmation of payment status and a transaction reference, but we do not collect or store your full card details.</p>
                <h3 className={styles.subTitle}>3.4 Media and Documents</h3>
                <p>Photographs, documents, and files you upload (such as event photos, contracts, proposals, and receipts).</p>
                <h3 className={styles.subTitle}>3.5 Usage and Device Information</h3>
                <p>Information about how you use the Platform, including log data, device type, browser type, and approximate location (derived from IP address), for security and product improvement purposes.</p>
              </section>

              <section id="use" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. How We Use Information</h2>
                <ul>
                  <li>Provide, operate, and maintain the Platform</li>
                  <li>Process payments and activate events</li>
                  <li>Enable communication between Planners, Coordinators, Vendors, and Clients within the context of an event</li>
                  <li>Send service-related notifications (such as task assignments, issue alerts, and payment confirmations)</li>
                  <li>Improve and develop the Platform, including through aggregated, de-identified usage analysis</li>
                  <li>Maintain security, prevent fraud, and enforce our Terms of Service</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section id="legal-basis" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>5. Legal Basis for Processing</h2>
                <p>Where required under the NDPA, we process personal information on the basis of:</p>
                <ul>
                  <li><strong>Performance of a contract</strong> — to provide the Platform services you have signed up for</li>
                  <li><strong>Consent</strong> — for example, where you confirm you have a lawful basis to add a guest's information, or opt into beta features</li>
                  <li><strong>Legitimate interest</strong> — for security, fraud prevention, and service improvement, balanced against your rights</li>
                  <li><strong>Legal obligation</strong> — where processing is required by Nigerian law</li>
                </ul>
              </section>

              <section id="share" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>6. Sharing Your Information</h2>
                <p>We do not sell personal information. We share information with the following categories of third parties, solely to operate the Platform:</p>
                <table className={styles.legalTable}>
                  <thead><tr><th>Third Party</th><th>Purpose</th><th>Location</th></tr></thead>
                  <tbody>
                    <tr><td>Supabase</td><td>Database hosting, authentication, file storage</td><td>Cloud infrastructure (region varies)</td></tr>
                    <tr><td>Cloudflare (R2)</td><td>Media and file storage</td><td>Global CDN</td></tr>
                    <tr><td>Paystack / Flutterwave</td><td>Payment processing</td><td>Nigeria-licensed payment processors</td></tr>
                    <tr><td>Resend</td><td>Transactional email delivery</td><td>Cloud infrastructure</td></tr>
                    <tr><td>Vercel</td><td>Website and application hosting</td><td>Global CDN</td></tr>
                  </tbody>
                </table>
                <h3 className={styles.subTitle}>6.1 International Data Transfers</h3>
                <p>Some of the providers listed above process data on servers located outside Nigeria. Where this occurs, we take reasonable steps to ensure these providers maintain adequate security and data protection standards consistent with the NDPA's requirements for cross-border data transfer. By using the Platform, you acknowledge that your information may be processed outside Nigeria as described in this section.</p>
              </section>

              <section id="retention" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>7. Data Retention</h2>
                <p>We retain account information for as long as your account is active. Event Data is retained for the duration of the event lifecycle and for a reasonable period afterward to support reporting and historical records, unless you request earlier deletion.</p>
                <p>Guest information (names, contact details, dietary notes, etc.) is retained as part of Event Data under the same terms. We recommend Planners review and remove guest information they no longer need once an event has concluded.</p>
                <p>If you close your account, we will delete or anonymise your personal information within a reasonable period, except where retention is required for legal, accounting, or fraud-prevention purposes.</p>
              </section>

              <section id="security" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>8. Data Security</h2>
                <p>We use industry-standard security measures to protect your information, including encrypted connections (HTTPS), encrypted password storage, and role-based access controls that restrict who can view sensitive information (for example, financial data is visible only to the Planner who entered it).</p>
                <p>No system is completely secure, and we cannot guarantee absolute security of information transmitted to or stored on the Platform.</p>
              </section>

              <section id="rights" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>9. Your Rights</h2>
                <p>Under the NDPA, you have the right to:</p>
                <ul>
                  <li><strong>Access</strong> the personal information we hold about you</li>
                  <li><strong>Correct</strong> inaccurate or incomplete information</li>
                  <li><strong>Request deletion</strong> of your personal information, subject to legal retention requirements</li>
                  <li><strong>Object to</strong> or <strong>restrict</strong> certain processing</li>
                  <li><strong>Data portability</strong> — receive your data in a structured, commonly used format</li>
                  <li><strong>Withdraw consent</strong> where processing is based on consent</li>
                  <li><strong>Lodge a complaint</strong> with the Nigeria Data Protection Commission (NDPC) if you believe your rights have been violated</li>
                </ul>
                <p>To exercise these rights regarding your account information, contact us using the details below. If your information was added to the Platform by a Planner or Coordinator as part of Event Data (for example, as a guest), please also contact that Planner or Coordinator directly, as they control that data.</p>
              </section>

              <section id="children" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>10. Children's Information</h2>
                <p>The Platform is not directed at individuals under 18, and account registration requires users to be 18 or older.</p>
                <p>We recognise that guest lists managed by Planners may include information about minors (for example, children attending a family event). Where this occurs, the Planner is responsible as the data controller for ensuring appropriate care is taken with such information, including limiting what is collected to what is necessary for the event.</p>
              </section>

              <section id="cookies" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>11. Cookies and Similar Technologies</h2>
                <p>The Platform uses limited cookies and local storage, primarily to keep you logged in and remember your preferences. See our <a href="/cookies">Cookie Policy</a> for details.</p>
              </section>

              <section id="changes" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>12. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify users of material changes via the Platform or email, and update the "Effective Date" above.</p>
              </section>

              <section id="contact" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>13. Contact Us</h2>
                <p>For privacy-related questions or to exercise your rights under the NDPA, contact:</p>
                <p><strong>privacy@eventgrid.ng</strong><br />NaliTech Consults Limited<br />Abuja, Nigeria</p>
                <p>You may also lodge a complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> via their official channels.</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
