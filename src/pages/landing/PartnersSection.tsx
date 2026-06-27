import styles from './PartnersSection.module.css'

interface Partner {
  name: string
  logo_url?: string | null
  isDefault?: boolean
}

// ── Curated Prestigious Event Planners (Default Fallbacks) ──
const DEFAULT_PARTNERS: Partner[] = [
  {
    name: 'Talk Events',
    isDefault: true,
  },
  {
    name: 'QV',
    isDefault: true,
  },
  {
    name: 'Zapphaire Events',
    isDefault: true,
  },
  {
    name: 'IPC Events',
    isDefault: true,
  },
  {
    name: 'Newton & David',
    isDefault: true,
  },
  {
    name: 'Elizabeth R',
    isDefault: true,
  },
  {
    name: 'Eventful',
    isDefault: true,
  },
  {
    name: 'Aisle Planner Pro',
    isDefault: true,
  }
]

const VISIBLE_PARTNERS = ['Talk Events', 'QV']

export default function PartnersSection() {
  const visiblePartners = DEFAULT_PARTNERS.filter((p) => VISIBLE_PARTNERS.includes(p.name))

  return (
    <section className={styles.section} aria-label="Our Partners">
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Our Partners</h2>
          <p className={styles.subtitle}>
            Leading coordinators, venues, and designers trust NaliGrid to power their elite event operations.
          </p>
          <div className={styles.grid}>
            {visiblePartners.map((partner, index) => (
              <div key={`${partner.name}-${index}`} className={styles.gridCell} title={partner.name}>
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={`${partner.name} Logo`} className={styles.partnerImg} />
                ) : partner.isDefault ? (
                  renderDefaultLogoSVG(partner.name)
                ) : (
                  <span className={styles.partnerTextLogo}>{partner.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Inline SVGs for Curated Planners (styled to render white on dark theme) ──
function renderDefaultLogoSVG(name: string) {
  switch (name) {
    case 'Talk Events':
      return <img src="/talk%20events.svg" alt="Talk Events Logo" className={styles.partnerImg} />
    case 'QV':
      return <img src="/qv-logo-white.png" alt="QV Logo" className={styles.partnerImg} />
    case 'Zapphaire Events':
      return (
        <svg width="195" height="42" viewBox="0 0 150 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 12L12 22L22 12L12 2Z" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 6L6 12L12 18L18 12L12 6Z" stroke="#ffffff" strokeWidth="1" opacity="0.6"/>
          <text x="32" y="20" fill="#ffffff" fontFamily="var(--font-base)" fontSize="11" fontWeight="bold" letterSpacing="0.22em">ZAPPHAIRE</text>
        </svg>
      )
    case 'IPC Events':
      return (
        <svg width="169" height="42" viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="16" r="8" stroke="#ffffff" strokeWidth="1.8"/>
          <circle cx="17" cy="16" r="8" stroke="#ffffff" strokeWidth="1.8" opacity="0.75"/>
          <text x="34" y="20" fill="#ffffff" fontFamily="var(--font-base)" fontSize="12" fontWeight="800" letterSpacing="0.15em">IPC EVENTS</text>
        </svg>
      )
    case 'Newton & David':
      return (
        <svg width="208" height="42" viewBox="0 0 160 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 22C4 22 10 14 16 14C22 14 28 22 28 22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 12C10 12 16 6 22 12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <text x="36" y="20" fill="#ffffff" fontFamily="var(--font-base)" fontSize="10" fontWeight="bold" letterSpacing="0.12em">NEWTON & DAVID</text>
        </svg>
      )
    case 'Elizabeth R':
      return (
        <svg width="182" height="42" viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="8" width="16" height="16" rx="4" stroke="#ffffff" strokeWidth="1.8"/>
          <path d="M11 8V24" stroke="#ffffff" strokeWidth="1.5" opacity="0.6"/>
          <text x="28" y="20" fill="#ffffff" fontFamily="var(--font-base)" fontSize="11" fontWeight="bold" letterSpacing="0.18em">ELIZABETH R</text>
        </svg>
      )
    case 'Eventful':
      return (
        <svg width="162" height="42" viewBox="0 0 125 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="6" width="18" height="18" rx="2" stroke="#ffffff" strokeWidth="1.8"/>
          <line x1="2" y1="13" x2="20" y2="13" stroke="#ffffff" strokeWidth="1.5"/>
          <circle cx="7" cy="18" r="1.5" fill="#ffffff"/>
          <circle cx="15" cy="18" r="1.5" fill="#ffffff"/>
          <text x="28" y="20" fill="#ffffff" fontFamily="var(--font-base)" fontSize="12" fontWeight="bold" letterSpacing="0.14em">EVENTFUL</text>
        </svg>
      )
    case 'Aisle Planner Pro':
      return (
        <svg width="208" height="42" viewBox="0 0 160 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="10" cy="16" rx="8" ry="4" stroke="#ffffff" strokeWidth="1.5" transform="rotate(-30 10 16)"/>
          <ellipse cx="18" cy="16" rx="8" ry="4" stroke="#ffffff" strokeWidth="1.5" transform="rotate(30 18 16)" opacity="0.7"/>
          <text x="32" y="20" fill="#ffffff" fontFamily="var(--font-base)" fontSize="9" fontWeight="bold" letterSpacing="0.16em">AISLE PLANNER</text>
        </svg>
      )
    default:
      return null
  }
}
