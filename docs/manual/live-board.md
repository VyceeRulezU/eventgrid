# Live Board

**Route:** `/events/:id/live-board`

---

## The Big Picture

It's the day of the event. Things are happening in real time. You need to:
- Know if **each area** is running smoothly
- **Flag problems** the moment they happen
- **Track who fixed what**

The Live Board is your event-day command centre.

---

## Stations

Think of stations as **areas or activities** in your event:
- "Reception Desk"
- "Catering"
- "Stage"
- "Photo Booth"
- "Parking"

Each station gets a **status card**:

### Station Status
| Colour | Meaning | Label |
|--------|---------|-------|
| **Green** | All good | Good |
| **Yellow** | Minor issue, watch it | Caution |
| **Red** | Serious problem | Critical |
| **Grey** | Not started yet | Inactive |

### Adding a Station
1. Click **Add Station**
2. Give it a name (e.g. "Reception")
3. Optionally add a category (e.g. "Front of House")
4. Click **Add**

### Updating Station Status
Click a station card to open the **status update** modal:
1. Pick a status colour (green/yellow/red/grey)
2. Optionally add a label (e.g. "On track", "Needs attention")
3. Click **Save**

---

## Issues

When something goes wrong at a station, **flag an issue**:

1. Click **Flag Issue** on the station card
2. Give it a **title** (e.g. "Sound system static")
3. Add a **description** (more detail)
4. Set **severity**:
   - **Low** — minor, can wait
   - **Medium** — should be addressed
   - **High** — needs attention now
   - **Critical** — emergency, stop everything
5. Click **Raise Issue**

### What happens when you raise an issue
- The issue appears in the **Issues table** below
- If severity is **High** or **Critical**, the station auto-turns **Red**

---

## Issues Panel

All issues for this event in one table.

### Tabs
| Tab | What it shows |
|-----|---------------|
| **Open** | Unresolved issues that need attention |
| **Received** | Issues that have been resolved |

### Managing Issues
- **Resolve** — enter a resolution note and mark it done
- **Bulk actions** — select multiple issues to resolve or delete at once
- **Delete** — remove an issue permanently

### Issue Table Columns
| Column | What it shows |
|--------|---------------|
| Checkbox | Select for bulk actions |
| Issue | Title + description |
| Station | Which station it belongs to |
| Severity | Colour-coded badge (Low/Medium/High/Critical) |
| Raised | Who raised it (user ID) + time + "Done" badge if resolved |
| Actions | Resolve or Delete buttons |

---

## What Coordinators See

Coordinators have **full access** to the Live Board — they can:
- View all stations
- Update station status
- Flag and resolve issues

This is intentional because the Live Board is used during the event when coordinators are on the ground.

---

## Pro Tips
- Set up all your stations **before the event day**
- Assign a person to **monitor the board** during the event
- Use **yellow/red statuses** to communicate urgency to the team
- **Resolve issues** with a note so everyone knows what was done
- The **clock badge** in the header shows current event time
