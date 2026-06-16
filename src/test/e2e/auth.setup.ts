import 'dotenv/config'
import { chromium, type FullConfig } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD
  const appUrl = process.env.E2E_APP_URL || 'http://localhost:4173'

  if (!email || !password) {
    console.log('E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping auth setup')
    return
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(appUrl + '/login', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 })
    } catch {
      await page.screenshot({ path: 'playwright/login-failed.png', fullPage: true })
      const title = await page.title()
      const html = await page.content()
      console.error('Still on /login. Title:', title)
      console.error('HTML:', html.substring(0, 2000))
      throw new Error('Login failed — page did not navigate away from /login')
    }

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
