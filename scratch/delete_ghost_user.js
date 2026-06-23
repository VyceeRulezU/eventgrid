import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envVars = {}
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (m) envVars[m[1]] = (m[2]||'').trim()
})

const sb = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

const GHOST_ID = 'b70b35a2-7a74-4b52-9046-1a9d02f97df7'   // dominicchizzy95@gmail.com

async function run() {
  // Step 1: Check current state of the ghost user
  const { data: { user: ghostUser }, error: fetchErr } = await sb.auth.admin.getUserById(GHOST_ID)
  if (fetchErr) {
    console.log('Error fetching ghost user:', fetchErr.message)
  } else {
    console.log('Ghost user:', JSON.stringify({ id: ghostUser?.id, email: ghostUser?.email, created_at: ghostUser?.created_at }, null, 2))
  }

  // Step 2: Check profile still exists
  const { data: profile } = await sb.from('profiles').select('id, email, display_name').eq('id', GHOST_ID)
  console.log('Ghost profile:', JSON.stringify(profile, null, 2))
  
  // Step 3: Check any remaining event_access
  const { data: ea } = await sb.from('event_access').select('*').eq('user_id', GHOST_ID)
  console.log('Remaining event_access:', JSON.stringify(ea, null, 2))
  
  // Step 4: Try delete with shouldSoftDelete flag = false (hard delete)
  console.log('\nAttempting hard delete...')
  const { data, error } = await sb.auth.admin.deleteUser(GHOST_ID, false)
  if (error) {
    console.error('Hard delete failed:', error.message, error)
    
    // Step 5: Fallback — anonymise the account instead
    console.log('\nFalling back to anonymizing the account...')
    const fakeEmail = `ghost_deleted_${Date.now()}@deleted.invalid`
    const { error: updateErr } = await sb.auth.admin.updateUserById(GHOST_ID, {
      email: fakeEmail,
      password: `zzz_deactivated_${Date.now()}`,
      user_metadata: { deleted: true, original_email: 'dominicchizzy95@gmail.com' },
      ban_duration: 'none'
    })
    if (updateErr) {
      console.error('Anonymize failed:', updateErr.message)
    } else {
      // Also update profile
      const { error: profileErr } = await sb.from('profiles').update({
        email: fakeEmail,
        display_name: '[DELETED]',
        is_active: false
      }).eq('id', GHOST_ID)
      
      if (profileErr) console.error('Profile anonymize failed:', profileErr.message)
      else console.log(`✅ Account anonymized → ${fakeEmail}`)
    }
  } else {
    console.log('✅ Hard delete successful')
  }
}

run().catch(console.error)
