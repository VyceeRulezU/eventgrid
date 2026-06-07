# Financials Page

**Route:** `/financials?event=<event_id>` (or through Event Modules → Financials)

---

## The Big Picture (Explained Like You're 7)

Imagine you're planning a birthday party. You have three money questions:

1. **How much did the client pay me?** → INCOME (money coming in)
2. **How much am I spending on vendors?** → VENDOR PAYMENTS (money going out)
3. **Am I staying on budget?** → BUDGET ALLOCATIONS (comparing plan vs actual)

The Financials page answers all three.

---

## The Two Tabs

The page has **two tabs** that serve different purposes:

| Tab | What it tracks | Example |
|-----|---------------|---------|
| **Vendor Payments** | Money you paid or owe to vendors | "Paid Lagos Caterers ₦100k" |
| **Income & Budget** | Money from client + your budget plan + small expenses | "Client paid ₦500k", "Catering budget = ₦200k" |

---

## Vendor Payments Tab — "Who did I pay?"

This tab tracks **actual money going out** to vendors. Every time you hire a vendor and pay them (or owe them money), you add an entry here.

### Adding an Entry
1. Click **Add Entry**
2. Fill in: Vendor Name, Description, Category, Quantity, Total (₦), Advance Paid (₦)
3. Click **Save Entry**

### Editing / Deleting
- Click pencil icon to edit
- Click trash icon to delete (confirmation modal)

### CSV Import
1. Click **Import CSV**
2. Drop or select a `.csv` file
3. Map columns: `vendor`, `description`, `category`, `quantity`, `total`, `advance`
4. Review rows and click **Import**
5. Entries are added to the table

### Table
- Grouped by category with subtotals
- Shows: Vendor, Description, QTY, Total, Advance, Balance, Unpaid/Advance/Paid status
- Grand total row at bottom

---

## Income & Budget Tab — "What did the client pay me? Am I on budget?"

This tab has **three sections** that work together.

### 1. Income — "What did the client pay?"

Track **money coming in** from your client. Think of it like invoices:

- **Add Income Entry** — log a payment or invoice from the client
- **Status** — toggle between pending / received / overdue
  - *Pending* = you sent an invoice, waiting for payment
  - *Received* = client paid ✓
  - *Overdue* = client was supposed to pay but hasn't yet
- **Summary** at top shows: Total Contract (₦), Received (₦), Outstanding (₦)

**Example:** Client agreed to pay ₦2M. They've paid ₦1.5M so far. You log that as two entries.

### 2. Budget Allocations — "What did I plan to spend?"

This is your **budget plan** — before you hire anyone, you decide how much to spend on each category.

**It is NOT the same as Vendor Payments.** Here's the difference:

| | Vendor Payments | Budget Allocations |
|---|---|---|
| **What it is** | What you actually paid vendors | What you planned to spend |
| **When you set it** | After you hire someone | Before you start spending |
| **Think of it as** | Your receipt pile | Your shopping list |

**How to use it:**
1. Before the event, set a target for each category:
   - Venue: ₦800k
   - Catering: ₦500k
   - Decor: ₦300k
2. As you add Vendor Payments (categorized as Venue, Catering, etc.), the bars update
3. The bar shows: **Planned vs Actual**
   - Green bar = under budget ✓
   - Red bar = over budget ✗
   - The number shows the difference

**Example:** You planned ₦500k for Catering. You've paid vendors ₦450k so far.
The bar shows: "Allocated: ₦500k | Spent: ₦450k | Left: ₦50k ✓"

### 3. Petty Cash — "Small random expenses"

For tiny purchases that don't need a full vendor entry. Think:
- "Bought markers for the coordinator — ₦2k"
- "Paid for venue inspection transport — ₦5k"

Just add the description and amount. These show up in the P&L card.

---

## Top Section (Always Visible)

### Summary Cards
Four cards showing overall numbers:
- **Total Budget** — sum of all vendor payment amounts
- **Total Paid** — what you've already paid (advance payments)
- **Outstanding** — what you still owe
- **Entry Count** — how many vendor entries you have

### P&L Summary (Profit & Loss)
Shows if you're making money or losing money:
```
Revenue (from client)    ₦2,000,000
Minus Vendor Costs       -₦1,200,000
Minus Petty Cash         -₦50,000
=================================
Gross Profit             ₦750,000  (37.5% margin ✓)
```
- Green = good profit (over 30%)
- Yellow = okay (10-30%)
- Red = low or negative (below 10%)

### Payment Alerts
- **Vendors you still owe** — highlighted so you don't forget
- **Client payments due soon** — within 14 days

---

## Putting It All Together — A Planner's Story

**Step 1:** Client books you for a wedding. They pay ₦2M → you log it in **Income**.

**Step 2:** You plan the budget:
- Venue: ₦800k
- Catering: ₦500k
- Decor: ₦300k
→ You set these in **Budget Allocations**.

**Step 3:** You hire vendors and pay them:
- Lagos Venue: ₦750k (under the ₦800k plan ✓)
- Supreme Caterers: ₦550k (oops, ₦50k over budget ✗)
→ You add these in **Vendor Payments**.

**Step 4:** You buy markers, tape, snacks for the team → ₦10k in **Petty Cash**.

**Step 5:** Check the P&L card:
- Revenue: ₦2,000,000
- Costs: ₦1,310,000 (₦750k + ₦550k + ₦10k)
- Profit: ₦690,000 (34.5% — not bad!)

---

## CSS Module Classes

File: `src/features/financials/FinancialsPage.module.css`

Key classes:
- `.headerTitle`, `.activeEventName` — page heading
- `.summaryGrid`, `.summaryCard` — summary cards
- `.formCard`, `.formGrid`, `.formActions` — add/edit form
- `.editGrid`, `.editActions` — edit modal form
- `.csvOverlay`, `.csvModal` — CSV import modal
- `.actionBtn`, `.deleteBtn` — table action buttons
- `.vendorNameCell`, `.entryDescCell` — table cell styles
- `.subtotalLabel`, `.subtotalValue` — category subtotals
- `.searchWrap`, `.searchInput`, `.searchIcon` — search bar
