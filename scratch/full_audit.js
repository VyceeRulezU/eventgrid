import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parse .env.local
const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    envVars[key] = value
  }
})

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function audit() {
  console.log('='.repeat(80))
  console.log('FULL DATABASE AUDIT')
  console.log('='.repeat(80))

  // ── 1. Profiles ──────────────────────────────────────────────────────────────
  const { data: profiles } = await supabase.from('profiles').select('id, email, display_name, role, org_id, created_at')
  console.log(`\n[PROFILES] Total: ${profiles.length}`)
  console.table(profiles.map(p => ({ id: p.id, email: p.email, display_name: p.display_name, role: p.role, org_id: p.org_id })))

  // ── 2. Auth users ─────────────────────────────────────────────────────────────
  const { data: { users } } = await supabase.auth.admin.listUsers()
  console.log(`\n[AUTH USERS] Total: ${users.length}`)

  // Duplicate auth emails
  const authEmailMap = {}
  users.forEach(u => {
    const e = (u.email || '').toLowerCase().trim()
    authEmailMap[e] = authEmailMap[e] || []
    authEmailMap[e].push({ id: u.id, email: u.email, role: u.user_metadata?.role, created_at: u.created_at })
  })
  const dupAuthEmails = Object.entries(authEmailMap).filter(([, arr]) => arr.length > 1)
  if (dupAuthEmails.length) {
    console.log('\n⚠️  DUPLICATE EMAILS IN AUTH.USERS:')
    dupAuthEmails.forEach(([email, arr]) => { console.log(`  ${email}:`); console.table(arr) })
  } else {
    console.log('\n✅  No duplicate emails in auth.users')
  }

  // ── 3. Duplicate events (same name, same creator) ─────────────────────────────
  const { data: events } = await supabase.from('events').select('id, name, created_by, org_id, status, created_at').is('deleted_at', null)
  console.log(`\n[EVENTS] Total: ${events.length}`)
  const eventNameMap = {}
  events.forEach(e => {
    const key = `${e.name}|${e.created_by}`
    eventNameMap[key] = eventNameMap[key] || []
    eventNameMap[key].push(e)
  })
  const dupEvents = Object.entries(eventNameMap).filter(([, arr]) => arr.length > 1)
  if (dupEvents.length) {
    console.log('\n⚠️  DUPLICATE EVENTS (same name + creator):')
    dupEvents.forEach(([key, arr]) => { console.log(`  "${key}"`); console.table(arr) })
  } else {
    console.log('\n✅  No exact duplicate events found')
  }

  // Also show "Omowunmi and Yinka" events specifically
  const owEvents = events.filter(e => e.name.toLowerCase().includes('omowunmi'))
  console.log('\n[OMOWUNMI AND YINKA EVENTS]:')
  console.table(owEvents)

  // ── 4. event_access for those events ─────────────────────────────────────────
  const owEventIds = owEvents.map(e => e.id)
  if (owEventIds.length) {
    const { data: ea } = await supabase.from('event_access').select('event_id, user_id, role, accepted_at').in('event_id', owEventIds)
    console.log('\n[EVENT_ACCESS for Omowunmi events]:')
    // Join with profile names
    const eaWithNames = ea.map(row => {
      const p = profiles.find(p => p.id === row.user_id)
      return { event_id: row.event_id, user: p?.display_name || p?.email || row.user_id, role: row.role, accepted_at: row.accepted_at }
    })
    console.table(eaWithNames)
  }

  // ── 5. Coordinators with no org_id (orphaned) ─────────────────────────────────
  const orphanCoords = profiles.filter(p => p.role === 'coordinator' && !p.org_id)
  if (orphanCoords.length) {
    console.log('\n⚠️  COORDINATORS WITH NO ORG:')
    console.table(orphanCoords)
  } else {
    console.log('\n✅  All coordinators have an org_id')
  }

  // ── 6. Coordinators with org_id = org they weren't invited to ─────────────────
  // Show all coordinators and their org
  const coords = profiles.filter(p => p.role === 'coordinator')
  const { data: orgs } = await supabase.from('organizations').select('id, name, owner_id')
  console.log('\n[ALL COORDINATORS + ORG]:')
  console.table(coords.map(c => {
    const org = orgs.find(o => o.id === c.org_id)
    return { id: c.id, email: c.email, display_name: c.display_name, org_name: org?.name || 'N/A', org_id: c.org_id }
  }))

  // ── 7. Missing event_access for team members who have accepted invitations ─────
  const { data: allInvites } = await supabase.from('invitations').select('*')
  const { data: allEA } = await supabase.from('event_access').select('event_id, user_id')
  console.log(`\n[INVITATIONS] Total: ${allInvites.length}`)
  console.table(allInvites.map(i => {
    const p = profiles.find(p => p.email?.toLowerCase() === i.email?.toLowerCase())
    const hasAccess = p && allEA.some(ea => ea.event_id === i.event_id && ea.user_id === p.id)
    return { email: i.email, event_id: i.event_id, role: i.role, status: i.status, has_profile: !!p, has_event_access: !!hasAccess }
  }))
}

audit().catch(console.error)
