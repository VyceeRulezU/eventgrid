import 'dotenv/config'
import { chromium, type FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD
  const appUrl = process.env.E2E_APP_URL || 'http://localhost:4173'
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!email || !password) {
    console.log('E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping auth setup')
    return
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — skipping auth setup')
    return
  }

  if (!serviceRoleKey) {
    console.log('SUPABASE_SERVICE_ROLE_KEY not set — skipping auth setup')
    return
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

  // Use the admin API (service_role key) to generate a magic link, bypassing captcha
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('Failed to generate magic link:', linkError?.message || 'No token returned')
    throw new Error(`Failed to generate magic link: ${linkError?.message || 'No token returned'}`)
  }

  // Exchange the magic link token for a full session (public endpoint, no captcha)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: sessionData, error: sessionError } = await anonClient.auth.verifyOtp({
    email,
    token: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  if (sessionError || !sessionData.session) {
    console.error('Failed to verify magic link:', sessionError?.message || 'No session returned')
    throw new Error(`Failed to verify magic link: ${sessionError?.message || 'No session returned'}`)
  }

  console.log('Supabase login succeeded, setting up browser session...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(appUrl, { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ({ key, session }: { key: string; session: string }) => {
        localStorage.setItem(key, session)
      },
      { key: `sb-${projectRef}-auth-token`, session: JSON.stringify(sessionData.session) }
    )

    await page.goto(appUrl, { waitUntil: 'networkidle' })

    const finalUrl = page.url()
    console.log('Post-login URL:', finalUrl)

    await page.context().storageState({ path: 'playwright/.auth.json' })
    console.log('Auth setup complete')
  } catch (err) {
    console.error('Auth setup failed:', err)
    throw err
  } finally {
    await browser.close()
  }
}

export default globalSetup
