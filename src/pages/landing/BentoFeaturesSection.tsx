import styles from './BentoFeaturesSection.module.css'

export default function BentoFeaturesSection() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <h2 className={styles.headline}>Why event pros choose EventGrid</h2>
          <p className={styles.subtext}>
            Built for Nigerian planners, coordinators, and vendors who need
            more than a spreadsheet.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className={styles.bentoGrid}>

          {/* Cell A — tall image (left column, top) */}
          <div className={`${styles.cell} ${styles.cellA}`}>
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=700&q=80&auto=format&fit=crop"
              alt="Beautifully decorated wedding reception"
              className={styles.cellImage}
              loading="lazy"
            />
          </div>

          {/* Cell B — wide primary text card (centre, top) */}
          <div className={`${styles.cell} ${styles.cellB} ${styles.cellDark}`}>
            <span className={styles.cellLabel}>Trusted by planners</span>
            <p className={styles.cellTagline}>
              Coordinates vendors, clients,<br />
              and teams — <em className={styles.em}>all from one dashboard.</em>
            </p>
          </div>

          {/* Cell C — stat (right column, top) */}
          <div className={`${styles.cell} ${styles.cellC} ${styles.cellDark}`}>
            <span className={styles.bigStat}>₦2.4B+</span>
            <p className={styles.statLabel}>Events tracked on the platform</p>
          </div>

          {/* Cell D — image (centre, bottom-left overlap) */}
          <div className={`${styles.cell} ${styles.cellD}`}>
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=80&auto=format&fit=crop"
              alt="Event vendor handshake and coordination"
              className={styles.cellImage}
              loading="lazy"
            />
          </div>

          {/* Cell E — feature callout (bottom, large) */}
          <div className={`${styles.cell} ${styles.cellE} ${styles.cellDark}`}>
            <span className={styles.cellLabel}>End-to-end workflow</span>
            <p className={styles.cellTagline}>
              Gives planners full control and{' '}
              <em className={styles.em}>turns every event into a repeatable system.</em>
            </p>
            <a href="#spotlight-a" className={styles.ctaBtn}>
              See how it works <span aria-hidden>→</span>
            </a>
          </div>

          {/* Cell F — portrait image (right column, bottom) */}
          <div className={`${styles.cell} ${styles.cellF}`}>
            <img
              src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&q=80&auto=format&fit=crop"
              alt="Guests enjoying a premium event evening"
              className={styles.cellImage}
              loading="lazy"
            />
            <div className={styles.overlayChip}>
              <span className={styles.chipDot} />
              Live Event Board Active
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
