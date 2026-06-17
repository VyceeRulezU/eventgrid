import 'dotenv/config'
import { test as setup } from '@playwright/test'
import * as fs from 'node:fs'

const authFile = 'playwright/.auth.json'

setup('authenticate', async ({ page, baseURL }) => {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    console.log('E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping auth setup')
    // Write an empty storage state so dependent projects don't fail
    fs.mkdirSync('playwright', { recursive: true })
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  const appUrl = baseURL || process.env.E2E_APP_URL || 'http://localhost:4173'

  await page.goto(appUrl + '/login', { waitUntil: 'networkidle' })
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

  console.log('Post-login URL:', page.url())

  fs.mkdirSync('playwright', { recursive: true })
  await page.context().storageState({ path: authFile })
  console.log('Auth setup complete')
})
