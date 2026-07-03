import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView, animate } from 'framer-motion'
import styles from './FeatureSpotlightA.module.css'

function AnimatedLabel({ value }: { value: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const num = parseInt(value)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, num, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => setCount(Math.round(v)),
      })
      return () => controls.stop()
    }
  }, [isInView, num])

  return <span ref={ref}>{String(count).padStart(2, '0')}</span>
}

function PhaseModule({ phase, index, sectionProgress }: { phase: typeof PHASES[0]; index: number; sectionProgress: any }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const segmentStart = index / 3
  const segmentEnd = (index + 1) / 3
  const cardProgress = useTransform(sectionProgress, [segmentStart, segmentEnd], [0, 1])
  const smoothProgress = useSpring(cardProgress, { stiffness: 80, damping: 20 })
  const scaleY = useTransform(smoothProgress, [0, 1], [0, 1])
  const scaleX = useTransform(smoothProgress, [0, 1], [0, 1])

  return (
    <motion.div
      className={`${styles.module} ${index % 2 === 1 ? styles.moduleReversed : ''}`}
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
    >
      {/* Image cluster */}
      <div className={styles.imageCluster}>
        <div className={styles.imagePrimary}>
          <img src={phase.image} alt={phase.imageAlt} loading="lazy" />
        </div>
        {/* Floating label chip */}
        <div className={styles.phaseChip}>
          <span className={styles.phaseChipNumber}>
            <AnimatedLabel value={phase.label} />
          </span>
          <span className={styles.phaseChipText}>{phase.headline}</span>
        </div>
      </div>

      {/* Scroll progress bar between image and text */}
      <div className={styles.progressTrack}>
        <motion.div className={styles.progressFillDesktop} style={{ scaleY }} />
        <motion.div className={styles.progressFillMobile} style={{ scaleX }} />
      </div>

      {/* Text block */}
      <motion.div
        className={styles.textBlock}
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.15 + 0.2, ease: 'easeOut' }}
      >
        <h3 className={styles.headline}>{phase.headline}</h3>
        <p className={styles.summary}>{phase.summary}</p>
        <a href="#how-it-works" className={styles.ctaLink}>
          Learn more <span aria-hidden>→</span>
        </a>
      </motion.div>
    </motion.div>
  )
}

const PHASES = [
  {
    id: 'plan',
    label: '01',
    headline: 'Plan',
    summary:
      'Map out every detail before a single naira is spent. Build proposals, set budgets, assign ownership — all in one place, long before the day arrives.',
    image: 'https://i.ibb.co/7Jdx24qD/Gemini-Generated-Image-81e9sl81e9sl81e9.png',
    imageAlt: 'Event planner reviewing notes and documents',
  },
  {
    id: 'execute',
    label: '02',
    headline: 'Execute',
    summary:
      'Run the day with real-time boards, vendor tracking, and live issue flags. Your entire team sees the same picture — no radio silence, no surprises.',
    image: 'https://images.pexels.com/photos/19870036/pexels-photo-19870036.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop',
    imageAlt: 'Nigerian wedding event coordination',
  },
  {
    id: 'celebrate',
    label: '03',
    headline: 'Celebrate',
    summary:
      'When the lights go up, you take the bow. Aftermath reports, client reviews, and payment reconciliation done beautifully — so you can do it all again.',
    image: 'https://i.ibb.co/chRKL8sb/Gemini-Generated-Image-pji6ejpji6ejpji6.png',
    imageAlt: 'Guests celebrating at a Nigerian event',
  },
]

export default function FeatureSpotlightA() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  return (
    <motion.section
      ref={sectionRef}
      className={styles.section}
      id="spotlight-a"
      aria-label="Plan, Execute, Celebrate"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.container}>
        {/* Section Header */}
        <motion.div
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className={styles.eyebrow}>The NaliGrid Way</span>
          <h2 className={styles.sectionTitle}>
            Three phases. One platform. <br />Zero chaos.
          </h2>
        </motion.div>

        {/* Module Grid */}
        <div className={styles.moduleGrid}>
          {PHASES.map((phase, idx) => (
            <PhaseModule key={phase.id} phase={phase} index={idx} sectionProgress={scrollYProgress} />
          ))}
        </div>
      </div>
    </motion.section>
  )
}
