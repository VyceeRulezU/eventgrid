import 'dotenv/config'
import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'

const authFile = 'playwright/.auth.json'

setup('authenticate', async ({ page, baseURL }) => {
  const email = process.env.E2E_TEST_EMAIL
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const appUrl = baseURL || process.env.E2E_APP_URL || 'http://localhost:4173'

  if (!email || !supabaseUrl || !serviceRoleKey) {
    console.log('E2E_TEST_EMAIL / VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping auth setup')
    fs.mkdirSync('playwright', { recursive: true })
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  // Use the admin API to generate a one-time magic link — bypasses Turnstile entirely.
  // No CAPTCHA token is involved, so Supabase's server-side verification is never triggered.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: appUrl },
  })

  if (error || !data?.properties?.action_link) {
    throw new Error(`Failed to generate magic link: ${error?.message ?? 'no action_link returned'}`)
  }

  const actionLink = data.properties.action_link
  console.log('Navigating browser to magic link...')

  // Supabase verifies the token and HTTP-redirects the browser to appUrl with session in hash.
  await page.goto(actionLink, { waitUntil: 'load' })

  // Safety wait: ensure we've left the Supabase auth server domain
  await page.waitForURL((url) => !url.href.includes('supabase.co'), { timeout: 30000 })

  console.log('Post-login URL:', page.url())

  fs.mkdirSync('playwright', { recursive: true })
  await page.context().storageState({ path: authFile })
  console.log('Auth setup complete')
})
