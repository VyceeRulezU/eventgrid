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

export default function StepsSection() {
  return (
    <section className={styles.section} id="how-it-works" aria-label="Planning Steps">
      <div className={styles.container}>
        {/* Title Section */}
        <div className={styles.header}>
          <span className={styles.tagline}>The Process</span>
          <h2 className={styles.title}>From Conception to Execution</h2>
        </div>

        {/* Timeline visualization */}
        <div className={styles.timelineContainer}>
          {/* Glowing horizontal beam */}
          <div className={styles.glowBeam}>
            <div className={styles.glowBeamInner} />
          </div>

          <div className={styles.stepsGrid}>
            {STEPS.map((step, idx) => (
              <div key={step.number} className={styles.stepCard} style={{ '--step-index': idx } as React.CSSProperties}>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
