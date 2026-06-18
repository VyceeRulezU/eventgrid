import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Error listing users:', error)
    return
  }

  console.log('Existing users in DB:')
  for (const u of users) {
    console.log(`- ${u.email} (ID: ${u.id})`)
  }

  const targetEmail = 'e2e-test-planner@eventgrid.ng'
  let testUser = users.find(u => u.email === targetEmail)

  if (!testUser) {
    console.log(`Creating test user ${targetEmail}...`)
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: targetEmail,
      email_confirm: true,
      user_metadata: {
        role: 'planner',
        display_name: 'E2E Test Planner',
        onboarding_completed: true,
      }
    })
    if (createErr) {
      console.error('Failed to create user:', createErr)
      return
    }
    testUser = newUser.user
    console.log(`Created user: ${testUser.email} (ID: ${testUser.id})`)
  } else {
    console.log(`Test user ${targetEmail} already exists.`)
  }

  // Check if profile exists
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (profErr || !profile) {
    console.log('Creating profile for test user...')
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: testUser.id,
        email: testUser.email,
        display_name: 'E2E Test Planner',
        role: 'planner',
        is_active: true,
      })
    if (insertErr) {
      console.error('Failed to create profile:', insertErr)
    } else {
      console.log('Profile created.')
    }
  } else {
    console.log('Profile already exists:', profile)
  }
}

run().catch(console.error)
