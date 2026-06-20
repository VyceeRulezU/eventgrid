export interface StaticPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
  tags: string[]
  publishedAt: string
  readTime: string
  featuredImage: {
    placeholderUrl: string
    alt: string
  }
  body: StaticBlock[]
}

export type StaticBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string; bold?: string }
  | { type: 'sectionImage'; placeholderUrl: string; alt: string; caption?: string }
  | { type: 'cta'; text: string; buttonText: string; buttonUrl: string }

const POST_WHATSAPP_EXCEL: StaticPost = {
  _id: 'static-001',
  title: 'Why Nigerian Event Planners Are Still Using WhatsApp and Excel (And What to Use Instead)',
  slug: { current: 'nigerian-event-planners-whatsapp-excel' },
  excerpt: 'Most Nigerian event planners manage million-naira events through WhatsApp groups and Excel sheets. Here\'s why that\'s a problem — and what Nigerian wedding planners and corporate event coordinators are switching to.',
  category: 'Event Planning',
  tags: ['Nigerian Event Planners', 'Event Management Software Nigeria', 'Wedding Planning Tools', 'Naira Budget'],
  publishedAt: '2026-06-01T00:00:00.000Z',
  readTime: '6 min read',
  featuredImage: {
    placeholderUrl: 'https://i.ibb.co/60gZxNh2/72486.jpg',
    alt: 'Nigerian event planner coordinating with vendors and clients using a smartphone and laptop',
  },
  body: [
    {
      type: 'paragraph',
      text: 'If you\'ve been planning events in Nigeria for more than a year, your workflow probably looks something like this:',
    },
    {
      type: 'paragraph',
      text: 'Three WhatsApp groups — one for the client, one for vendors, one for your team. An Excel sheet you update manually when you remember to. A folder of PDFs on your phone that may or may not be the latest version of the proposal. A voice note from the decorator that you still haven\'t listened to.',
    },
    {
      type: 'paragraph',
      text: 'And somehow, despite all of this, the event happens. The jollof gets served. The couple gets married. The managing director gives his speech. The owambe runs until 11pm.',
    },
    {
      type: 'paragraph',
      text: 'Nigerian event planners are extraordinarily good at their jobs. The chaos is not a reflection of their skill — it\'s a reflection of the tools available to them.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://i.ibb.co/bY81ZSB/96972.jpg', alt: 'Event planner managing multiple WhatsApp group chats', caption: 'WhatsApp became the default communication tool for Nigerian event planners, but group chats are not designed for professional event management.' },

    {
      type: 'heading', level: 2, text: 'Why WhatsApp Became the Default',
    },
    {
      type: 'paragraph',
      text: 'WhatsApp didn\'t become the Nigerian event planner\'s primary tool by accident. It solved real problems at exactly the right time.',
    },
    {
      type: 'paragraph',
      text: 'When smartphones became widely affordable in Nigeria around 2015–2018, planners needed a way to communicate with multiple stakeholders quickly and cheaply. WhatsApp was free, everyone had it, it supported photos and documents, and it worked even on slow connections. For a coordinator trying to confirm vendor arrivals from a venue in Lekki with patchy WiFi, a WhatsApp message was more reliable than an email.',
    },
    {
      type: 'paragraph',
      text: 'The same logic applied to Excel. It\'s available offline, it\'s familiar, and it\'s flexible enough to track anything from vendor payments to guest RSVPs to run sheets — if you\'re willing to build the formulas yourself.',
    },
    {
      type: 'paragraph',
      text: 'These were reasonable solutions for 2016. The problem is that it\'s now 2025, Nigerian events have grown significantly in scale and complexity, and the tools haven\'t changed.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://i.ibb.co/q3GyQ0j9/Nigerian-event-industry.webp', alt: 'Nigerian event budget spreadsheet on a laptop', caption: 'Excel spreadsheets managing event budgets in Naira — fragile when multiple people need real-time access.' },

    {
      type: 'heading', level: 2, text: 'The Real Cost of Managing Events on WhatsApp',
    },
    {
      type: 'paragraph',
      text: 'Let\'s be specific about what this actually costs planners.',
    },
    {
      type: 'paragraph', bold: 'Information gets lost.',
      text: 'A vendor confirmation sent in a WhatsApp group six weeks ago is buried under 400 messages by event week. When the caterer claims they said 250 portions and you\'re sure it was 300, there\'s no clean audit trail — just a scroll through a chaotic group chat.',
    },
    {
      type: 'paragraph', bold: 'Clients have no visibility.',
      text: 'Your client has paid a significant deposit and has no idea what\'s happening with their event unless they call you. This creates anxiety on their end and constant check-in calls — calls that interrupt you while you\'re negotiating with a vendor or managing another event.',
    },
    {
      type: 'paragraph', bold: 'Financial tracking breaks down.',
      text: 'The Excel payment tracker only works if it\'s updated consistently. In the pressure of planning multiple Nigerian events — from Lagos weddings to Abuja corporate galas — it doesn\'t get updated consistently. Balances become unreliable. At event closeout, reconciliation takes hours because you\'re not sure which vendors received their advance payments and which haven\'t.',
    },
    {
      type: 'paragraph', bold: 'Coordination on event day is improvised.',
      text: 'On the day itself, a coordinator managing 15 vendor stations across a venue in areas like Victoria Island or Wuse has no centralised view of what\'s ready and what isn\'t. They\'re doing laps of the venue, calling team members, responding to vendor questions, and updating the client — all simultaneously, with no single source of truth.',
    },
    {
      type: 'paragraph', bold: 'Nothing is documented for next time.',
      text: 'After the event ends, the WhatsApp groups go quiet and the Excel sheet closes. What went wrong with that decorator? Why did the AV setup run 45 minutes late? What did you actually spend versus what you budgeted? This information lives in someone\'s memory, which means the same mistakes are available to happen at the next event.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://i.ibb.co/fG23vYXY/The-Nigerian-events-industry-2.webp', alt: 'Nigerian event coordination team meeting', caption: 'Professional event management in Nigeria requires more than just messaging apps and spreadsheets.' },

    {
      type: 'heading', level: 2, text: 'Why Excel Is a Fragile System for Nigerian Event Planners',
    },
    {
      type: 'paragraph',
      text: 'The spreadsheet is a remarkable tool. It is also the wrong tool for collaborative, real-time event management — especially when you\'re managing multiple vendors, guest lists, and budgets in Naira across different events simultaneously.',
    },
    {
      type: 'paragraph',
      text: 'Excel and Google Sheets are designed for one person working on structured data at a time. Event planning involves multiple people, multiple timelines, and information that changes constantly in the weeks before an event.',
    },
    {
      type: 'paragraph',
      text: 'When a planner shares a budget sheet with their coordinator, they\'re now managing two versions. When the coordinator updates the vendor list and the planner updates the payment column at the same time, one person\'s changes overwrite the other\'s. When the sheet gets shared via WhatsApp, there are now five copies floating around with no clear master version.',
    },
    {
      type: 'paragraph',
      text: 'More practically: an Excel sheet cannot send you an alert when a vendor payment is due in three days. It cannot show your client the current phase of their event planning. It cannot tell you, at 2pm on event day, that the photographer has not yet arrived at the venue in Abuja.',
    },
    {
      type: 'paragraph',
      text: 'These are not criticisms of Excel. These are just things a spreadsheet was never designed to do — and Nigerian event professionals deserve tools built for how they actually work.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://i.ibb.co/VckXyRm7/95806.jpg', alt: 'Event management software dashboard showing vendor tracking and budget overview', caption: 'Modern event platforms designed for the Nigerian market provide real-time data without manual spreadsheet updates.' },

    {
      type: 'heading', level: 2, text: 'What Professional Event Management Actually Requires in Nigeria',
    },
    {
      type: 'paragraph',
      text: 'The Nigerian events industry has matured significantly. Corporate events in Abuja now regularly involve 500+ guests, multiple vendors across categories, and client expectations shaped by what they\'ve seen at international events. Wedding budgets in Lagos can run into tens of millions of naira. The stakes are real.',
    },
    {
      type: 'paragraph',
      text: 'Managing at this level requires a system with specific capabilities built for the Nigerian market:',
    },
    {
      type: 'paragraph', bold: 'A single workspace ',
      text: 'where the planner, coordinator, vendors, and client all see relevant information — without everyone seeing everything. A coordinator shouldn\'t see the client\'s financial breakdown. A client shouldn\'t see the vendor negotiation notes. But everyone should be able to see what concerns them.',
    },
    {
      type: 'paragraph', bold: 'Naira-based financial tracking that calculates itself.',
      text: 'Total paid, outstanding balance, budget versus actual — updated automatically as payments are recorded in Nigerian Naira, not manually recalculated every time someone asks.',
    },
    {
      type: 'paragraph', bold: 'Real-time event day coordination.',
      text: 'On event day, a coordinator needs to know instantly: is the catering ready? Has the decorator confirmed their setup is done? Is the photographer on site? This shouldn\'t require walking across a large venue in Lagos to check physically.',
    },
    {
      type: 'paragraph', bold: 'Documentation that survives the event.',
      text: 'Photos, vendor ratings, budget performance, issues and how they were resolved — all of this should be captured during the event and available for review afterward, not reconstructed from memory.',
    },
    {
      type: 'paragraph', bold: 'A client experience that feels professional.',
      text: 'A client who can see their event\'s progress through a clean portal — without calling you to ask — is a client who refers you to their friends and family.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://i.ibb.co/BH8HPKY6/2150183724.jpg', alt: 'NaliGrid event planning software interface on multiple devices', caption: 'NaliGrid is purpose-built for the Nigerian event industry.' },

    {
      type: 'heading', level: 2, text: 'What Nigerian Planners Are Switching To',
    },
    {
      type: 'paragraph',
      text: 'NaliGrid is a platform built specifically for the Nigerian event industry. Not adapted from a Western tool like HoneyBook or Aisle Planner. Not a generic project management app like Trello or Notion repurposed for events. Built from the ground up for how Nigerian planners, coordinators, and vendors actually work.',
    },
    {
      type: 'paragraph',
      text: 'It covers the full event lifecycle — from the first client inquiry through to post-event analysis — across nine structured phases. Vendor management with Naira payment tracking. Guest management with RSVP tracking and seating plans. A live event board for event-day coordination where each vendor station has a real-time status that every team member can update from their phone. A client portal where clients see their event\'s progress without seeing your operational details or vendor costs.',
    },
    {
      type: 'paragraph',
      text: 'The financial module specifically was designed to replace the Excel tracker for Nigerian planners. Every vendor payment — advance paid, balance outstanding, payment date — in one place, with the balance calculated automatically in Naira. The planner is the only person who sees this. Coordinators, vendors, and clients have no access to financial data.',
    },
    {
      type: 'paragraph',
      text: 'It\'s priced per event in Nigerian Naira, starting from ₦5,000 for an intimate event — because Nigerian planners run events, not monthly subscriptions. No dollar pricing. No foreign payment gateways.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://i.ibb.co/p6HCMQGk/50339.jpg', alt: 'Vibrant Nigerian wedding celebration', caption: 'The Nigerian events industry is professionalising rapidly, and forward-thinking planners are upgrading their tools.' },

    {
      type: 'heading', level: 2, text: 'The Shift That\'s Coming',
    },
    {
      type: 'paragraph',
      text: 'The Nigerian event industry is professionalising rapidly. Clients are more demanding. Competition between planners is intensifying. The planners who will build sustainable businesses over the next five years will be the ones who operate systems, not the ones who operate chaos gracefully.',
    },
    {
      type: 'paragraph',
      text: 'WhatsApp and Excel aren\'t going away — they\'re useful tools for many things. But for managing a ₦5 million Lagos wedding or a corporate gala in Abuja with 800 guests, they\'re the wrong tools. The information is too important, the stakes are too high, and the coordination is too complex.',
    },
    {
      type: 'paragraph',
      text: 'The planners we\'ve spoken to who\'ve made the switch to NaliGrid consistently say the same thing: they didn\'t realise how much cognitive load the old system was creating until they stopped using it.',
    },

    {
      type: 'cta',
      text: 'NaliGrid is currently in beta — available to a limited number of planners before public launch. You can create your first event for just ₦100 during the beta period. No monthly subscription, no dollar conversion, no setup fees.',
      buttonText: 'Start for ₦100 →',
      buttonUrl: '/register',
    },
  ],
}

const POST_ESCROW: StaticPost = {
  _id: 'static-002',
  title: 'The Future of Escrow Payments in Nigerian Event Sourcing',
  slug: { current: 'future-of-escrow-payments-event-sourcing' },
  excerpt: 'How escrow-based vendor payments prevent deposit disputes, secure contract amounts, and build trust between Nigerian event planners and their vendors.',
  category: 'Fintech & Security',
  tags: ['Event Payments Nigeria', 'Vendor Deposits', 'Naira Escrow', 'Event Fintech'],
  publishedAt: '2026-06-10T00:00:00.000Z',
  readTime: '5 min read',
  featuredImage: {
    placeholderUrl: 'https://picsum.photos/seed/nigerian-fintech-payment/1200/600',
    alt: 'Secure mobile payment transaction on a smartphone showing Naira transfer confirmation',
  },
  body: [
    {
      type: 'paragraph',
      text: 'One of the most persistent headaches for Nigerian event planners is managing vendor payments. You pay a 50% deposit to the caterer six weeks before the event, and hope they deliver on the day. But what happens when they don\'t show up? Or when they under-deliver and you\'ve already paid in full?',
    },
    {
      type: 'paragraph',
      text: 'This is where escrow payments are changing the game for event sourcing in Nigeria.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/naira-payments/800/400', alt: 'Stack of Nigerian Naira notes representing event vendor deposits', caption: 'Vendor deposit disputes are one of the most common financial issues Nigerian event planners face.' },

    {
      type: 'heading', level: 2, text: 'The Deposit Problem',
    },
    {
      type: 'paragraph',
      text: 'The standard model in Nigerian event planning is straightforward: the planner collects payments from the client, then pays vendors in advance — often 50% to 70% of the total contract value. This leaves planners exposed. If a vendor fails to deliver, recovering that deposit is rarely straightforward.',
    },
    {
      type: 'paragraph',
      text: 'Escrow flips this model. Instead of paying vendors directly, the funds are held by a trusted third party and released only when agreed conditions are met — the caterer has delivered the food, the decorator has completed the setup, the photographer has submitted the edited photos.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/escrow-agreement/800/400', alt: 'Business handshake representing escrow agreement between planner and vendor', caption: 'Escrow agreements protect both planners and vendors by ensuring payment is tied to delivery.' },

    {
      type: 'heading', level: 2, text: 'How Escrow Protects Nigerian Planners',
    },
    {
      type: 'paragraph', bold: 'No more chasing deposits.',
      text: 'When a vendor completes their scope of work, payment is released automatically. You don\'t need to chase anyone for a refund when things go wrong — the funds simply aren\'t released until you confirm delivery.',
    },
    {
      type: 'paragraph', bold: 'Clear audit trail.',
      text: 'Every transaction — deposit, milestone payment, final settlement — is recorded in a single system. No more scrolling through bank apps and WhatsApp messages to figure out who was paid what and when.',
    },
    {
      type: 'paragraph', bold: 'Professional trust.',
      text: 'When you tell a venue or caterer that their payment is held in escrow and will be released upon delivery, it signals that your business operates professionally. It also gives your clients confidence that their funds are protected.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/nigeria-event-venue/800/400', alt: 'Elegant event venue in Nigeria with professional setup', caption: 'As Nigerian events grow in scale and budget, secure payment systems become essential.' },

    {
      type: 'heading', level: 2, text: 'What This Means for the Industry',
    },
    {
      type: 'paragraph',
      text: 'Escrow-based payments are still emerging in Nigeria\'s event industry, but the direction is clear. As event budgets grow larger and client expectations rise, the informal "send to bank account and hope" model becomes unsustainable.',
    },
    {
      type: 'paragraph',
      text: 'Planners who adopt escrow payments early will differentiate themselves. They\'ll be able to offer clients a clear payment protection framework, build stronger relationships with vendors through transparent financial handling, and sleep better knowing they\'re not personally liable for vendor defaults.',
    },

    {
      type: 'cta',
      text: 'NaliGrid is building payment solutions designed for the Nigerian event industry, including escrow-based vendor payment protection. Join the beta and experience the future of event financial management.',
      buttonText: 'Join Beta →',
      buttonUrl: '/register',
    },
  ],
}

const POST_CHECKLIST: StaticPost = {
  _id: 'static-003',
  title: 'Event Day Coordination Blueprint: How Nigerian Coordinators Run Flawless Events',
  slug: { current: 'checklist-blueprint-coordinate-event-day' },
  excerpt: 'A comprehensive coordination framework for Nigerian event coordinators managing on-site vendor check-ins, stage cues, and guest flow from call time to close.',
  category: 'Coordination',
  tags: ['Event Day Coordination', 'Nigerian Event Coordinator', 'Vendor Management', 'Live Board'],
  publishedAt: '2026-05-28T00:00:00.000Z',
  readTime: '8 min read',
  featuredImage: {
    placeholderUrl: 'https://picsum.photos/seed/nigerian-event-coordinator/1200/600',
    alt: 'Nigerian event coordinator with headset managing event day operations',
  },
  body: [
    {
      type: 'paragraph',
      text: 'Event day is where months of planning meet reality. For Nigerian coordinators, it\'s the moment when every decision — vendor communication, timeline management, issue resolution — converges into a single high-pressure window.',
    },
    {
      type: 'paragraph',
      text: 'The difference between an event that flows seamlessly and one that descends into chaos often comes down to one thing: a clear coordination framework that everyone on the team understands and follows.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/coordination-planning/800/400', alt: 'Event coordinator reviewing timeline and vendor checklist on a tablet', caption: 'A structured coordination framework is the foundation of flawless event execution.' },

    {
      type: 'heading', level: 2, text: 'Phase 1: Pre-Event Alignment (48 Hours Before)',
    },
    {
      type: 'paragraph',
      text: 'Two days before the event, every vendor should have confirmed their call time, setup requirements, and point of contact. This is also when you do a final walkthrough of the run of show with the client and your team.',
    },
    {
      type: 'paragraph', bold: 'Key actions:',
      text: 'Confirm all vendor arrival times. Share the final run of show with every vendor and team member. Verify that all equipment, décor, and supplies have been delivered or are scheduled. Confirm guest count with the caterer. Assign team members to specific vendor stations.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/vendor-checkin/800/400', alt: 'Event vendors checking in at a venue reception', caption: 'Vendor check-in is the first critical coordination milestone on event day.' },

    {
      type: 'heading', level: 2, text: 'Phase 2: Vendor Check-In and Setup',
    },
    {
      type: 'paragraph',
      text: 'As vendors arrive, each one should check in with a designated team member who confirms their arrival, verifies their deliverables, and directs them to their setup area. This is not the time to discover that the caterer brought 250 portions when you confirmed 300.',
    },
    {
      type: 'paragraph',
      text: 'A live coordination board — whether physical or digital — should track the status of every vendor station in real time. Catering: checked in, setting up. Decor: arrived, waiting for AV handover. Photography: on site, ready.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/live-coordination/800/400', alt: 'Event coordinator using a live board app to track vendor status', caption: 'Real-time vendor tracking transforms chaotic event days into coordinated operations.' },

    {
      type: 'heading', level: 2, text: 'Phase 3: Guest Arrival and Flow Management',
    },
    {
      type: 'paragraph',
      text: 'Guest arrival is often the most chaotic period of any event. A clear check-in process — digital or manual — ensures guests are welcomed, directed, and accounted for. This is also when last-minute issues surface: a VIP guest who wasn\'t on the list, a seating adjustment, a vendor who needs something.',
    },
    {
      type: 'paragraph',
      text: 'Assign a dedicated team member to manage guest flow while the coordinator focuses on vendor and production issues. These should never be handled by the same person.',
    },

    {
      type: 'heading', level: 2, text: 'Phase 4: Event Execution and Cue Management',
    },
    {
      type: 'paragraph',
      text: 'During the event itself, the coordinator\'s role shifts from setup management to cue management. Speeches, catering service, entertainment segments, cake cutting, bouquet toss — each moment needs to be triggered at the right time by the right person.',
    },
    {
      type: 'paragraph',
      text: 'A digital run of show shared with key vendors and team members ensures everyone knows what\'s next. When things inevitably shift — the MC runs long, a guest speaker arrives late — the updated timeline should be visible to everyone immediately, not communicated through a frantic chain of phone calls.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/nigerian-event-celebration/800/400', alt: 'Nigerian wedding reception with guests celebrating', caption: 'Seamless execution requires every team member to know their role in real time.' },

    {
      type: 'heading', level: 2, text: 'Why Digital Coordination Tools Matter for Nigerian Events',
    },
    {
      type: 'paragraph',
      text: 'Nigerian events are uniquely complex. Large guest counts, multiple vendors across diverse categories, cultural ceremonies with specific timing requirements, and venues that range from banquet halls in Lagos to outdoor grounds in Abuja. A clipboard and a WhatsApp group cannot effectively coordinate this level of complexity.',
    },
    {
      type: 'paragraph',
      text: 'A digital coordination system — like NaliGrid\'s Live Board — gives every team member a real-time view of vendor status, task completion, and the overall event timeline. Updates are instant. Issues are flagged immediately. Everyone sees the same information at the same time.',
    },

    {
      type: 'cta',
      text: 'NaliGrid\'s Live Board gives Nigerian coordinators real-time visibility over every vendor station and event cue. Start your first event for ₦100 during our beta period.',
      buttonText: 'Start for ₦100 →',
      buttonUrl: '/register',
    },
  ],
}

const POST_RECONCILE: StaticPost = {
  _id: 'static-004',
  title: 'Reconciling Aftermath Reports: 5 Financial Mistakes Nigerian Event Planners Make',
  slug: { current: 'reconciling-aftermath-reports-financial-mistakes' },
  excerpt: 'Avoid invoice discrepancies and Naira reconciliation errors. Learn how to close out event finances cleanly with proper vendor payment tracking and budget analysis.',
  category: 'Analytics',
  tags: ['Event Financial Reconciliation', 'Naira Budget', 'Aftermath Reports', 'Vendor Payments'],
  publishedAt: '2026-05-15T00:00:00.000Z',
  readTime: '6 min read',
  featuredImage: {
    placeholderUrl: 'https://picsum.photos/seed/financial-reconciliation/1200/600',
    alt: 'Nigerian event planner reviewing financial documents and receipts on a desk',
  },
  body: [
    {
      type: 'paragraph',
      text: 'The event is over. The guests have gone home. The venue is quiet. And you\'re staring at a pile of receipts, bank transfer confirmations, and WhatsApp messages from vendors saying "have you sent the balance?"',
    },
    {
      type: 'paragraph',
      text: 'Post-event financial reconciliation is where many Nigerian planners lose money — not through overspending during the event, but through poor tracking and documentation after it. Here are the five most common mistakes and how to avoid them.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/receipts-naira/800/400', alt: 'Spreadsheet with Nigerian Naira budget tracking and receipts', caption: 'Post-event reconciliation is often the most stressful part of event management for Nigerian planners.' },

    {
      type: 'heading', level: 2, text: 'Mistake 1: Relying on Bank App Screenshots as Receipts',
    },
    {
      type: 'paragraph',
      text: 'A screenshot of a bank transfer doesn\'t tell you who the payment was for, which event it belongs to, or whether it was a deposit or final balance. When you\'re reconciling finances across multiple events simultaneously, a folder of screenshots on your phone is not an accounting system.',
    },
    {
      type: 'paragraph',
      text: 'Fix: Record every vendor payment in a structured system at the time you make it. Include the vendor name, amount in Naira, payment type (deposit/balance), payment date, and the event it belongs to.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/vendor-payment-tracking/800/400', alt: 'Vendor payment tracking showing Naira amounts and payment status', caption: 'Structured payment tracking eliminates the guesswork from financial reconciliation.' },

    {
      type: 'heading', level: 2, text: 'Mistake 2: Mixing Personal and Business Expenses',
    },
    {
      type: 'paragraph',
      text: 'When you pay for event supplies from your personal account and vendor deposits from your business account, and then reimburse yourself from event income, the trail gets muddy fast. By the time you\'re doing post-event reconciliation, you\'re not sure which expenses were legitimate business costs and which were personal.',
    },
    {
      type: 'paragraph',
      text: 'Fix: Keep all event transactions in a single, event-dedicated financial system. If you\'re using a platform like NaliGrid, every vendor payment, expense, and client deposit is recorded in one place — automatically categorised by event.',
    },

    {
      type: 'heading', level: 2, text: 'Mistake 3: Forgetting About Payment Gateway Fees',
    },
    {
      type: 'paragraph',
      text: 'When a client pays ₦500,000 via bank transfer or card, you don\'t receive ₦500,000. Payment gateways charge fees — typically 1.5% to 3.5% for Nigerian processors. Over multiple events, these fees add up significantly and can distort your budget versus actual analysis.',
    },
    {
      type: 'paragraph',
      text: 'Fix: Record the gross amount (what the client paid) and the net amount (what you received) for every transaction. Factor gateway fees into your budget calculations so you\'re not surprised at reconciliation time.',
    },

    { type: 'sectionImage', placeholderUrl: 'https://picsum.photos/seed/budget-analysis-nigeria/800/400', alt: 'Event budget analysis showing Naira amounts with visual charts', caption: 'Accurate budget versus actual analysis helps Nigerian planners price future events correctly.' },

    {
      type: 'heading', level: 2, text: 'Mistake 4: Not Reconciling Immediately After the Event',
    },
    {
      type: 'paragraph',
      text: 'The temptation after a successful event is to take a break. You\'ll reconcile next week. But next week, another event\'s invoices are arriving, and the mental context of who was paid what and why is fading. Within two weeks, you\'re reconstructing the financial narrative from incomplete information.',
    },
    {
      type: 'paragraph',
      text: 'Fix: Schedule a reconciliation session within 48 hours of every event. Review all payments, collect outstanding receipts, and close out the financial ledger while the details are still fresh.',
    },

    {
      type: 'heading', level: 2, text: 'Mistake 5: Ignoring Lessons Learned from Financial Data',
    },
    {
      type: 'paragraph',
      text: 'Your post-event financial data is one of your most valuable business assets. It tells you exactly how much events actually cost versus what you budgeted. It reveals which vendors consistently deliver within budget and which ones generate cost overruns. It helps you price future events more accurately.',
    },
    {
      type: 'paragraph',
      text: 'Fix: Generate a financial report for every event — even small ones. Compare budget to actual spend. Note where the variances occurred. Use this data to refine your budgeting for the next event of similar size and type.',
    },

    {
      type: 'cta',
      text: 'NaliGrid\'s financial module automatically tracks every vendor payment, expense, and client deposit in Naira — with built-in budget versus actual analysis and post-event reconciliation. Start your first event for ₦100 during beta.',
      buttonText: 'Start for ₦100 →',
      buttonUrl: '/register',
    },
  ],
}

export const STATIC_POSTS: StaticPost[] = [
  POST_WHATSAPP_EXCEL,
  POST_ESCROW,
  POST_CHECKLIST,
  POST_RECONCILE,
]

export function getStaticPost(slug: string): StaticPost | undefined {
  return STATIC_POSTS.find((p) => p.slug.current === slug)
}


