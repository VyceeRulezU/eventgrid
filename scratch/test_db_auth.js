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
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Signing in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'eventgridtest@mailto.plus',
    password: 'Password123!'
  })

  if (authError) {
    console.error('Sign in failed:', authError.message)
    // Try other common email
    console.log('Trying guest/admin email...')
    const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
      email: 'admin@eventgrid.ng',
      password: 'Password123!'
    })
    if (authError2) {
      console.error('Second sign in failed:', authError2.message)
      return
    }
    console.log('Signed in as admin@eventgrid.ng')
  } else {
    console.log('Signed in as eventgridtest@mailto.plus')
  }

  console.log('Querying events...')
  const { data, error } = await supabase.from('events').select('*')
  if (error) {
    console.error('Error fetching events:', error)
  } else {
    console.log('Events in DB:', data)
  }
}

test()
