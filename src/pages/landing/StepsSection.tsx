import { motion } from 'framer-motion'
import { CalendarRange, ClipboardList, Users, Activity } from 'lucide-react'
import styles from './StepsSection.module.css'

interface Step {
  number: string
  title: string
  desc: string
  icon: React.ReactNode
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Onboard & Plan',
    desc: 'Map out client proposals, establish itemized budgets, and lock down initial event timelines.',
    icon: <CalendarRange size={20} className={styles.stepIcon} />,
  },
  {
    number: '02',
    title: 'Coordinate Vendors',
    desc: 'Upload contracts, track invoice payments, and manage vendor deliverables in real time.',
    icon: <ClipboardList size={20} className={styles.stepIcon} />,
  },
  {
    number: '03',
    title: 'Manage Guests',
    desc: 'Collect RSVPs dynamically, design seating charts, and coordinate guest dietary preferences.',
    icon: <Users size={20} className={styles.stepIcon} />,
  },
  {
    number: '04',
    title: 'Live Day Operations',
    desc: 'Execute with live event boards, update run sheets instantly, and monitor status in real-time.',
    icon: <Activity size={20} className={styles.stepIcon} />,
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
}

const childVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function StepsSection() {
  return (
    <section className={styles.section} id="how-it-works" aria-label="Planning Steps">
      <div className={styles.container}>
        {/* Title Section */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className={styles.tagline}>The Process</span>
          <h2 className={styles.title}>From Conception to Execution</h2>
        </motion.div>

        {/* Timeline visualization */}
        <div className={styles.timelineContainer}>
          {/* Glowing horizontal beam */}
          <div className={styles.glowBeam}>
            <div className={styles.glowBeamInner} />
          </div>

          <motion.div
            className={styles.stepsGrid}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {STEPS.map((step, idx) => (
              <motion.div key={step.number} className={styles.stepCard} style={{ '--step-index': idx } as React.CSSProperties} variants={childVariants}>
                {/* Vertical indicator line connecting beam to card */}
                <div className={styles.indicatorContainer}>
                  <div className={styles.indicatorDot} />
                  <div className={styles.indicatorLine} />
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.iconWrapper}>
                    {step.icon}
                  </div>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
