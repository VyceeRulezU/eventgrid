import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envVars = {}
fs.readFileSync('.env.local','utf8').split('\n').forEach(l => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (m) envVars[m[1]] = (m[2]||'').trim()
})

const sb = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)

async function exec(sql, label) {
  console.log(`\nRunning: ${label}`)
  const { error } = await sb.rpc('exec_sql', { query: sql }).maybeSingle()
  if (error) {
    console.error(`  ❌ ${error.message}`)
    return false
  }
  console.log(`  ✅ Done`)
  return true
}

// We'll use the pg REST API directly since supabase-js doesn't expose raw SQL exec
// Use the Supabase management API via fetch
const SUPABASE_URL = envVars.VITE_SUPABASE_URL
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY
const PROJECT_REF = SUPABASE_URL.split('//')[1].split('.')[0]

async function execSQL(sql, label) {
  console.log(`\n[SQL] ${label}`)
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY
    },
    body: JSON.stringify({ query: sql })
  })
  
  if (!res.ok) {
    const text = await res.text()
    // Maybe exec_sql doesn't exist; try applying via the pg connection
    console.error(`  ❌ HTTP ${res.status}: ${text}`)
    return false
  }
  
  const data = await res.json()
  console.log(`  ✅ Done:`, data)
  return true
}

// Apply 082 manually step by step
async function run() {
  console.log('Applying migration 082 manually...')
  
  // Step 1: Normalise profile emails  
  const step1 = `UPDATE public.profiles SET email = LOWER(email) WHERE email != LOWER(email)`
  const r1 = await execSQL(step1, 'Step 1: Normalise profile emails')
  
  // Step 2a: Delete duplicate invitation rows that would conflict on lowercasing
  const step2a = `
    DELETE FROM public.invitations AS inv
    USING public.invitations AS inv2
    WHERE inv.id != inv2.id
      AND inv.event_id = inv2.event_id
      AND LOWER(inv.email) = LOWER(inv2.email)
      AND inv.email != LOWER(inv.email)
      AND inv2.email = LOWER(inv2.email)
  `
  const r2a = await execSQL(step2a, 'Step 2a: Delete duplicate invitation rows (uppercase)')
  
  // Step 2b: Normalise invitation emails
  const step2b = `UPDATE public.invitations SET email = LOWER(email) WHERE email != LOWER(email)`
  const r2b = await execSQL(step2b, 'Step 2b: Normalise invitation emails')
  
  // Step 3: Add check constraint
  const step3 = `
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_lowercase;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_lowercase CHECK (email = LOWER(email))
  `
  const r3 = await execSQL(step3, 'Step 3: Add lowercase constraint on profiles.email')
  
  // Apply 083: Fix handle_new_user trigger
  const step4 = `
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO profiles (id, email, display_name, role, phone)
      VALUES (
        NEW.id,
        LOWER(NEW.email),
        NEW.raw_user_meta_data->>'display_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'coordinator'),
        NEW.raw_user_meta_data->>'phone'
      )
      ON CONFLICT (id) DO UPDATE
        SET email = LOWER(EXCLUDED.email);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
  `
  const r4 = await execSQL(step4, 'Step 4: Fix handle_new_user trigger (lowercase email)')
  
  console.log('\nDone.')
}

run().catch(console.error)
