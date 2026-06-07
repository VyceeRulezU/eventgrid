export interface TourStep {
  /** ID of the DOM element to highlight. If null, step is a centered modal. */
  targetId: string | null
  title: string
  body: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

export type TourRole = 'planner' | 'coordinator' | 'client' | 'vendor' | 'super_admin'

export const TOUR_STEPS: Record<TourRole, TourStep[]> = {
  planner: [
    {
      targetId: null,
      title: 'Welcome to EventGrid 🎉',
      body: 'EventGrid is your all-in-one command centre for planning, coordinating, and executing unforgettable events. Let\'s take a quick tour to get you started.',
      placement: 'bottom',
    },
    {
      targetId: 'sidebar-nav',
      title: 'Navigation Sidebar',
      body: 'Your main navigation lives here. Access your Dashboard, Events, Financials, Vendors, and more from this sidebar.',
      placement: 'right',
    },
    {
      targetId: 'tour-create-event',
      title: 'Create Your First Event',
      body: 'Click here to create a new event. EventGrid walks you through 9 operational phases — from booking to aftermath review.',
      placement: 'bottom',
    },
    {
      targetId: 'tour-stats-grid',
      title: 'Portfolio Overview',
      body: 'These cards give you a live snapshot of your entire portfolio — total events, overdue tasks, open issues, and vendor counts.',
      placement: 'bottom',
    },
    {
      targetId: 'tour-shortcuts',
      title: 'Quick Actions',
      body: 'Use these shortcuts to quickly add coordinators, invite clients via the client portal, manage financials, or generate reports.',
      placement: 'left',
    },
    {
      targetId: 'tour-settings-profile',
      title: 'Your Profile & Settings',
      body: 'Set up your business name, logo, contact details, and payment providers here. You can also restart this tour from Settings any time.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: "You're all set! 🚀",
      body: 'That covers the essentials. Explore each event to manage phases, coordinate your team, track finances, and run your day-of operations. You can restart this tour from Settings → Help.',
      placement: 'bottom',
    },
  ],

  coordinator: [
    {
      targetId: null,
      title: 'Welcome, Coordinator! 👋',
      body: 'EventGrid gives you everything you need to coordinate events efficiently. Your planner has added you to their organisation — here\'s a quick tour.',
      placement: 'bottom',
    },
    {
      targetId: 'sidebar-nav',
      title: 'Your Navigation',
      body: 'Switch between Dashboard, Events, and your assigned modules from the sidebar. You have access to tasks, live board, and guest management.',
      placement: 'right',
    },
    {
      targetId: 'tour-my-projects',
      title: 'My Projects',
      body: 'All events you\'re working on are listed here. Click any event to open its full dashboard — phases, tasks, vendors, and more.',
      placement: 'bottom',
    },
    {
      targetId: 'tour-quick-actions',
      title: 'Quick Actions',
      body: 'Jump to your task board, live operations board, or the event dashboard instantly from here.',
      placement: 'left',
    },
    {
      targetId: null,
      title: "Ready to coordinate! ✅",
      body: 'Your planner will assign tasks and phases to you. Check your task board daily and use the Live Board on event day. You can replay this tour from Settings.',
      placement: 'bottom',
    },
  ],

  client: [
    {
      targetId: null,
      title: 'Your Event Portal 🎊',
      body: 'Welcome to your private event portal! Your event planner has given you access to track the progress of your event in real time.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: 'Event Progress',
      body: 'See which planning phases are complete and what\'s currently in progress. Your planner updates this as work advances.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: 'Payment Timeline',
      body: 'Track payment milestones — outstanding balances, received amounts, and due dates — all in one place.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: "Questions? Reach out! 💬",
      body: 'If you have any questions about your event planning, contact your planner directly. This portal is always up to date with the latest progress.',
      placement: 'bottom',
    },
  ],

  vendor: [
    {
      targetId: null,
      title: 'Welcome to EventGrid! 🏪',
      body: 'Your vendor portal gives you visibility into event bookings, your contract status, and payment progress.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: 'Your Bookings',
      body: 'View all events you\'ve been booked for, your service details, and payment terms.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: 'Payment Status',
      body: 'Track advance payments received and outstanding balances. Status badges update in real time as payments are logged.',
      placement: 'bottom',
    },
  ],

  super_admin: [
    {
      targetId: null,
      title: 'EventGrid Admin Panel 🛡️',
      body: 'Welcome to the super admin dashboard. You have full visibility across all organisations, users, and feedback on this platform.',
      placement: 'bottom',
    },
    {
      targetId: 'sidebar-nav',
      title: 'Admin Navigation',
      body: 'The Admin section in the sidebar gives you access to Analytics, Feedback management, and the Admin Team. You can also switch to view the app as any role.',
      placement: 'right',
    },
    {
      targetId: null,
      title: 'Analytics',
      body: 'Monitor platform-wide usage: active organisations, events created, revenue, and user growth trends.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: 'Feedback Management',
      body: 'Review and respond to feedback submitted by planners and coordinators across all organisations.',
      placement: 'bottom',
    },
    {
      targetId: null,
      title: "Full control, responsibly used ⚡",
      body: 'With admin access comes full platform visibility. Use the role switcher to test the experience from any user perspective.',
      placement: 'bottom',
    },
  ],
}
