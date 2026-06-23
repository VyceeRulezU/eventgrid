import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env.local
const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findUsers() {
  console.log('--- FINDING PROFILES ---')
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, org_id, created_at')
  
  if (pError) {
    console.error('Error fetching profiles:', pError)
    return
  }

  console.log(`Total profiles: ${profiles.length}`)

  // Search by display name / email for Omawunmi and Yinka
  const targetProfiles = profiles.filter(p => {
    const name = (p.display_name || '').toLowerCase()
    const email = (p.email || '').toLowerCase()
    return name.includes('omawunmi') || name.includes('yinka') || email.includes('omawunmi') || email.includes('yinka') || name.includes('omowunmi') || email.includes('omowunmi')
  })

  console.log('\nMatching Omawunmi/Yinka profiles:')
  console.table(targetProfiles)

  console.log('\nAll profiles in database:')
  console.table(profiles.map(p => ({
    id: p.id,
    email: p.email,
    display_name: p.display_name,
    role: p.role,
    org_id: p.org_id,
    created_at: p.created_at
  })))

  // Find profiles with duplicate emails
  const emailCounts = {}
  profiles.forEach(p => {
    const email = (p.email || '').toLowerCase().trim()
    if (!email) return
    emailCounts[email] = emailCounts[email] || []
    emailCounts[email].push(p)
  })

  console.log('\nDuplicate emails in profiles table:')
  Object.keys(emailCounts).forEach(email => {
    if (emailCounts[email].length > 1) {
      console.log(`Email: ${email} (${emailCounts[email].length} profiles)`)
      console.table(emailCounts[email])
    }
  })

  console.log('\n--- FINDING AUTH USERS ---')
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers()
  if (uError) {
    console.error('Error listing auth users:', uError)
  } else {
    console.log(`Total auth users: ${users.length}`)
    
    // Find duplicate emails in auth users
    const authEmailCounts = {}
    users.forEach(u => {
      const email = (u.email || '').toLowerCase().trim()
      if (!email) return
      authEmailCounts[email] = authEmailCounts[email] || []
      authEmailCounts[email].push(u)
    })

    console.log('\nDuplicate emails in auth.users:')
    Object.keys(authEmailCounts).forEach(email => {
      if (authEmailCounts[email].length > 1) {
        console.log(`Email: ${email} (${authEmailCounts[email].length} users)`)
        console.table(authEmailCounts[email].map(u => ({
          id: u.id,
          email: u.email,
          role: u.user_metadata?.role,
          created_at: u.created_at
        })))
      }
    })

    const targetAuthUsers = users.filter(u => {
      const email = (u.email || '').toLowerCase()
      const name = (u.user_metadata?.display_name || '').toLowerCase()
      return email.includes('omawunmi') || email.includes('yinka') || name.includes('omawunmi') || name.includes('yinka') || email.includes('omowunmi') || name.includes('omowunmi')
    })
    console.log('\nMatching auth users:')
    console.table(targetAuthUsers.map(u => ({
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.display_name,
      role: u.user_metadata?.role,
      created_at: u.created_at
    })))
  }

  console.log('\n--- FINDING INVITATIONS ---')
  const { data: invitations, error: iError } = await supabase
    .from('invitations')
    .select('*')
  
  if (iError) {
    console.error('Error fetching invitations:', iError)
  } else {
    console.log(`Total invitations: ${invitations.length}`)
    const targets = invitations.filter(inv => {
      const email = (inv.email || '').toLowerCase()
      const role = (inv.role || '').toLowerCase()
      return email.includes('omawunmi') || email.includes('yinka') || email.includes('omowunmi')
    })
    console.log('Matching Omawunmi/Yinka/Omowunmi invitations:')
    console.table(targets)
    
    console.log('All invitations:')
    console.table(invitations)
  }

  console.log('\n--- FINDING EVENTS ---')
  const { data: events, error: eError } = await supabase
    .from('events')
    .select('id, name, created_by, coordinator_id, client_id, status, created_at')
  
  if (eError) {
    console.error('Error fetching events:', eError)
  } else {
    console.log(`Total events: ${events.length}`)
    console.table(events)
  }

  console.log('\n--- DETAILS FOR OMOWUNMI AND YINKA EVENTS ---')
  const targetIds = [
    '91559d5d-5b72-4717-a0e1-451177942587',
    'dff35b94-530a-46a5-86e0-6310773591b2',
    '1a345f5e-ebbf-454a-aa21-153ec8c5770c'
  ]

  const { data: ea, error: eaErr } = await supabase
    .from('event_access')
    .select('id, event_id, user_id, role, accepted_at')
    .in('event_id', targetIds)

  if (eaErr) {
    console.error('Error fetching event access:', eaErr)
  } else {
    console.log('Event Access for targets:')
    console.table(ea)
  }

  const { data: invs, error: invsErr } = await supabase
    .from('invitations')
    .select('id, event_id, email, status, role')
    .in('event_id', targetIds)

  if (invsErr) {
    console.error('Error fetching target invitations:', invsErr)
  } else {
    console.log('Invitations for targets:')
    console.table(invs)
  }
}

findUsers()
