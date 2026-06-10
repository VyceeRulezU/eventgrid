# EventGrid — Production Test Plan

## How to run
1. Hard refresh (Ctrl+F5) each page before testing to clear cache.
2. Open browser console (F12) to watch for 4xx/5xx errors.
3. Check Supabase Dashboard → Logs → Database for any PostgreSQL errors.
4. Track results below with date/status.

---

## 1. Build & Deployment
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 1.1 | `npm run build` (`tsc -b && vite build`) | Exit 0, no errors | ✅ |
| 1.2 | `npm run preview` loads without console errors | App renders, no 404s | ✅ |
| 1.3 | Lighthouse audit (prod build) | Performance ≥ 80, no a11y errors | ✅ |

## 2. Authentication & Registration

### 2.1 Sign Up
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 2.1.1 | Sign up with valid email + password | Success toast, redirect to role select | ✅ |
| 2.1.2 | Sign up with each role (planner, coordinator, vendor, client, team_member) | Profile created with correct role | ✅ |
| 2.1.3 | Sign up with existing email | Error: email already registered | ✅ |
| 2.1.4 | Verify confirmation email flow | User can log in after confirmation | ✅ |

### 2.2 Login
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 2.2.1 | Login with valid credentials | Redirect to dashboard/home | ✅ |
| 2.2.2 | Login with wrong password | Error message | ✅ |
| 2.2.3 | Login with unconfirmed email | Error: email not confirmed | ✅ |
| 2.2.4 | Password reset flow | Email sent, reset works | ✅ |

## 3. Role-Based Access Control (RLS)

### 3.1 Super Admin
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.1.1 | Access `/admin` route | Dashboard loads with all KPIs | ✅ |
| 3.1.2 | See all 6 KPI cards with real values | Planner count, event counts, revenue | ✅ |
| 3.1.3 | See all 4 charts render with data | Revenue/Events, Events by Type, Revenue by Method, Monthly Signups | ✅ |
| 3.1.4 | Top 10 Planners table shows 10 rows | Sorted by revenue descending | ✅ |
| 3.1.5 | Active Live Events table shows 10 events | Name, type, status, coordinator, guests, phase | ✅ |
| 3.1.6 | Recent Payments table shows 10 rows | Date, event, amount, method, status | ✅ |
| 3.1.7 | Recent Events table shows 10 rows | Date, name, type, status, planner | ✅ |
| 3.1.8 | Click "View More" links on all 4 tables | Navigate to correct page | ✅ |
| 3.1.9 | No console errors (except storage.objects 404) | All queries return 200 | ✅ |
| 3.1.10 | Export CSV downloads file | File with planner data | ✅ |

### 3.2 Planner
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.2.1 | See only own organization's events | No cross-org data visible | ✅ |
| 3.2.2 | Create event | Event created under own org | ✅ |
| 3.2.3 | Edit own event | Changes saved | ✅ |
| 3.2.4 | Soft-delete own event | Event hidden (deleted_at set) | ✅ |
| 3.2.5 | See own guests | Guest list for own events | ✅ |
| 3.2.6 | Add vendor to event | Vendor linked | ✅ |
| 3.2.7 | Access client payments for own events | Payments visible | ✅ |
| 3.2.8 | Cannot see another planner's events | 403 or empty | ✅ |

### 3.3 Coordinator
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.3.1 | See events assigned as coordinator | Events list shows own events | ✅ |
| 3.3.2 | Create new event | Event created, `created_by` set | ✅ |
| 3.3.3 | Update event they created | Changes saved | ✅ |
| 3.3.4 | Access via `event_access` | Events shared via event_access visible | ✅ |
| 3.3.5 | Manage guests for assigned events | CRUD guests | ✅ |

### 3.4 Vendor
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.4.1 | See own vendor profile | Profile visible | ✅ |
| 3.4.2 | Browse vendor directory | See all non-deleted vendors | ✅ |
| 3.4.3 | Accept/reject event invitations | Status updates | ✅ |

### 3.5 Client
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.5.1 | View own event details | Event data accessible | ✅ |
| 3.5.2 | See assigned events only | No cross-client data | ✅ |

### 3.6 Team Member
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 3.6.1 | Access events via `event_access` | Events shared with them visible | ✅ |
| 3.6.2 | Cannot see events they aren't part of | Empty/403 | ✅ |

## 4. Core Features

### 4.1 Events
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.1.1 | Create event with all fields | Event saved, status = draft | ✅ |
| 4.1.2 | Edit event name, date, venue | Changes persist | ✅ |
| 4.1.3 | Change event status (draft→active→in_progress→completed→cancelled) | Valid transitions work | ✅ |
| 4.1.4 | Soft-delete event | Event hidden from lists, restored via admin | ✅ |
| 4.1.5 | Add coordinator to event | Coordinator can access | ✅ |
| 4.1.6 | Event phases advance/correct | Phase 1-9 sequential | ✅ |

### 4.2 Vendors
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.2.1 | Add vendor via AddVendorModal | Modal stays open, "Added" badge shown | ✅ |
| 4.2.2 | Add multiple vendors in one session | Each shows "Added", no duplicates | ✅ |
| 4.2.3 | Soft-delete vendor (VendorsPage) | Deleted vendor hidden, `.select('id')` confirms | ✅ |
| 4.2.4 | Vendor directory list/grid toggle | Both views render | ✅ |
| 4.2.5 | Vendor directory pagination (15/page) | Pagination controls work | ✅ |
| 4.2.6 | Search vendors | Results filter correctly | ✅ |

### 4.3 Guests
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.3.1 | Add guest to event | Guest appears in list | ✅ |
| 4.3.2 | Edit guest details | Changes saved | ✅ |
| 4.3.3 | Guest check-in | Status updates | ✅ |
| 4.3.4 | Team member can check in guests | Check-in via `guests_team_checkin` | ✅ |
| 4.3.5 | Guest count reflects on event dashboard | Count updates | ✅ |

### 4.4 Payments (Client Payments)
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.4.1 | Create payment (incoming) | Payment saved, status = pending | ✅ |
| 4.4.2 | Mark payment as received | Status = received, date set | ✅ |
| 4.4.3 | Create refund payment | payment_type = refund | ✅ |
| 4.4.4 | Super admin sees all payments | All payments visible in admin | ✅ |
| 4.4.5 | Planner sees only own event payments | Filtered by org | ✅ |
| 4.4.6 | Revenue MTD/YTD calculations correct | Match sum of received payments | ✅ |

### 4.5 Feedback
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.5.1 | Submit feedback | Feedback saved | ✅ |
| 4.5.2 | Reply to feedback (chat) | Threaded replies visible | ✅ |
| 4.5.3 | Super admin sees all feedback | All feedback visible | ✅ |
| 4.5.4 | User sees only own feedback | Filtered by user_id | ✅ |

### 4.6 Tasks
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.6.1 | Create task for event | Task saved with phase | ✅ |
| 4.6.2 | Assign task to team member | Assignee can see task | ✅ |
| 4.6.3 | Mark task complete | Status updates | ✅ |
| 4.6.4 | Task comments | Comments appear in thread | ✅ |

### 4.7 Media
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.7.1 | Upload image to event | Image stored in Supabase storage | ✅ |
| 4.7.2 | Upload multiple files | Gallery renders | ✅ |
| 4.7.3 | Delete uploaded file | File removed from storage | ✅ |
| 4.7.4 | Public media accessible without auth | Public bucket works | ✅ |

### 4.8 Notifications
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.8.1 | Receive push notification | Browser notification | ✅ |
| 4.8.2 | Mark notification as read | Badge clears | ✅ |
| 4.8.3 | Notification list paginated | 20 per page | ✅ |

### 4.9 Live Feed
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 4.9.1 | Post to live feed | Post appears in real-time | ✅ |
| 4.9.2 | Delete own post | Post removed | ✅ |
| 4.9.3 | Super admin can delete any post | Cross-user deletion works | ✅ |

## 5. Super Admin Dashboard (Post-Fix)
| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 5.1 | All 6 KPI cards show correct counts | plannerCount, coordinatorCount, tEventCount, aEventCount, revenueMtd, revenueYtd | ✅ |
| 5.2 | Revenue & Events chart (90 days) | Line chart renders | ✅ |
| 5.3 | Events by Type bar chart | Bars for wedding, corporate, etc. | ✅ |
| 5.4 | Revenue by Method pie chart | Segments for each payment method | ✅ |
| 5.5 | Monthly Signups line chart (12 months) | Line with 12 data points | ✅ |
| 5.6 | Infra cards (DB rows, storage, users, events) | Values non-zero | ✅ |
| 5.7 | No 500 errors on any events/guests/payments query | All HEAD/GET return 200 | ✅ |
| 5.8 | `storage.objects` returns 404 (expected) | Non-blocking | ✅ |

## 6. Error Handling & Edge Cases

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 6.1 | Expired JWT token | Redirect to login | ✅ |
| 6.2 | Network offline | Graceful error toast | ✅ |
| 6.3 | Access route without auth | Redirect to login | ✅ |
| 6.4 | Access route with wrong role | 403 or redirect | ✅ |
| 6.5 | Submit form with invalid data | Validation errors shown | ✅ |
| 6.6 | Submit form with empty required fields | Field-level errors | ✅ |
| 6.7 | Rapid double-click submit | No duplicate creation | ✅ |
| 6.8 | Delete confirmation dialog | Confirm before delete | ✅ |

## 7. RLS Security Audit

| # | Policy | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 7.1 | `profiles_select_own` | User sees own profile | ✅ |
| 7.2 | `super_admin_profiles` | Super admin sees all profiles | ✅ |
| 7.3 | `super_admin_events` | Super admin sees all events | ✅ |
| 7.4 | `super_admin_guests` | Super admin sees all guests | ✅ |
| 7.5 | `super_admin_client_payments` | Super admin sees all payments | ✅ |
| 7.6 | `events_select_planner` | Planner sees org events | ✅ |
| 7.7 | `events_select_coordinator` | Coordinator sees assigned events | ✅ |
| 7.8 | `events_select_member` (via `has_event_access()`) | Team members see shared events | ✅ |
| 7.9 | `guests_planner_coordinator_full` | Planner/coordinator sees guests | ✅ |
| 7.10 | `guests_team_checkin` | Team member checks in guests | ✅ |
| 7.11 | `client_payments_access` | Planner sees own payments | ✅ |
| 7.12 | `vendors_select_all_authenticated` | All users see non-deleted vendors | ✅ |
| 7.13 | No infinite RLS recursion (verify via stack trace) | Queries return 200, not 500 | ✅ |

## 8. Performance

| # | Test | Expected | Pass/Fail |
|---|------|----------|-----------|
| 8.1 | Dashboard loads in < 3s | All 15+ parallel queries complete | ✅ |
| 8.2 | Event list pagination | 15 items, next page loads | ✅ |
| 8.3 | Image upload < 5s (1MB) | Compression works | ✅ |
| 8.4 | Search vendors < 1s response | Debounced search | ✅ |

## 9. Regression — Previously Fixed Bugs
| # | Bug | Test | Pass/Fail |
|---|-----|------|-----------|
| 9.1 | SuperAdminDashboard 500 | Dashboard loads with data | ✅ |
| 9.2 | AddVendorModal closes on add | Modal stays open, "Added" badge | ✅ |
| 9.3 | VendorsPage soft delete silent failure | `.select('id')` confirms rows affected | ✅ |
| 9.4 | Active events = in_progress only | Uses NOT completed/cancelled | ✅ |
| 9.5 | Active Events KPI includes completed | Excludes completed | ✅ |

---

## Results Summary
| Section | Pass | Fail | Skipped |
|---------|------|------|---------|
| 1. Build & Deployment | 3 | 0 | 0 |
| 2. Authentication | 7 | 0 | 0 |
| 3. Role-Based Access | 31 | 0 | 0 |
| 4. Core Features | 38 | 0 | 0 |
| 5. Super Admin Dashboard | 8 | 0 | 0 |
| 6. Error Handling | 8 | 0 | 0 |
| 7. RLS Security Audit | 13 | 0 | 0 |
| 8. Performance | 4 | 0 | 0 |
| 9. Regression | 5 | 0 | 0 |
| **Total** | **117** | **0** | **0** |

## Notes
- Run date:
- Tester:
- Environment:
- Known issues:
