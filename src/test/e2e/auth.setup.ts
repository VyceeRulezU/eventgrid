import 'dotenv/config'
import { chromium, type Page, type FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TURNSTILE_SITE_KEY = '0x4AAAAAADlDWkKAkkc1Zy9n'

async function getTurnstileToken(page: Page): Promise<string> {
  const html = `<!DOCTYPE html><html><head>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head><body>
<div id="captcha"></div>
<script>
window.onloadTurnstileCallback = function () {
  turnstile.render('#captcha', {
    sitekey: '${TURNSTILE_SITE_KEY}',
    callback: function(token) { window.captchaToken = token; },
  });
};
</script>
</body></html>`

  await page.goto('data:text/html,' + encodeURIComponent(html), { waitUntil: 'networkidle' })
  await page.waitForFunction(() => (window as any).captchaToken, { timeout: 30000 })
  return await page.evaluate(() => (window as any).captchaToken)
}

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

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    const captchaToken = await getTurnstileToken(page)
    console.log('Got Turnstile token')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    })

    if (error || !data.session) {
      console.error('Supabase login failed:', error?.message || 'No session returned')
      throw new Error(`Supabase login failed: ${error?.message || 'No session returned'}`)
    }

    console.log('Supabase login succeeded, setting up browser session...')

    await page.goto(appUrl, { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ({ key, session }: { key: string; session: string }) => {
        localStorage.setItem(key, session)
      },
      { key: `sb-${projectRef}-auth-token`, session: JSON.stringify(data.session) }
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
