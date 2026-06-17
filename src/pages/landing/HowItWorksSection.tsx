import styles from './HowItWorksSection.module.css'

export default function HowItWorksSection() {
  const phases = [
    {
      number: 1,
      name: 'Lead & Client Onboarding',
      desc: 'First contact to signed contract — handled.',
      tags: ['Inquiry', 'Proposal', 'Deposit'],
      active: true,
    },
    {
      number: 2,
      name: 'Event Planning & Strategy',
      desc: 'Concept, timeline, budget, and vendor shortlist locked.',
      tags: ['Mood Board', 'Budget', 'Venue'],
      active: true,
    },
    {
      number: 3,
      name: 'Vendor Management',
      desc: 'Source, negotiate, confirm, and track every vendor.',
      tags: ['Quotes', 'Contracts', 'Payments'],
      active: true,
    },
    {
      number: 4,
      name: 'Team Coordination',
      desc: 'Assign roles, brief your team, track readiness.',
      tags: ['Tasks', 'Meetings', 'Updates'],
      active: false,
    },
    {
      number: 5,
      name: 'Guest Management',
      desc: 'RSVP, seating plans, VIP list, and check-in.',
      tags: ['Guest List', 'Tables', 'RSVP'],
      active: false,
    },
    {
      number: 6,
      name: 'Pre-Event Finalization',
      desc: 'Everything confirmed. Run sheet ready. Team briefed.',
      tags: ['Run Sheet', 'Final Count', 'Confirmations'],
      active: false,
    },
    {
      number: 7,
      name: 'Event Day Operations',
      desc: 'Live board. Real-time status. Issues handled.',
      tags: ['Live Board', 'Check-In', 'Issue Log'],
      active: false,
    },
    {
      number: 8,
      name: 'Event Closeout',
      desc: 'Vendors settled. Debrief done. Client feedback collected.',
      tags: ['Payments', 'Feedback', 'Debrief'],
      active: false,
    },
    {
      number: 9,
      name: 'Post-Event Analysis',
      desc: 'Report generated. Lessons logged. Portfolio updated.',
      tags: ['Report', 'Ratings', 'Archive'],
      active: false,
    },
  ]

  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.container}>
        {/* Left Aligned Section Header */}
        <div className={styles.header}>
          <span className={styles.sectionLabel}>The Process</span>
          <h2 className={styles.headline}>From First Inquiry to Final Report.</h2>
          <p className={styles.subtext}>
            NaliGrid structures your work into 9 phases. Every phase has tasks, owners, and a clear definition of done.
          </p>
        </div>

        {/* Vertical Timeline Progress Tree */}
        <div className={styles.timelineContainer}>
          <div className={styles.spineLine} />
          
          <div className={styles.phasesList}>
            {phases.map((phase) => (
              <div key={phase.number} className={styles.phaseRow}>
                {/* Number Node on Spine */}
                <div className={`${styles.nodeCircle} ${phase.active ? styles.nodeActive : styles.nodeInactive}`}>
                  {phase.number}
                </div>
                
                {/* Content Block */}
                <div className={styles.phaseContent}>
                  <h3 className={styles.phaseName}>{phase.name}</h3>
                  <p className={styles.phaseDesc}>{phase.desc}</p>
                  <div className={styles.tagsContainer}>
                    {phase.tags.map((tag) => (
                      <span key={tag} className={styles.phaseTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
