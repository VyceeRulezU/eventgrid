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
  const authUrl = `${supabaseUrl}/auth/v1`

  // Generate a magic link via the GoTrue admin API (bypasses captcha)
  const linkRes = await fetch(`${authUrl}/admin/generate_link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ type: 'magiclink', email }),
  })

  if (!linkRes.ok) {
    const body = await linkRes.text()
    console.error('generate_link failed:', linkRes.status, body)
    throw new Error(`generate_link failed (${linkRes.status}): ${body}`)
  }

  const linkData = await linkRes.json()
  const hashedToken = linkData.hashed_token ?? linkData.properties?.hashed_token

  if (!hashedToken) {
    console.error('No hashed_token in response:', JSON.stringify(linkData))
    throw new Error('No hashed_token in generate_link response')
  }

  // Exchange the magic link token for a full session
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  const { data: sessionData, error: sessionError } = await anonClient.auth.verifyOtp({
    email,
    token: hashedToken,
    type: 'magiclink',
  })

  if (sessionError || !sessionData.session) {
    console.error('Failed to verify magic link:', sessionError?.message || 'No session returned')
    throw new Error(`Failed to verify magic link: ${sessionError?.message || 'No session returned'}`)
  }

  console.log('Supabase login succeeded')

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
