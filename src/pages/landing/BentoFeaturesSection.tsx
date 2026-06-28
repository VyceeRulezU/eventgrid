import { motion } from 'framer-motion'
import styles from './BentoFeaturesSection.module.css'

const cellVariants = [
  { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } },
  { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay: 0.15 } } },
  { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay: 0.3 } } },
  { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut', delay: 0.1 } } },
  { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut', delay: 0.25 } } },
  { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut', delay: 0.4 } } },
]

export default function BentoFeaturesSection() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        {/* Section Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className={styles.headline}>Why event pros choose NaliGrid</h2>
          <p className={styles.subtext}>
            Built for Nigerian planners, coordinators, and vendors who need
            more than a spreadsheet.
          </p>
        </motion.div>

        {/* Asymmetric Bento Grid */}
        <div className={styles.bentoGrid}>

          {/* Cell A — tall image (left column, top) */}
          <motion.div
            className={`${styles.cell} ${styles.cellA}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cellVariants[0]}
          >
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=700&q=80&auto=format&fit=crop"
              alt="Beautifully decorated wedding reception"
              className={styles.cellImage}
              loading="lazy"
            />
          </motion.div>

          {/* Cell B — wide primary text card (centre, top) */}
          <motion.div
            className={`${styles.cell} ${styles.cellB} ${styles.cellDark}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cellVariants[1]}
          >
            <span className={styles.cellLabel}>Trusted by planners</span>
            <p className={styles.cellTagline}>
              Coordinates vendors, clients,<br />
              and teams — <em className={styles.em}>all from one dashboard.</em>
            </p>
          </motion.div>

          {/* Cell C — stat (right column, top) */}
          <motion.div
            className={`${styles.cell} ${styles.cellC} ${styles.cellDark}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cellVariants[2]}
          >
            <span className={styles.bigStat}>₦2.4B+</span>
            <p className={styles.statLabel}>Events tracked on the platform</p>
          </motion.div>

          {/* Cell D — image (centre, bottom-left overlap) */}
          <motion.div
            className={`${styles.cell} ${styles.cellD}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cellVariants[3]}
          >
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=80&auto=format&fit=crop"
              alt="Event vendor handshake and coordination"
              className={styles.cellImage}
              loading="lazy"
            />
          </motion.div>

          {/* Cell E — feature callout (bottom, large) */}
          <motion.div
            className={`${styles.cell} ${styles.cellE} ${styles.cellDark}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cellVariants[4]}
          >
            <span className={styles.cellLabel}>End-to-end workflow</span>
            <p className={styles.cellTagline}>
              Gives planners full control and{' '}
              <em className={styles.em}>turns every event into a repeatable system.</em>
            </p>
            <a href="#spotlight-a" className={styles.ctaBtn}>
              See how it works <span aria-hidden>→</span>
            </a>
          </motion.div>

          {/* Cell F — portrait image (right column, bottom) */}
          <motion.div
            className={`${styles.cell} ${styles.cellF}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cellVariants[5]}
          >
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
          </motion.div>

        </div>
      </div>
    </section>
  )
}
