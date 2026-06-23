import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envVars = {}
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (m) envVars[m[1]] = (m[2]||'').trim()
})

const sb = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: orgs } = await sb.from('organizations').select('id, name, owner_id, created_at')
  const { data: profiles } = await sb.from('profiles').select('id, email, display_name, role, org_id, created_at')
  const { data: { users } } = await sb.auth.admin.listUsers()
  const { data: ea } = await sb.from('event_access').select('event_id, user_id, role, accepted_at')
  
  const orgsMap = {}
  orgs.forEach(o => orgsMap[o.id] = o)
  const profilesMap = {}
  profiles.forEach(p => profilesMap[p.id] = p)

  console.log('\n=== ALL ORGANIZATIONS ===')
  console.table(orgs.map(o => {
    const owner = profilesMap[o.owner_id]
    return { id: o.id, name: o.name, owner_email: owner?.email, owner_name: owner?.display_name, created_at: o.created_at }
  }))

  // Orgs of interest
  const QMARA_ORG = '92369fe9-7eea-43bf-95ee-8e73cc1eb2c6'  // Qmara Vie Ohamara
  const PAULINE_ORG = '50d596db-a760-4608-933f-0f8d3f1d30fb' // Pauline's Coordination

  console.log('\n=== QMARA VIE ORG MEMBERS ===')
  const qmaraMembers = profiles.filter(p => p.org_id === QMARA_ORG)
  console.table(qmaraMembers.map(p => ({ id: p.id, email: p.email, display_name: p.display_name, role: p.role })))

  console.log('\n=== PAULINE COORDINATION ORG MEMBERS ===')
  const paulineOrgMembers = profiles.filter(p => p.org_id === PAULINE_ORG)
  console.table(paulineOrgMembers.map(p => ({ id: p.id, email: p.email, display_name: p.display_name, role: p.role })))

  // Pauline profile detail
  const pauline = profiles.find(p => p.email === 'pauline08okoye@gmail.com')
  console.log('\n=== PAULINE PROFILE ===')
  console.log(JSON.stringify(pauline, null, 2))

  const paulineAuthUser = users.find(u => u.email === 'pauline08okoye@gmail.com')
  console.log('\n=== PAULINE AUTH USER METADATA ===')
  console.log(JSON.stringify({ id: paulineAuthUser?.id, email: paulineAuthUser?.email, metadata: paulineAuthUser?.user_metadata }, null, 2))

  // Pauline event_access
  console.log('\n=== PAULINE EVENT ACCESS ===')
  const paulineEA = ea.filter(r => r.user_id === pauline?.id)
  console.table(paulineEA)

  // chinnydominic / dominicchizzy95 details
  console.log('\n=== DOMINIC ACCOUNTS ===')
  const dominics = profiles.filter(p => p.email?.includes('dominic') || p.email?.includes('chinny'))
  console.table(dominics.map(p => ({ id: p.id, email: p.email, display_name: p.display_name, role: p.role, org_id: p.org_id })))

  for (const d of dominics) {
    const dEA = ea.filter(r => r.user_id === d.id)
    console.log(`\nEvent access for ${d.email}:`)
    console.table(dEA)

    const authU = users.find(u => u.id === d.id)
    console.log(`Auth metadata for ${d.email}:`, JSON.stringify(authU?.user_metadata, null, 2))
  }

  // qmaravie invited coordinators — check event_access for Pauline's events
  const qmaraPlannerProfile = profiles.find(p => p.email === 'qmaravie@gmail.com')
  console.log('\n=== QMARA PLANNER PROFILE ===')
  console.log(JSON.stringify(qmaraPlannerProfile, null, 2))

  const qmaraEvents = await sb.from('events').select('id, name, created_by, status').eq('org_id', QMARA_ORG)
  console.log('\n=== QMARA ORG EVENTS ===')
  console.table(qmaraEvents.data)

  // Who can see which events via event_access
  console.log('\n=== ALL EVENT_ACCESS (with user emails) ===')
  const eaFull = ea.map(r => {
    const p = profilesMap[r.user_id]
    return { event_id: r.event_id, user_email: p?.email, user_name: p?.display_name, role: r.role, accepted_at: r.accepted_at }
  })
  console.table(eaFull)
}

run().catch(console.error)
