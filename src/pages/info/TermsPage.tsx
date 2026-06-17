import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import Footer from '@/pages/landing/Footer'
import styles from './LegalPages.module.css'

export function TermsPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Terms of Service — NaliGrid"
        description="Read the terms governing your access to and use of the NaliGrid platform for event management."
        url="/terms"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Legal Documents"
        title="Terms of Service"
        subtitle="Last updated: June 9, 2026. These terms govern your access to and use of the NaliGrid platform."
      />

      <section className={styles.legalSection} aria-label="Terms of Service">
        <div className={styles.container}>
          <div className={styles.legalLayout}>
            <nav className={styles.sideNav} aria-label="Document index">
              <ul>
                <li><a href="#about">1. About These Terms</a></li>
                <li><a href="#beta">2. Beta / Early Access Status</a></li>
                <li><a href="#who">3. Who Can Use NaliGrid</a></li>
                <li><a href="#roles">4. Account Roles</a></li>
                <li><a href="#responsibilities">5. Your Responsibilities</a></li>
                <li><a href="#data">6. Data You Add to the Platform</a></li>
                <li><a href="#fees">7. Fees and Payments</a></li>
                <li><a href="#vendor">8. Vendor Directory</a></li>
                <li><a href="#ip">9. Intellectual Property</a></li>
                <li><a href="#acceptable">10. Acceptable Use</a></li>
                <li><a href="#availability">11. Service Availability</a></li>
                <li><a href="#liability">12. Limitation of Liability</a></li>
                <li><a href="#termination">13. Termination</a></li>
                <li><a href="#changes">14. Changes to These Terms</a></li>
                <li><a href="#governing">15. Governing Law</a></li>
                <li><a href="#contact">16. Contact</a></li>
              </ul>
            </nav>

            <div className={styles.textContent}>
              <section id="about" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>1. About These Terms</h2>
                <p>These Terms of Service ("Terms") govern your access to and use of the NaliGrid platform, including our website, web application, and any related services (collectively, the "Platform"). The Platform is owned and operated by NaliTech Consults Limited, a company registered in Nigeria.</p>
                <p><strong>Brand name note:</strong> The Platform may currently or in future operate under the name "EventGrid" or another brand name. References to "EventGrid" in these Terms refer to the Platform as operated by NaliTech Consults Limited regardless of the brand name in use at any given time. A change of brand name does not affect the validity of these Terms or any agreement formed under them.</p>
                <p>By creating an account or using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.</p>
              </section>

              <section id="beta" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>2. Beta / Early Access Status</h2>
                <p>The Platform is currently in a beta or early access phase. By using it during this phase, you acknowledge that:</p>
                <ul>
                  <li>Features may change, be added, or be removed without notice</li>
                  <li>Bugs, errors, or unexpected behaviour may occur</li>
                  <li>We will make reasonable efforts to preserve your data, but cannot guarantee uninterrupted availability during this phase</li>
                  <li>Beta access may be offered at reduced or waived cost, and standard pricing may apply after the beta period ends, with reasonable notice given beforehand</li>
                </ul>
              </section>

              <section id="who" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>3. Who Can Use NaliGrid</h2>
                <p>You must be at least 18 years old (or the age of majority in your jurisdiction) and able to enter into a binding contract to create an account. By registering, you confirm that the information you provide is accurate and that you have the authority to act on behalf of any business or organisation you represent.</p>
              </section>

              <section id="roles" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>4. Account Roles</h2>
                <p>The Platform supports multiple account roles, each with different access levels:</p>
                <ul>
                  <li><strong>Planner</strong> — full access to event planning, vendor management, financials, and client tools for events they create</li>
                  <li><strong>Coordinator</strong> — access to coordination tools either as an invited collaborator on a Planner's event, or as a standalone account for self-managed coordination projects</li>
                  <li><strong>Vendor</strong> — limited access to view and respond to bookings, deliverables, and event-day status for events they are invited to</li>
                  <li><strong>Client</strong> — read-only access to a specific event's progress via a shared portal link, without requiring an account</li>
                </ul>
                <p>Each role has different visibility into Platform data. In particular, financial information entered by a Planner is visible only to that Planner and is not shared with Coordinators, Vendors, or Clients.</p>
              </section>

              <section id="responsibilities" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>5. Your Responsibilities</h2>
                <p>You agree to:</p>
                <ul>
                  <li>Provide accurate information when creating an account or events</li>
                  <li>Keep your login credentials secure and confidential</li>
                  <li>Use the Platform only for lawful purposes related to planning, coordinating, or participating in real events</li>
                  <li>Not attempt to access data, accounts, or areas of the Platform you are not authorised to access</li>
                  <li>Not use the Platform to harass, defraud, or harm any other person</li>
                </ul>
              </section>

              <section id="data" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>6. Data You Add to the Platform</h2>
                <h3 className={styles.subTitle}>6.1 Event and Guest Data</h3>
                <p>As a Planner or Coordinator, you may input information about your clients, guests, vendors, and team members ("Event Data"). This may include names, contact details, dietary or accessibility information, RSVP status, and payment details related to your event.</p>
                <h3 className={styles.subTitle}>6.2 Your Role as Data Controller</h3>
                <p>Where you input personal information about other individuals (such as guests, clients, or vendor contacts), you act as the data controller for that information, and NaliTech acts as a data processor, processing that information solely on your instructions and for the purpose of providing the Platform to you.</p>
                <p>This means:</p>
                <ul>
                  <li>You are responsible for ensuring you have a lawful basis to collect and store this information (for example, that you have informed the individual their data will be processed and, where required, obtained their consent)</li>
                  <li>You are responsible for responding to requests from those individuals regarding their data (such as requests for access, correction, or deletion), though the Platform provides tools to help you fulfil such requests</li>
                  <li>NaliTech will process Event Data only as necessary to provide, maintain, and improve the Platform, and in accordance with our Privacy Policy</li>
                </ul>
              </section>

              <section id="fees" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>7. Fees and Payments</h2>
                <p><strong>7.1 Pricing Model.</strong> NaliGrid currently uses a per-event activation model. Planners pay a one-time fee to activate full features for a specific event, based on the event's size tier. Coordinators using standalone projects pay per project. Pricing is displayed in Nigerian Naira (₦) at the time of activation.</p>
                <p><strong>7.2 Payment Processing.</strong> Payments are processed through third-party payment processors (currently Paystack and/or Flutterwave). NaliTech does not store your card details. Your payment information is subject to the relevant processor's terms and privacy policy.</p>
                <p><strong>7.3 Refunds.</strong> Activation fees are generally non-refundable once an event has been activated and Platform features have been unlocked. If you experience a technical issue that prevented you from using the Platform as intended, contact us and we will review refund requests on a case-by-case basis.</p>
                <p><strong>7.4 Beta Pricing.</strong> During the beta period, certain users may be offered free or discounted activation via promotional codes. These promotions are offered at our discretion and may be withdrawn or changed at any time.</p>
              </section>

              <section id="vendor" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>8. Vendor Directory</h2>
                <p>The Platform includes a vendor directory containing both vendor records added by individual Planners (private to their organisation) and a shared community directory of vendors across Nigeria.</p>
                <p>Some entries in the shared directory may be unverified listings provided for discovery purposes and have not been confirmed by the vendor in question. NaliTech does not guarantee the accuracy of vendor directory information and is not a party to any agreement between a Planner and a Vendor. Any booking, payment, or service arrangement is solely between the Planner and the Vendor.</p>
              </section>

              <section id="ip" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>9. Intellectual Property</h2>
                <p>The Platform, including its design, software, branding, and underlying technology, is owned by NaliTech Consults Limited and protected by applicable intellectual property laws. These Terms do not grant you any ownership rights in the Platform.</p>
                <p>You retain ownership of the Event Data, photos, documents, and other content you upload to the Platform ("Your Content"). You grant NaliTech a limited licence to host, store, and process Your Content solely for the purpose of providing the Platform to you.</p>
              </section>

              <section id="acceptable" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>10. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul>
                  <li>Use the Platform for any event or purpose that is illegal under Nigerian law</li>
                  <li>Attempt to reverse-engineer, scrape, or extract data from the Platform beyond normal use</li>
                  <li>Upload content that is unlawful, defamatory, or infringes the rights of others</li>
                  <li>Use the vendor directory to harvest contact information for unsolicited marketing unrelated to event planning</li>
                </ul>
              </section>

              <section id="availability" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>11. Service Availability</h2>
                <p>We aim to keep the Platform available and reliable, including for event-day features such as the Live Event Board. However, we do not guarantee uninterrupted availability, particularly during the beta period or due to factors outside our reasonable control (including outages of third-party infrastructure providers).</p>
                <p>For events where real-time coordination is critical, we recommend maintaining a basic offline backup plan (such as a printed run sheet) as a precaution.</p>
              </section>

              <section id="liability" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>12. Limitation of Liability</h2>
                <p>To the maximum extent permitted by Nigerian law:</p>
                <ul>
                  <li>NaliTech is not liable for any indirect, incidental, or consequential losses arising from your use of the Platform, including loss of event revenue, reputational harm, or costs arising from event disruptions</li>
                  <li>NaliTech's total liability for any claim arising from your use of the Platform shall not exceed the total fees paid by you to NaliTech in the twelve (12) months preceding the claim</li>
                </ul>
                <p>Nothing in these Terms limits liability that cannot be limited under applicable law.</p>
              </section>

              <section id="termination" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>13. Termination</h2>
                <p>You may stop using the Platform and request account deletion at any time. We may suspend or terminate accounts that violate these Terms, with notice where reasonably possible.</p>
                <p>On termination, we will provide a reasonable opportunity to export your Event Data before deletion, except where retention is required by law.</p>
              </section>

              <section id="changes" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>14. Changes to These Terms</h2>
                <p>We may update these Terms from time to time. We will notify users of material changes via the Platform or email. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.</p>
              </section>

              <section id="governing" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>15. Governing Law</h2>
                <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Nigeria.</p>
              </section>

              <section id="contact" className={styles.textSection}>
                <h2 className={styles.sectionTitle}>16. Contact</h2>
                <p>For questions about these Terms, contact us at:</p>
                <p><strong>services@eventgrid.ng</strong><br />NaliTech Consults Limited<br />Abuja, Nigeria</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
