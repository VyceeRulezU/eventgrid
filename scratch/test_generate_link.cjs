const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runTest() {
  const testEmail = `test_admin_${Date.now()}@example.com`;
  console.log(`[TEST] Generating invite link for new user: ${testEmail}`);

  // Test generating a single-use 'invite' link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: testEmail,
    options: {
      data: { role: 'planner', is_super_admin: true, invite_role: 'super_admin' },
      redirectTo: 'https://naligrid.com/accept-admin-invite?role=super_admin'
    }
  });

  if (error) {
    console.error('[FAIL] Link generation failed:', error.message);
    process.exit(1);
  }

  console.log('[SUCCESS] Link generated successfully!');
  console.log('Action Link:', data.properties?.action_link);
  console.log('User Record ID:', data.user?.id);

  // Clean up user record
  console.log(`[TEST] Cleaning up test user record: ${data.user?.id}`);
  const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user?.id);
  if (deleteError) {
    console.error('[WARN] Failed to clean up user record:', deleteError.message);
  } else {
    console.log('[SUCCESS] Test user record cleaned up.');
  }
}

runTest();
