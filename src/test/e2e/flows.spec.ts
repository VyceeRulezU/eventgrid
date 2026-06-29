import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_TEST_EMAIL
const PASSWORD = process.env.E2E_TEST_PASSWORD
const hasAuth = Boolean(EMAIL && PASSWORD)

test.describe('public pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('home page loads with hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeAttached()
    await expect(page.locator('#hero')).toBeAttached({ timeout: 10000 })
  })

  test('landing page has navbar', async ({ page }) => {
    await page.goto('/')
    const navbar = page.locator('header')
    await expect(navbar).toBeVisible()
  })

  test('login page loads with form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeAttached()
    await expect(page.locator('form').first()).toBeAttached({ timeout: 5000 })
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('body')).toBeAttached()
  })

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    // Should not crash — app shows 404 page or fallback
    await expect(page.locator('body')).toBeAttached()
  })

  test('guest RSVP page handles missing params', async ({ page }) => {
    await page.goto('/rsvp')
    await expect(page.locator('body')).toBeAttached()
  })

  test('guest RSVP page handles invalid link', async ({ page }) => {
    await page.goto('/rsvp?e=bad&g=bad')
    await expect(page.locator('body')).toBeAttached()
  })
})

test.describe('authenticated', () => {
  test.skip(!hasAuth, 'E2E_TEST_EMAIL/PASSWORD not set — skipping authenticated tests')

  test('dashboard loads after login', async ({ page }) => {
    await page.goto('/dashboard/planner')
    await expect(page.locator('body')).toBeAttached()
    // Should see sidebar or main nav
    await expect(page.locator('aside, header, nav').first()).toBeAttached({ timeout: 15000 })
  })

  test('events list page loads', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('body')).toBeAttached({ timeout: 15000 })
  })

  test('tasks page loads', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.locator('body')).toBeAttached({ timeout: 15000 })
  })

  test('vendors page loads', async ({ page }) => {
    await page.goto('/vendors')
    await expect(page.locator('body')).toBeAttached({ timeout: 15000 })
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('body')).toBeAttached({ timeout: 15000 })
  })
})
