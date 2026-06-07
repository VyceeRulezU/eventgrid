import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Search, Book, LayoutDashboard, DollarSign, Users, Calendar, Radio, ExternalLink, FileText, MessageSquare, Shield, ArrowLeft, ListChecks, Wallet } from 'lucide-react'
import styles from './HelpPage.module.css'

const TOPICS = [
  {
    id: 'getting-started',
    icon: Book,
    label: 'Getting Started',
    content: (
      <>
        <h4>What is EventGrid?</h4>
        <p>EventGrid is a planning platform for event professionals. You can manage vendors, track finances, coordinate your team, handle guest lists, run live event operations, and share updates with clients — all in one place.</p>

        <h4>Logging In</h4>
        <p>Go to <strong>/login</strong>. You can sign in with email + password, Google, or Apple. If you don't have an account, click <strong>Create Account</strong>.</p>

        <h4>User Roles</h4>
        <p>Your role determines what you see and can do:</p>
        <ul>
          <li><strong>Planner</strong> — full access. Create events, manage everything, view financials.</li>
          <li><strong>Coordinator</strong> — helps run the event. Can see tasks, live board, guests, and team.</li>
          <li><strong>Vendor</strong> — limited to their vendor portal. Can see their contract and event info.</li>
          <li><strong>Client</strong> — views their event through a shared portal link.</li>
          <li><strong>Super Admin</strong> — platform-wide overview. Manages all users, feedback, and analytics.</li>
        </ul>

        <h4>Your Dashboard</h4>
        <p>After login you land on your <strong>dashboard</strong> (<code>/dashboard/planner</code> or <code>/dashboard/coordinator</code>). From here you can see your events, recent activity, and quick stats.</p>

        <h4>Sidebar Navigation</h4>
        <p>The sidebar on the left is your main menu. You'll find links to Dashboard, Events, Vendors, Financials, and Settings. On mobile it collapses to a bottom bar.</p>
      </>
    ),
  },
  {
    id: 'events',
    icon: LayoutDashboard,
    label: 'Event Details',
    content: (
      <>
        <h4>Creating an Event</h4>
        <p>From your dashboard or the Events page, click <strong>Create Event</strong>. Fill in the name, type, date, venue, and guest count. After creation you'll land on the Event Details page.</p>

        <h4>Event Details Page (<code>/events/:id</code>)</h4>
        <p>This is your command center for a single event. It has five sections:</p>

        <h5>Header</h5>
        <ul>
          <li><strong>Event name</strong> — click the pencil icon to rename</li>
          <li><strong>Type badge</strong> — shown after the <code>|</code> separator</li>
          <li><strong>Status badges</strong> — draft, active, in progress, completed, cancelled, plus unpaid/paid</li>
          <li><strong>Countdown</strong> — days/hrs/min until the event</li>
          <li><strong>Tasks &amp; Client Portal</strong> — quick action buttons</li>
        </ul>

        <h5>Info Cards</h5>
        <p>Shows event date, venue, guest count, budget, and progress. Empty critical fields get a subtle highlight. Click <strong>Set →</strong> on the budget to add one.</p>

        <h5>Stats Cards</h5>
        <p>Five clickable cards: Vendors, Tasks Overdue, Open Issues, Phases Done, Live Board. Each navigates to the relevant page.</p>

        <h5>Tabs</h5>
        <ul>
          <li><strong>Overview</strong> — Next Step Card (contextual prompt), Financial Snapshot (planner only), Upcoming Deadlines, Recent Activity</li>
          <li><strong>Timeline</strong> — visual phase timeline</li>
          <li><strong>Phases</strong> — Phase Pipeline + Phase Manager (toggle phases complete/in-progress)</li>
          <li><strong>Modules</strong> — grid of all feature modules (Vendors, Financials, Team, Guests, Tasks, Live Board, Aftermath, Analytics)</li>
        </ul>

        <h5>Payment / Activation</h5>
        <p>Draft unpaid events show a gold banner. Click <strong>Pay ₦20,000</strong> to activate. Choose Paystack or Flutterwave. After success the event becomes active and the modal auto-closes.</p>
      </>
    ),
  },
  {
    id: 'financials',
    icon: DollarSign,
    label: 'Financials',
    content: (
      <>
        <h4>Financials Page (<code>/financials?event=:id</code>)</h4>
        <p>The Financials page tracks all money for an event. It has two tabs: <strong>Vendor Payments</strong> and <strong>Income &amp; Budget</strong>.</p>

        <h5>Understanding the Flow</h5>
        <p>Imagine planning a birthday party. You have three money questions:</p>
        <ol>
          <li><strong>How much did the client pay me?</strong> → Income (money coming in)</li>
          <li><strong>How much am I spending on vendors?</strong> → Vendor Payments (money going out)</li>
          <li><strong>Am I staying on budget?</strong> → Budget Allocations (plan vs actual)</li>
        </ol>

        <h5>Vendor Payments Tab</h5>
        <p>Track <strong>actual money paid to vendors</strong>. Add entries with vendor name, description, category, total amount, and advance paid. The table groups by category with subtotals.</p>
        <ul>
          <li><strong>Add Entry</strong> — fill in the form and save</li>
          <li><strong>Import CSV</strong> — bulk import vendor entries from a CSV file</li>
          <li><strong>Edit / Delete</strong> — click the pencil or trash icon on any row</li>
        </ul>

        <h5>Income &amp; Budget Tab</h5>
        <p>Three sections work together:</p>

        <p><strong>1. Income</strong> — track payments from the client. Status toggle: pending → received → overdue. Summary shows Total Contract, Received, Outstanding.</p>

        <p><strong>2. Budget Allocations</strong> — your <strong>plan</strong> (not actual spending). Set how much you want to spend per category. The bars compare plan vs actual (from Vendor Payments by category). Green = under budget, red = over.</p>

        <p><strong>3. Petty Cash</strong> — small random expenses that don't need a full vendor entry (e.g. "markers for coordinator — ₦2k").</p>

        <h5>P&amp;L Summary</h5>
        <p>Shows Revenue − Vendor Costs − Petty Cash = Gross Profit with margin %. Green ≥ 30%, Yellow 10-30%, Red &lt; 10%.</p>

        <h5>Payment Alerts</h5>
        <p>Flags vendors you still owe and client payments due within 14 days.</p>

        <h5>Planner's Story Walkthrough</h5>
        <ol>
          <li><strong>Client pays ₦2M</strong> → log in Income</li>
          <li><strong>Plan budget:</strong> Venue ₦800k, Catering ₦500k, Decor ₦300k → set in Budget Allocations</li>
          <li><strong>Hire and pay vendors</strong> → log each in Vendor Payments with categories</li>
          <li><strong>Small expenses</strong> → add to Petty Cash</li>
          <li><strong>Check P&amp;L:</strong> Revenue ₦2M − Costs ₦1.3M = ₦690k profit (34.5%)</li>
        </ol>
      </>
    ),
  },
  {
    id: 'vendors',
    icon: Users,
    label: 'Vendor Management',
    content: (
      <>
        <h4>Vendor Directory (<code>/vendors</code>)</h4>
        <p>Your organisation's vendor directory. Shows all vendors across all events. Add, edit, and search vendors by name or category.</p>
        <ul>
          <li><strong>Add Vendor</strong> — click the add button, fill in name, category, contact info</li>
          <li><strong>Add Type</strong> — create custom vendor categories</li>
          <li><strong>Edit</strong> — click pencil to update vendor details</li>
          <li><strong>Duplicate check</strong> — the system prevents adding the same name + category twice</li>
        </ul>

        <h4>Event Vendors (<code>/events/:id/vendors</code>)</h4>
        <p>Vendors assigned to a specific event. Track booking status (sourcing → quoted → negotiating → confirmed → paid → cancelled), payment status, and contracts.</p>
      </>
    ),
  },
  {
    id: 'guests',
    icon: Calendar,
    label: 'Guest Management',
    content: (
      <>
        <h4>Guest List (<code>/events/:id/guests</code>)</h4>
        <p>Manage your event's guest list. Add guests with name, phone, email, and table assignment.</p>
        <ul>
          <li><strong>Add Guest</strong> — manually or import via CSV</li>
          <li><strong>RSVP Status</strong> — pending / confirmed / declined / maybe</li>
          <li><strong>Seating</strong> — assign guests to tables and seat numbers</li>
          <li><strong>Check-in</strong> — mark guests as checked in at the event</li>
          <li><strong>VIP</strong> — flag VIP guests</li>
          <li><strong>Plus One</strong> — allow guests to bring a companion</li>
        </ul>

        <h4>Seating Tables</h4>
        <p>Create tables with names and capacities. Drag guests between tables visually.</p>
      </>
    ),
  },
  {
    id: 'team',
    icon: ListChecks,
    label: 'Team & Tasks',
    content: (
      <>
        <h4>Team Page (<code>/events/:id/team</code>)</h4>
        <p>Manage your event team. Add coordinators and staff members, assign them to phases or tasks.</p>
        <ul>
          <li><strong>Invite Team Members</strong> — send email invitations</li>
          <li><strong>Roles</strong> — assign coordinator or staff access</li>
        </ul>

        <h4>Task Board (<code>/events/:id/tasks</code>)</h4>
        <p>A kanban-style task board. Create tasks with titles, descriptions, assignees, due dates, and priority levels.</p>
        <ul>
          <li><strong>Columns:</strong> Pending → In Progress → Done → Blocked</li>
          <li><strong>Drag &amp; drop</strong> tasks between columns</li>
          <li><strong>Overdue tasks</strong> highlighted in red on the Event Details page</li>
        </ul>
      </>
    ),
  },
  {
    id: 'live-board',
    icon: Radio,
    label: 'Live Board',
    content: (
      <>
        <h4>Live Board (<code>/events/:id/live-board</code>)</h4>
        <p>Real-time event day operations. Monitor stations (e.g. "Reception", "Catering", "Stage") with status indicators.</p>
        <ul>
          <li><strong>Stations</strong> — each area or activity has a status: Green (on track), Yellow (attention needed), Red (critical issue), Grey (not started)</li>
          <li><strong>Status updates</strong> — change station status as the event progresses</li>
          <li><strong>Issues</strong> — log issues with severity (low/medium/high/critical), add photos and resolution notes</li>
          <li><strong>Run Sheet</strong> — timed schedule of activities with actual time tracking</li>
        </ul>
        <p>This page is designed for use during the event itself, typically on a tablet or large screen.</p>
      </>
    ),
  },
  {
    id: 'client-portal',
    icon: ExternalLink,
    label: 'Client Portal',
    content: (
      <>
        <h4>Client Portal</h4>
        <p>Share event progress with your client without giving them full app access.</p>
        <ol>
          <li>On the Event Details page, click <strong>Client Portal</strong></li>
          <li>Enter the client's name, email, and phone</li>
          <li>A shareable link is generated — send it to your client</li>
          <li>The client sees a read-only view: event info, vendor list, run sheet, and progress</li>
        </ol>
        <p>Access tokens use a simple slug format (client name + short code) so they're easy to share.</p>
      </>
    ),
  },
  {
    id: 'aftermath',
    icon: FileText,
    label: 'Aftermath & Reports',
    content: (
      <>
        <h4>Aftermath Page (<code>/events/:id/aftermath</code>)</h4>
        <p>Post-event documentation and reports.</p>
        <ul>
          <li><strong>Report Builder</strong> — generate a PDF report with event summary, vendor list, financials, and notes</li>
          <li><strong>Lessons Learned</strong> — document what went well and what could improve</li>
          <li><strong>Media Gallery</strong> — upload and organise event photos</li>
        </ul>
      </>
    ),
  },
  {
    id: 'feedback',
    icon: MessageSquare,
    label: 'Feedback & Notifications',
    content: (
      <>
        <h4>Feedback</h4>
        <p>From the sidebar, click the <strong>Feedback</strong> button (bottom-left). Submit suggestions, bug reports, or general feedback. Super Admins can reply, and you'll see the response in your Notifications.</p>

        <h4>Notifications (<code>/notifications</code>)</h4>
        <p>All your notifications in one place. Unread items are highlighted. Click <strong>Mark all read</strong> to clear them. You'll be notified when:</p>
        <ul>
          <li>Someone replies to your feedback</li>
          <li>A task is assigned to you</li>
          <li>Your client portal is accessed</li>
          <li>Payment is confirmed</li>
        </ul>
      </>
    ),
  },
  {
    id: 'admin',
    icon: Shield,
    label: 'Admin (Super Admin)',
    content: (
      <>
        <h4>Super Admin Features</h4>
        <p>If your email is in the <code>VITE_SUPER_ADMIN_EMAILS</code> list, you get additional admin panels:</p>
        <ul>
          <li><strong>Dashboard</strong> (<code>/admin</code>) — platform-wide stats, charts, and recent activity</li>
          <li><strong>Analytics</strong> (<code>/admin</code> via sidebar) — 12-month detailed metrics</li>
          <li><strong>Team</strong> (<code>/admin/team</code>) — manage admin users, invite new admins with roles (Super Admin, Monitor, Support)</li>
          <li><strong>Feedback</strong> (<code>/admin/feedback</code>) — view and reply to user feedback</li>
          <li><strong>Role Switcher</strong> — in the sidebar, switch your view to any role (planner, coordinator, vendor, client) to see the app as they do</li>
        </ul>
      </>
    ),
  },
]

export function HelpPage() {
  const [search, setSearch] = useState('')
  const [openTopic, setOpenTopic] = useState<string | null>('getting-started')

  const filtered = search.trim()
    ? TOPICS.filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    : TOPICS

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/settings" className={styles.backBtn} aria-label="Back to settings">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className={styles.title}>User Manual</h2>
          <p className={styles.subtitle}>Everything you need to know about using EventGrid</p>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className={styles.topics}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No topics match your search.</div>
        ) : (
          filtered.map(topic => {
            const Icon = topic.icon
            const isOpen = openTopic === topic.id
            return (
              <div key={topic.id} className={`card ${styles.topicCard}`}>
                <button
                  type="button"
                  className={styles.topicHeader}
                  onClick={() => setOpenTopic(isOpen ? null : topic.id)}
                >
                  <span className={styles.topicIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.topicLabel}>{topic.label}</span>
                  <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                </button>
                {isOpen && (
                  <div className={styles.topicBody}>
                    {topic.content}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
