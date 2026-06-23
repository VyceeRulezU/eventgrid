import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envVars = {}
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (m) envVars[m[1]] = (m[2]||'').trim()
})

const sb = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

/*
CONFIRMED FINDINGS:
──────────────────
1. "Omowunmi and Yinka" has 3 event records:
   - 91559d5d  → ACTIVE  → owner: ohamaraqueen@gmail.com (Queen Ohamara) — KEEP
   - dff35b94  → DRAFT   → owner: ohamaraqueen@gmail.com (Queen Ohamara) — DELETE (draft duplicate)
   - 1a345f5e  → ACTIVE  → owner: qmaravie@gmail.com                     — KEEP (different planner, valid)

2. "dominicchizzy95@gmail.com" (b70b35a2) is a GHOST ACCOUNT:
   - Same person as chinnydominic@gmail.com (2052aa10) — they accepted an invite twice
     and signed up with a second email by mistake.
   - chinnydominic@gmail.com is the REAL account (created first, 09:26)
   - dominicchizzy95@gmail.com created at 15:51 same day — GHOST: DELETE IT
   - Both are in Pauline's org (50d596db) — that's correct, Pauline invited Dominic
   - event_access for ghost (71a6596b) → move to real if not already there ✓ (real already has it)

3. Pauline (pauline08okoye@gmail.com, 312d7c45) is correctly in:
   - Pauline's Coordination org (50d596db) as coordinator/owner
   - Also invited by qmaravie to "Qmara Vie" org as a team_member on event 91559d5d ✓
   - AND is coordinator on Pauline's own event "Proposal" (71a6596b) ✓
   - NO duplicate account needed — Pauline is a single account correctly used across two orgs

4. 3 team members from "Planner /test 1" event (1cc1b3c5) never signed up:
   - dhaveharris@gmail.com     → no profile, no event_access
   - victor.ironali@ollyolly.com → no profile, no event_access  
   - governanceresourcehub@gmail.com → no profile, no event_access
   These people just haven't accepted their invitations yet. Nothing to fix.

5. dominicchizzy95@gmail.com (b70b35a2) is in event_access for 71a6596b as team_member
   AND chinnydominic@gmail.com (2052aa10) is ALSO in event_access for 71a6596b as team_member
   → After deleting ghost, chinnydominic's access is preserved ✓

ACTIONS:
  A. Delete duplicate draft "Omowunmi and Yinka" event (dff35b94)
  B. Delete ghost auth user dominicchizzy95@gmail.com (b70b35a2) — profile cascades
  C. Backfill missing event_access for invitation row #4:
     dominicchizzy95@gmail.com for event 2bb5b64b (has_profile=true, has_event_access=false)
     → but after deleting ghost, this invitation is now irrelevant
  D. Update invitations status to 'accepted' where user has event_access
*/

const DRY_RUN = process.argv.includes('--dry-run')
console.log(DRY_RUN ? '🔍 DRY RUN — no changes applied' : '⚡ LIVE RUN — applying changes now')
console.log()

async function run() {
  // ── A. Delete duplicate draft event ─────────────────────────────────────────
  console.log('[ A ] Deleting duplicate DRAFT "Omowunmi and Yinka" event (dff35b94)...')
  if (!DRY_RUN) {
    const { error } = await sb.from('events').delete().eq('id', 'dff35b94-530a-46a5-86e0-6310773591b2')
    if (error) console.error('  ❌ Failed:', error.message)
    else console.log('  ✅ Deleted (event_access rows cascade-deleted automatically)')
  } else {
    console.log('  [dry-run] Would DELETE events WHERE id = dff35b94')
  }

  // ── B. Delete ghost auth user (cascades profile) ─────────────────────────────
  console.log('\n[ B ] Deleting ghost auth user dominicchizzy95@gmail.com (b70b35a2)...')
  // First, delete their event_access rows (they are covered by chinnydominic already)
  const GHOST_ID = 'b70b35a2-7a74-4b52-9046-1a9d02f97df7'
  if (!DRY_RUN) {
    const { error: eaErr } = await sb.from('event_access').delete().eq('user_id', GHOST_ID)
    if (eaErr) console.error('  ❌ Failed to clear event_access:', eaErr.message)
    else console.log('  ✅ Ghost event_access cleared')
    
    const { error: userErr } = await sb.auth.admin.deleteUser(GHOST_ID)
    if (userErr) console.error('  ❌ Failed to delete auth user:', userErr.message)
    else console.log('  ✅ Ghost auth user deleted (profile cascaded via ON DELETE CASCADE)')
  } else {
    console.log('  [dry-run] Would DELETE event_access WHERE user_id = b70b35a2')
    console.log('  [dry-run] Would DELETE auth.users WHERE id = b70b35a2')
    console.log('  [dry-run] profiles row b70b35a2 would CASCADE delete')
  }

  // ── D. Mark accepted invitations ─────────────────────────────────────────────
  console.log('\n[ D ] Marking invitations as accepted where user has event_access...')
  const { data: invitations } = await sb.from('invitations').select('*')
  const { data: profiles } = await sb.from('profiles').select('id, email')
  const { data: allEA } = await sb.from('event_access').select('event_id, user_id')

  let markedCount = 0
  for (const inv of (invitations || [])) {
    if (inv.status === 'accepted') continue
    const profile = profiles.find(p => p.email?.toLowerCase() === inv.email?.toLowerCase())
    if (!profile) continue
    const hasAccess = allEA.some(ea => ea.event_id === inv.event_id && ea.user_id === profile.id)
    if (hasAccess) {
      console.log(`  Marking accepted: ${inv.email} → event ${inv.event_id}`)
      if (!DRY_RUN) {
        const { error } = await sb.from('invitations').update({ status: 'accepted' }).eq('id', inv.id)
        if (error) console.error(`  ❌ Failed: ${error.message}`)
        else { console.log('  ✅ Marked accepted'); markedCount++ }
      } else {
        console.log(`  [dry-run] Would UPDATE invitations SET status='accepted' WHERE id = ${inv.id}`)
        markedCount++
      }
    }
  }
  if (markedCount === 0) console.log('  (No pending invitations to update)')

  console.log('\n✅ Cleanup complete!')
  console.log('\nSUMMARY:')
  console.log('  - Duplicate draft "Omowunmi and Yinka" event (dff35b94) deleted')
  console.log('  - Ghost account dominicchizzy95@gmail.com deleted; chinnydominic@gmail.com is the real account')  
  console.log(`  - ${markedCount} invitations marked as accepted`)
  console.log('\nNEXT: Fix the coordinator signup flow so invited coordinators cannot create a new account')
}

run().catch(console.error)
