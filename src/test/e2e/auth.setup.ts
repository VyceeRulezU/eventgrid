import 'dotenv/config'
import { chromium, type FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD
  const appUrl = process.env.E2E_APP_URL || 'http://localhost:4173'
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!email || !password) {
    console.log('E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping auth setup')
    return
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — skipping auth setup')
    return
  }

  // Derive the Supabase project ref from the URL (subdomain of supabase.co)
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

  // Use the Supabase client directly to authenticate.
  // The Supabase project's Turnstile secret is set to the test key
  // (1x00000000000000000000AB), which accepts ANY captcha token.
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken: 'ci-e2e-test-token' },
  })

  if (error || !data.session) {
    console.error('Supabase login failed:', error?.message || 'No session returned')
    throw new Error(`Supabase login failed: ${error?.message || 'No session returned'}`)
  }

  console.log('Supabase login succeeded, setting up browser session...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Navigate to any page on the app to establish the origin
    await page.goto(appUrl, { waitUntil: 'domcontentloaded' })

    // Inject the Supabase session into localStorage
    await page.evaluate(
      ({ key, session }: { key: string; session: string }) => {
        localStorage.setItem(key, session)
      },
      { key: `sb-${projectRef}-auth-token`, session: JSON.stringify(data.session) }
    )

    // Navigate to the app to verify the session is recognized
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
