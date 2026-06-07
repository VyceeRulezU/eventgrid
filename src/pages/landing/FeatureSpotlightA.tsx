import styles from './FeatureSpotlightA.module.css'

const PHASES = [
  {
    id: 'plan',
    label: '01',
    headline: 'Plan',
    summary:
      'Map out every detail before a single naira is spent. Build proposals, set budgets, assign ownership — all in one place, long before the day arrives.',
    image: 'https://images.unsplash.com/photo-1720010943528-d709a0857650?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Event planner reviewing notes and documents',
    accent: false,
  },
  {
    id: 'execute',
    label: '02',
    headline: 'Execute',
    summary:
      'Run the day with real-time boards, vendor tracking, and live issue flags. Your entire team sees the same picture — no radio silence, no surprises.',
    image: 'https://images.unsplash.com/photo-1661332517932-2d441bfb2994?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Nigerian wedding event coordination',
    accent: false,
  },
  {
    id: 'celebrate',
    label: '03',
    headline: 'Celebrate',
    summary:
      'When the lights go up, you take the bow. Aftermath reports, client reviews, and payment reconciliation done beautifully — so you can do it all again.',
    image: 'https://images.unsplash.com/photo-1695281536457-01f9a07c575b?w=800&q=80&auto=format&fit=crop',
    imageAlt: 'Guests celebrating at a Nigerian event',
    accent: false,
  },
]

export default function FeatureSpotlightA() {
  return (
    <section className={styles.section} id="spotlight-a" aria-label="Plan, Execute, Celebrate">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>The EventGrid Way</span>
          <h2 className={styles.sectionTitle}>
            Three phases. One platform. <br />Zero chaos.
          </h2>
        </div>

        {/* Module Grid */}
        <div className={styles.moduleGrid}>
          {PHASES.map((phase, idx) => (
            <div
              key={phase.id}
              className={`${styles.module} ${idx % 2 === 1 ? styles.moduleReversed : ''}`}
            >
              {/* Image cluster */}
              <div className={styles.imageCluster}>
                <div className={styles.imagePrimary}>
                  <img src={phase.image} alt={phase.imageAlt} loading="lazy" />
                </div>
                {/* Floating label chip */}
                <div className={styles.phaseChip}>
                  <span className={styles.phaseChipNumber}>{phase.label}</span>
                  <span className={styles.phaseChipText}>{phase.headline}</span>
                </div>
              </div>

              {/* Text block */}
              <div className={styles.textBlock}>
                <h3 className={styles.headline}>{phase.headline}</h3>
                <p className={styles.summary}>{phase.summary}</p>
                <a href="#how-it-works" className={styles.ctaLink}>
                  Learn more <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
