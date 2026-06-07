# Vendors Page

**Route:** `/vendors` (global directory) or `/events/:id/vendors` (event-specific)

---

## The Big Picture

You need a DJ, a caterer, and a decorator for your event. The Vendors pages help you:
1. **Keep a directory** of all vendors you've worked with (or want to work with)
2. **Assign them to events** and track booking status
3. **Manage payments** to each vendor

---

## Vendor Directory (`/vendors`)

Think of this as your **phonebook** of vendors. Every vendor across all your events lives here.

| Feature | How it works |
|---------|-------------|
| **View all** | Table with name, category, contact info, and which org they belong to |
| **Search** | Type to filter by name or category |
| **Add Vendor** | Fill in name, category, phone, email, website |
| **Edit** | Click the pencil icon on any row |
| **Add Type** | Create custom categories (e.g. "Photo Booth", "Security") |
| **Duplicate check** | The app won't let you add the same name + category twice |

### Adding a Vendor
1. Click **Add Vendor**
2. Enter the vendor's name, category (pick from existing or the one you'll create), and contact info
3. Click **Save**

### Adding a Vendor Type
1. Click **Add Type** (top of the directory)
2. Type the new category name and save
3. It appears in the category dropdown when adding/editing vendors

---

## Event Vendors (`/events/:id/vendors`)

Vendors **booked for a specific event**. You pick from your directory and track:

### Booking Status
| Status | Meaning |
|--------|---------|
| **Sourcing** | Looking for someone |
| **Quoted** | Got a price quote |
| **Negotiating** | Discussing terms |
| **Confirmed** | Booked and locked in |
| **Paid** | Fully paid |
| **Cancelled** | No longer working with them |

### Payment Tracking
- **Total cost** — what the vendor charges
- **Advance paid** — deposit paid so far
- **Balance** — remaining amount (auto-calculated)
- **Payment status badges** — Paid / Advance / Unpaid

### Adding a Vendor to an Event
1. On the event vendors page, click **Add Event Vendor**
2. Select a vendor from your directory (or create a new one)
3. Fill in the event-specific details (cost, booking status, notes)
4. **Advance payment** — if you pay a deposit now, mark it here and it syncs to the Financials page

---

## What Coordinators See

Coordinators can **view** the vendor directory and event vendors, but cannot add, edit, or delete vendors.

---

## Pro Tips
- Add vendors to your directory **before** the event so they're ready to assign
- When you pay a vendor advance, it automatically shows up in **Financials → Vendor Payments**
- Use **categories** to group vendors by service type for easy filtering
