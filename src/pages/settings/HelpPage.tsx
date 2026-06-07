import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Search, Book, LayoutDashboard, DollarSign, Users, Calendar, Radio, ExternalLink, FileText, MessageSquare, Shield, ArrowLeft, ListChecks } from 'lucide-react'
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
        <p>Think of this as your phonebook of vendors. Every vendor across all your events lives here. Add, edit, and search by name or category.</p>
        <ul>
          <li><strong>Add Vendor</strong> — fill in name, category, phone, email, website</li>
          <li><strong>Add Type</strong> — create custom categories (e.g. "Photo Booth", "Security")</li>
          <li><strong>Edit</strong> — click pencil to update vendor details</li>
          <li><strong>Duplicate check</strong> — the app prevents adding the same name + category twice</li>
        </ul>

        <h4>Event Vendors (<code>/events/:id/vendors</code>)</h4>
        <p>Vendors booked for a specific event. Pick from your directory and track:</p>
        <ul>
          <li><strong>Booking Status</strong> — Sourcing → Quoted → Negotiating → Confirmed → Paid → Cancelled</li>
          <li><strong>Payment tracking</strong> — total cost, advance paid, balance auto-calculated</li>
          <li><strong>Advance payment</strong> — mark a deposit and it syncs to the Financials page</li>
        </ul>

        <h4>Coordinator Access</h4>
        <p>Coordinators can <strong>view</strong> the directory and event vendors, but cannot add, edit, or delete.</p>
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
        <p>Manage your event's guest list — who's coming, where they sit, and checking them in at the door.</p>

        <h5>Adding Guests</h5>
        <ul>
          <li><strong>Manual</strong> — click Add Guest, fill in name, phone, email</li>
          <li><strong>CSV Import</strong> — bulk upload with columns: name, phone, email, table</li>
        </ul>

        <h5>RSVP Status</h5>
        <p>Click the badge to cycle: <strong>Pending</strong> → <strong>Confirmed</strong> → <strong>Declined</strong> → <strong>Maybe</strong></p>
        <ul>
          <li><strong>VIP</strong> — flag important guests</li>
          <li><strong>Plus One</strong> — let guests bring a companion</li>
        </ul>

        <h5>Check-in</h5>
        <p>When guests arrive, click <strong>Check-in</strong> to mark them as arrived. Checked-in guests are highlighted.</p>

        <h5>Seating</h5>
        <p>Create tables with names and capacities. Assign guests to tables visually.</p>

        <h5>Coordinator Access</h5>
        <p>Coordinators can view the guest list and check guests in, but cannot add, edit, or delete.</p>
      </>
    ),
  },
  {
    id: 'team-tasks',
    icon: ListChecks,
    label: 'Team & Tasks',
    content: (
      <>
        <h4>Team Page (<code>/events/:id/team</code>)</h4>
        <p>Manage your event team. Invite people to your organisation and assign roles.</p>
        <ul>
          <li><strong>View team</strong> — table of all members in your org</li>
          <li><strong>Invite member</strong> — enter email, select role (Planner or Coordinator), invite is sent via email</li>
          <li><strong>Invite status</strong> — Pending (not yet accepted) or Accepted</li>
          <li><strong>Remove member</strong> — cannot remove yourself</li>
        </ul>

        <h5>Roles</h5>
        <ul>
          <li><strong>Planner</strong> — full access to everything</li>
          <li><strong>Coordinator</strong> — can view and update tasks, live board, guests (check-in only), team</li>
        </ul>

        <h4>Task Board (<code>/events/:id/tasks</code>)</h4>
        <p>A kanban-style board. Tasks are arranged in columns: <strong>Pending</strong> → <strong>In Progress</strong> → <strong>Done</strong> → <strong>Blocked</strong>.</p>

        <h5>Creating a Task</h5>
        <p>Click <strong>Add Task</strong> and fill in: Title (required), Description, Assignee, Due date, Priority (low/medium/high/critical).</p>

        <h5>Drag &amp; Drop</h5>
        <p>Drag task cards between columns to update status.</p>

        <h5>Overdue Tasks</h5>
        <p>Past-due tasks show in red on the board and appear in the Event Details Upcoming Deadlines widget.</p>

        <h5>Coordinator Access</h5>
        <p>Coordinators can view and drag tasks, add comments, but cannot create, edit, or delete tasks.</p>
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
        <p>Your event-day command centre. Monitor areas (stations), flag problems (issues), and resolve them in real time.</p>

        <h5>Stations</h5>
        <p>Each area or activity gets a status card. Click a card to update its status via a modal.</p>
        <ul>
          <li><strong>Green</strong> — on track, all good</li>
          <li><strong>Yellow</strong> — minor issue, watch it</li>
          <li><strong>Red</strong> — serious problem, needs attention</li>
          <li><strong>Grey</strong> — not started yet</li>
          <li><strong>Add Station</strong> — give it a name and optional category</li>
        </ul>

        <h5>Issues</h5>
        <p>Flag issues from any station card. Set severity (low/medium/high/critical). High/critical issues auto-turn the station red.</p>

        <h5>Issues Panel</h5>
        <p>All issues in one table with <strong>Open</strong> and <strong>Received</strong> tabs:</p>
        <ul>
          <li><strong>Resolve</strong> — add a resolution note and mark done</li>
          <li><strong>Bulk actions</strong> — select multiple to resolve or delete at once</li>
          <li><strong>Columns</strong> — checkbox, issue title, station, severity badge, raised info, actions</li>
        </ul>

        <h5>Coordinator Access</h5>
        <p>Coordinators have full access — they can view stations, update status, flag and resolve issues. This is intentional for event-day use.</p>
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
        <p>Share event progress with your client without giving them an account. They get a read-only link.</p>

        <h5>Creating a Portal Link</h5>
        <ol>
          <li>On the Event Details page, click <strong>Client Portal</strong></li>
          <li>Enter the client's name, email, and phone</li>
          <li>A unique link is generated (slug format: client name + short code)</li>
          <li>Copy and send it to your client</li>
        </ol>

        <h5>What Clients See</h5>
        <ul>
          <li>Event name and date</li>
          <li>List of vendors booked</li>
          <li>Run sheet / schedule</li>
          <li>Phase completion progress</li>
        </ul>
        <p>Everything is read-only. The link works on any device.</p>

        <h5>Coordinator Access</h5>
        <p>Only planners can generate or manage client portals.</p>
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
        <p>Post-event documentation hub. Generate reports, record lessons, and organise photos.</p>

        <h5>Report Builder</h5>
        <p>Generate a professional PDF report including: event overview, vendor list with costs, budget summary, guest counts, and notes.</p>
        <ol>
          <li>Click <strong>Build Report</strong></li>
          <li>Select what to include</li>
          <li>Click <strong>Generate PDF</strong> — downloads directly</li>
        </ol>

        <h5>Lessons Learned</h5>
        <p>Document what went well and what could improve for future events.</p>
        <ul>
          <li><strong>What worked</strong> — things to repeat</li>
          <li><strong>What didn't</strong> — things to improve</li>
          <li><strong>Surprises</strong> — unexpected things</li>
        </ul>

        <h5>Media Gallery</h5>
        <p>Upload event photos. Grouped by date, click to view full size.</p>

        <h5>Coordinator Access</h5>
        <p>Coordinators can view the aftermath page but cannot generate reports or add content.</p>
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
        <p>Found a bug or have a suggestion? Click the <strong>Feedback</strong> button in the sidebar (bottom-left, message icon).</p>
        <ul>
          <li>Choose category: Bug Report, Feature Request, or General</li>
          <li>Write your message and click Send</li>
          <li>Super Admins can reply — you'll get a notification</li>
          <li>Check your Notifications page for their response</li>
        </ul>

        <h4>Notifications (<code>/notifications</code>)</h4>
        <p>All your notifications in one place. Newest first.</p>
        <ul>
          <li><strong>Unread</strong> items are highlighted</li>
          <li>Click a notification to mark it read</li>
          <li>Click <strong>Mark All Read</strong> to clear everything</li>
        </ul>

        <h5>You'll Be Notified When:</h5>
        <ul>
          <li>Someone replies to your feedback</li>
          <li>A task is assigned to you</li>
          <li>Payment is confirmed</li>
          <li>Your client portal is accessed</li>
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

function TopicBody({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
  const innerRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`${styles.topicBodyWrap} ${isOpen ? styles.topicBodyWrapOpen : ''}`}>
      <div className={styles.topicBodyInner} ref={innerRef}>
        {isOpen && <div className={styles.topicBody}>{children}</div>}
      </div>
    </div>
  )
}

export function HelpPage() {
  const [search, setSearch] = useState('')
  const [openTopic, setOpenTopic] = useState<string | null>('getting-started')

  const filtered = search.trim()
    ? TOPICS.filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    : TOPICS

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <Book size={24} />
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>User Manual</h1>
            <p className={styles.heroSubtitle}>Everything you need to know about using EventGrid</p>
          </div>
          <div className={styles.heroActions}>
            <Link to="/settings" className={styles.backBtn} aria-label="Back to settings">
              <ArrowLeft size={18} />
            </Link>
          </div>
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
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Search size={24} />
            </div>
            <div className={styles.emptyTitle}>No topics found</div>
            <div className={styles.emptyDesc}>Try a different search term</div>
          </div>
        ) : (
          filtered.map(topic => {
            const Icon = topic.icon
            const isOpen = openTopic === topic.id
            return (
              <div
                key={topic.id}
                className={`card ${styles.topicCard} ${isOpen ? styles.topicCardOpen : ''}`}
              >
                <button
                  type="button"
                  className={styles.topicHeader}
                  onClick={() => setOpenTopic(isOpen ? null : topic.id)}
                >
                  <span className={styles.topicIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.topicLabel}>{topic.label}</span>
                  <span className={styles.topicCount}>{topic.id === 'team-tasks' ? '2' : '1'}</span>
                  <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                </button>
                <TopicBody isOpen={isOpen}>
                  {topic.content}
                </TopicBody>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
