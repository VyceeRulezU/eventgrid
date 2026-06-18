import 'dotenv/config'
import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'

const authFile = 'playwright/.auth.json'

setup('authenticate', async ({ page, baseURL }) => {
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
  })
  page.on('pageerror', err => {
    console.error('[Browser Page Error]', err.message)
  })

  const email = process.env.E2E_TEST_EMAIL?.trim()
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

  // Ensure user and profile exist with onboarding completed
  try {
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) throw listError

    let existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!existingUser) {
      console.log(`Provisioning new E2E test user: ${email}`)
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: process.env.E2E_TEST_PASSWORD || 'Password123!',
        email_confirm: true,
        user_metadata: {
          role: 'planner',
          display_name: 'E2E Test User',
          onboarding_completed: true,
        }
      })
      if (createError) throw createError
      existingUser = newUser.user
    } else {
      const needsUpdate = !existingUser.user_metadata?.onboarding_completed || existingUser.user_metadata?.role !== 'planner'
      if (needsUpdate) {
        console.log(`Updating E2E test user metadata: ${email}`)
        const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...existingUser.user_metadata,
            role: 'planner',
            onboarding_completed: true,
          }
        })
        if (updateError) console.error('Failed to update user metadata:', updateError)
      }
    }

    if (existingUser) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single()

      if (!profile) {
        console.log(`Creating E2E test user profile: ${email}`)
        const { error: insertError } = await adminClient
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email,
            display_name: existingUser.user_metadata?.display_name || 'E2E Test User',
            role: 'planner',
            is_active: true,
          })
        if (insertError) console.error('Failed to upsert profile:', insertError)
      }
    }
  } catch (provisionError) {
    console.error('Warning: Error provisioning test user:', provisionError)
  }

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

  const finalUrl = page.url()
  console.log('appUrl:', appUrl)
  console.log('finalUrl:', finalUrl)

  // If redirected to production site instead of local appUrl due to Supabase redirect restrictions
  if (!finalUrl.includes(appUrl) && finalUrl.includes('#access_token=')) {
    const hash = finalUrl.split('#')[1]
    console.log('Copying auth hash to local dev URL...')
    await page.goto(appUrl + '/#' + hash, { waitUntil: 'load' })
  }

  // Ensure the authentication state is fully loaded and processed locally
  await page.waitForSelector('header', { state: 'visible', timeout: 15000 })

  fs.mkdirSync('playwright', { recursive: true })
  await page.context().storageState({ path: authFile })
  console.log('Auth setup complete')
})
