import { EmailWrapper } from './EmailWrapper.tsx'

export interface FeedbackEmailProps {
  first_name: string
  feedback_url: string
}

export function FeedbackEmail({ first_name, feedback_url }: FeedbackEmailProps) {
  return (
    <EmailWrapper previewText={`How is your experience with NaliGrid, ${first_name}? Let us know!`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        How are we doing? 💬
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Hi {first_name},
      </p>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        You've been on NaliGrid for about a week now, and we hope it has helped clear up your checklists and simplify your communications.
      </p>

      <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        We are constantly refining the platform to build the best experience for event coordinators and planners. We would love to hear your honest feedback. What do you love? What's missing or can be improved?
      </p>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={feedback_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Share My Feedback →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        It takes less than 2 minutes and directly impacts our product roadmap. Thank you for helping us make NaliGrid better!
        <br /><br />
        Warmly,
        <br />
        <strong>The NaliGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
