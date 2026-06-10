import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL
const PASSWORD = process.env.E2E_TEST_PASSWORD
const hasAuth = Boolean(EMAIL && PASSWORD)

test('login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('#email')).toBeAttached()
})

test('guest RSVP page shows error for missing params', async ({ page }) => {
  await page.goto('/rsvp')
  await expect(page.getByText('Invitation not found')).toBeVisible()
})

test('guest RSVP page shows error for invalid link', async ({ page }) => {
  await page.goto('/rsvp?e=bad&g=bad')
  await expect(page.getByText('Invitation not found')).toBeVisible()
})

test.describe('authenticated', () => {
  test.skip(!hasAuth, 'credentials not configured')

  test('key pages load', async ({ page }) => {
    for (const path of ['/', '/events', '/tasks', '/vendors']) {
      await page.goto(path)
      await page.waitForSelector('body', { timeout: 15000 })
    }
  })
})
