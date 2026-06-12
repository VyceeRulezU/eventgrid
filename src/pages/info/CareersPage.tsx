import { SEO } from '@/components/shared/SEO'
import Navbar from '@/components/layout/Navbar'
import { LandingPageHero } from '@/components/shared/LandingPageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { LandingCTA } from '@/components/shared/LandingCTA'
import Footer from '@/pages/landing/Footer'
import styles from './InfoPages.module.css'

const ROLES = [
  {
    title: 'Senior Fullstack Engineer (React / Supabase)',
    department: 'Engineering',
    location: 'Remote (Nigeria)',
    type: 'Full-time'
  },
  {
    title: 'Product Designer (UI/UX Systems)',
    department: 'Design',
    location: 'Remote (Lagos / Abuja)',
    type: 'Full-time'
  },
  {
    title: 'Client Operations Support Lead',
    department: 'Operations',
    location: 'Lagos, NG (Hybrid)',
    type: 'Full-time'
  }
]

export function CareersPage() {
  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Careers at EventGrid — Join Our Team"
        description="Work with curious, driven team members to eliminate friction from event day operations. Remote roles across Nigeria in engineering, design, and operations."
        url="/careers"
      />
      <Navbar />
      
      <LandingPageHero
        eyebrow="Careers"
        title="Help Us Shape Event Experiences"
        subtitle="Work with curious, driven team members to eliminate the friction from event day operations and vendor management."
      />

      {/* Open Roles Section */}
      <section className={styles.rolesSection} aria-label="Open job roles">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Open Positions</h2>
          <p className={styles.sectionSubtitle}>
            We're a remote-first, growth-oriented team building the infrastructure for the African event economy. Join us.
          </p>

          <div className={styles.rolesList}>
            {ROLES.map((role) => (
              <div key={role.title} className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <span className={styles.roleDept}>{role.department}</span>
                  <h3 className={styles.roleTitle}>{role.title}</h3>
                  <div className={styles.roleMeta}>
                    <span>{role.location}</span>
                    <span className={styles.metaDot}>·</span>
                    <span>{role.type}</span>
                  </div>
                </div>
                <button className={styles.applyBtn} id={`apply-${role.department.toLowerCase()}`}>Apply Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection
        items={[
          {
            category: 'Recruitment',
            items: [
              {
                question: 'What is the hiring process?',
                answer: 'Our process typically includes an initial screening, a technical or portfolio review, and a final interview with the team.'
              },
              {
                question: 'Do you offer remote work?',
                answer: 'Yes, we are a remote-first company. Most roles are fully remote with optional hybrid arrangements in Lagos and Abuja.'
              }
            ]
          }
        ]}
        header="Frequently Asked Questions"
        summary="Common questions about working at EventGrid."
      />

      <LandingCTA
        title="Don't see your role?"
        description="We're always looking for talented developers, designers, and planners. Send us your portfolio."
        primaryText="Submit General Application"
        primaryHref="mailto:careers@eventgrid.ng"
      />

      <Footer />
    </div>
  )
}
