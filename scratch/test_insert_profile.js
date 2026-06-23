import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

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

const supabase = createClient(url, service_key)

async function run() {
  console.log('Fetching a profile...')
  const { data: profiles, error: fetchErr } = await supabase
    .from('profiles')
    .select('id, role, email')
    .limit(1)

  if (fetchErr || !profiles || profiles.length === 0) {
    console.error('Error fetching profiles:', fetchErr)
    return
  }

  const profile = profiles[0]
  console.log('Original profile:', profile)

  console.log(`Attempting to set role to "team_member" for profile ID: ${profile.id}...`)
  const { data: updateData, error: updateErr } = await supabase
    .from('profiles')
    .update({ role: 'team_member' })
    .eq('id', profile.id)
    .select()

  if (updateErr) {
    console.error('Update failed with error:', updateErr)
  } else {
    console.log('Update succeeded! Response:', updateData)

    // Revert role back to original
    console.log(`Reverting role back to "${profile.role}"...`)
    await supabase
      .from('profiles')
      .update({ role: profile.role })
      .eq('id', profile.id)
  }
}

run()
