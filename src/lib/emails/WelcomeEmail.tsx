import { EmailWrapper } from './EmailWrapper.tsx'

export interface WelcomeEmailProps {
  first_name: string
  dashboard_url: string
  create_event_url: string
  role?: string
}

const benefits: Record<string, { icon: string; title: string; desc: string }[]> = {
  planner: [
    { icon: '🚀', title: 'Interactive 9-Phase Tracker', desc: 'Follow a structured workflow from lead capture to final post-event report.' },
    { icon: '💰', title: 'Naira-Native Financials', desc: 'Track vendor payments, client budget deposits, and outstanding balance schedules.' },
    { icon: '📋', title: 'Vendor Sourcing & Booking', desc: 'Source, compare, and book vendors directly from your dashboard.' },
    { icon: '✨', title: 'Client Portals', desc: 'Generate read-only portals for clients to check timelines without constant messaging.' },
    { icon: '👥', title: 'Team Collaboration', desc: 'Assign tasks, share media, and communicate with your team in real time.' },
    { icon: '📊', title: 'Post-Event Reports', desc: 'Generate AI-powered after-event reports with narratives and highlights.' },
  ],
  coordinator: [
    { icon: '📋', title: 'Day-of Coordination', desc: 'Manage run sheets, timelines, and live board for seamless event execution.' },
    { icon: '👥', title: 'Task Management', desc: 'Assign and track tasks across your team with priorities and deadlines.' },
    { icon: '📱', title: 'Live Board', desc: 'Post real-time updates, photos, and coordinate with your crew on the day.' },
    { icon: '💰', title: 'Budget Oversight', desc: 'Monitor expenses, advances, and balances across all event categories.' },
    { icon: '✨', title: 'Client Portals', desc: 'Keep clients informed with a read-only view of timelines and milestones.' },
    { icon: '📊', title: 'Post-Event Reports', desc: 'Generate AI-powered after-event reports with narratives and highlights.' },
  ],
  client: [
    { icon: '🎫', title: 'Event Invitations', desc: 'Receive and manage all your invited events in one place.' },
    { icon: '📋', title: 'Vendor Directory', desc: 'Browse and discover verified vendors for your events.' },
    { icon: '📱', title: 'Event Timeline', desc: 'Stay updated on event schedules, milestones, and announcements.' },
    { icon: '💬', title: 'RSVP Management', desc: 'Confirm attendance and communicate with your planner seamlessly.' },
  ],
}

function getBenefits(role?: string) {
  return benefits[role || 'planner'] || benefits.planner
}

function getRoleLabel(role?: string) {
  switch (role) {
    case 'coordinator': return 'Coordinator'
    case 'client': return 'Client / Guest'
    default: return 'Event Planner'
  }
}

function getIntro(role?: string) {
  const name = getRoleLabel(role)
  return `As a ${name}, you get access to tools built specifically for how you work — all in one dashboard, no spreadsheets needed.`
}

export function WelcomeEmail({ first_name, dashboard_url, create_event_url, role }: WelcomeEmailProps) {
  const roleBenefits = getBenefits(role)

  return (
    <EmailWrapper previewText={`Welcome to NaliGrid, ${first_name}! Let's get your first event set up.`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        Welcome to the grid, {first_name}! 🥂
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        We are thrilled to have you on board. NaliGrid is built specifically for event professionals to collaborate with teams, vendors, and clients — all from a single dashboard.
      </p>

      <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        {getIntro(role)}
      </p>

      <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#F9FAFB', lineHeight: 1.6, fontWeight: 600 }}>
        Here is what you can do with NaliGrid:
      </p>

      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '32px' }}>
        {roleBenefits.map((b, i) => (
          <tr key={i}>
            <td style={{ paddingBottom: i < roleBenefits.length - 1 ? '16px' : '0', verticalAlign: 'top', width: '32px' }}>
              <span style={{ fontSize: '18px' }}>{b.icon}</span>
            </td>
            <td style={{ paddingBottom: i < roleBenefits.length - 1 ? '16px' : '0', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.5 }}>
              <strong style={{ color: '#F9FAFB', display: 'block', marginBottom: '2px' }}>{b.title}</strong>
              {b.desc}
            </td>
          </tr>
        ))}
      </table>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 16px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={create_event_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Create Your First Event →
            </a>
          </td>
        </tr>
      </table>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td align="center" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
            Or <a href={dashboard_url} style={{ color: '#D4A017', textDecoration: 'underline' }}>go to your dashboard</a> to explore.
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        If you have any questions or need a hand, reply directly to this email. We're here to help you shine.
        <br /><br />
        Cheers,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
