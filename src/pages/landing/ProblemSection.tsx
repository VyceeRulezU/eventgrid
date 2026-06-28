import { motion } from 'framer-motion'
import AnimatedStatValue from '../../components/shared/AnimatedStatValue'
import styles from './ProblemSection.module.css'

const STEPS = [
  {
    number: '01',
    title: 'Source your event',
    desc: 'This is your plan — all the pre-day scheduling essentials live here. Work with your client to align on one project on an event.',
  },
  {
    number: '02',
    title: 'Structure your vendor team',
    desc: "Take your Planner's Explorer to your board — Fixed Assets as Company, Capacity Structures, Material. Create roles for every function.",
  },
  {
    number: '03',
    title: 'Run the day end-to-end and live',
    desc: 'Use the live event board to coordinate real-time experience across vendors and stations. Flag issues, update statuses, and keep everyone aligned.',
  },
  {
    number: '04',
    title: 'Close your deal — and win',
    desc: 'Sign the Partnership Agreement, send the money to your team with reconciliation and accounting data for the life of the event.',
  },
]

const STATS = [
  {
    value: '100+',
    label: 'Event companies running on the platform',
  },
  {
    value: '2800',
    label: 'Processes co-ordinated on the platform',
  },
  {
    value: '₦100m+',
    label: 'Payments coordinated',
  },
]

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.15 },
  }),
}

export default function ProblemSection() {
  return (
    <section className={styles.section} id="problem-statement">
      <div className={styles.container}>
        <div className={styles.layout}>

          {/* Left Column — bold headline */}
          <motion.div
            className={styles.leftCol}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h2 className={styles.headline}>
              The new way<br />
              to run an event<br />
              — like a digital<br />
              4-phase process
            </h2>
          </motion.div>

          {/* Right Column — steps + stats */}
          <motion.div
            className={styles.rightCol}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          >
            {/* Numbered Steps */}
            <div className={styles.stepsList}>
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  className={styles.stepRow}
                  variants={stepVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                >
                  <div className={styles.stepLeft}>
                    <span className={styles.stepNumber}>{step.number}</span>
                    <div className={styles.stepConnector} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats Row */}
            <motion.div
              className={styles.statsRow}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
            >
              {STATS.map((stat, idx) => (
                <div key={idx} className={styles.statItem}>
                  <AnimatedStatValue value={stat.value} className={styles.statValue} />
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
