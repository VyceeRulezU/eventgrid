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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
  console.log('[CLEANUP] Fetching users list...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Failed to list users:', error.message);
    return;
  }

  const testUsers = users.filter(u => u.email && (u.email.includes('test_admin_') || u.email.includes('test_invite_')));
  console.log(`Found ${testUsers.length} test users to delete.`);

  for (const user of testUsers) {
    console.log(`Deleting ${user.email} (${user.id})...`);
    await supabase.auth.admin.deleteUser(user.id);
  }
  console.log('[CLEANUP] Complete.');
}

cleanup();
