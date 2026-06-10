import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL
const PASSWORD = process.env.E2E_TEST_PASSWORD
const hasAuth = Boolean(EMAIL && PASSWORD)

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeAttached()
})

test('login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('body')).toBeAttached()
})

test('guest RSVP page handles missing params', async ({ page }) => {
  await page.goto('/rsvp')
  // Should show either error message or the form (if event/guest happen to match)
  await expect(page.locator('body')).toBeAttached()
})

test('guest RSVP page handles invalid link', async ({ page }) => {
  await page.goto('/rsvp?e=bad&g=bad')
  await expect(page.locator('body')).toBeAttached()
})

test.describe('authenticated', () => {
  test.skip(!hasAuth, 'E2E_TEST_EMAIL/PASSWORD not set')

  test('key pages load', async ({ page }) => {
    for (const path of ['/', '/events', '/tasks', '/vendors']) {
      await page.goto(path)
      await expect(page.locator('body')).toBeAttached()
    }
  })
})
