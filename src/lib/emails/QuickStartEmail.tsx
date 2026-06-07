import { EmailWrapper } from './EmailWrapper.tsx'

export interface QuickStartEmailProps {
  first_name: string
  create_event_url: string
}

export function QuickStartEmail({ first_name, create_event_url }: QuickStartEmailProps) {
  return (
    <EmailWrapper previewText={`Hi ${first_name}, here is your 3-step guide to launch your first event on EventGrid.`}>
      <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 800, color: '#F9FAFB', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
        Let's launch your first event! 🚀
      </h1>

      <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6 }}>
        Hi {first_name}, running a successful event requires details, timelines, and clear execution steps. Here is a quick 3-step guide to get your first event up and running on EventGrid today:
      </p>

      <div style={{ backgroundColor: '#18202F', border: '1px solid #374151', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ verticalAlign: 'top', paddingRight: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#D4A017', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>1</div>
            </td>
            <td style={{ paddingBottom: '20px' }}>
              <strong style={{ display: 'block', fontSize: '15px', color: '#F9FAFB', marginBottom: '4px' }}>Draft Your Event Details</strong>
              <span style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5 }}>
                Enter the name, date, venue, guest count, and event type to initialize your interactive 9-phase timeline automatically.
              </span>
            </td>
          </tr>
          <tr>
            <td style={{ verticalAlign: 'top', paddingRight: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#D4A017', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>2</div>
            </td>
            <td style={{ paddingBottom: '20px' }}>
              <strong style={{ display: 'block', fontSize: '15px', color: '#F9FAFB', marginBottom: '4px' }}>Invite Coordinators & Team</strong>
              <span style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5 }}>
                Add day-of coordinators to start assigning task checklists. They'll have instant mobile access to update completion progress.
              </span>
            </td>
          </tr>
          <tr>
            <td style={{ verticalAlign: 'top', paddingRight: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#D4A017', color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>3</div>
            </td>
            <td>
              <strong style={{ display: 'block', fontSize: '15px', color: '#F9FAFB', marginBottom: '4px' }}>Configure the Client Portal</strong>
              <span style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5 }}>
                Generate a token-locked link for your clients so they can see planning steps, approved proposals, and dates in real time.
              </span>
            </td>
          </tr>
        </table>
      </div>

      <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 28px' }}>
        <tr>
          <td style={{ backgroundColor: '#D4A017', borderRadius: '10px' }}>
            <a className="button" href={create_event_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#111827', textDecoration: 'none', borderRadius: '10px', boxShadow: '0 4px 12px rgba(212, 160, 23, 0.25)' }}>
              Create My Event Now →
            </a>
          </td>
        </tr>
      </table>

      <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
        Tip: You can use our dummy event templates to experiment with all features before using real client details.
        <br /><br />
        Best of luck,
        <br />
        <strong>The EventGrid Team</strong>
      </p>
    </EmailWrapper>
  )
}
