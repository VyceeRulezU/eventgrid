import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env variables from .env.local
const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
})

const url = env.VITE_SUPABASE_URL
const service_key = env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', url)
const supabaseAdmin = createClient(url, service_key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function run() {
  const email1 = `test-user-${Date.now()}@example.com`
  console.log('\n--- 1. Testing createUser for email:', email1)
  const res1 = await supabaseAdmin.auth.admin.createUser({
    email: email1,
    email_confirm: true,
    user_metadata: { role: 'team_member' }
  })
  console.log('createUser error:', res1.error)
  console.log('createUser data:', res1.data)

  const email2 = `test-signup-${Date.now()}@example.com`
  console.log('\n--- 2. Testing generateLink (signup) for email:', email2)
  const res2 = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: email2,
    options: {
      redirectTo: 'https://naligrid.com/onboarding/team-member',
      data: { role: 'team_member' }
    }
  })
  console.log('signup link error:', res2.error)
  console.log('signup link data:', res2.data)

  const email3 = `test-invite-${Date.now()}@example.com`
  console.log('\n--- 3. Testing generateLink (invite) for email:', email3)
  const res3 = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: email3,
    options: {
      redirectTo: 'https://naligrid.com/onboarding/team-member',
      data: { role: 'team_member' }
    }
  })
  console.log('invite link error:', res3.error)
  console.log('invite link data:', res3.data)
}

run()
