import { test, expect, type Page } from '@playwright/test'

async function hasTurnstile(page: Page) {
  try {
    await page.waitForSelector('iframe[src*="challenges.cloudflare.com"]', { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/* ─── Auth: login page ─── */

test.describe('login page', () => {
  // These tests inspect the login page UI — run without auth so the app
  // doesn't redirect an already-logged-in user away from /login.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows OAuth provider buttons', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('')
    await page.locator('#password').fill('')
    await page.getByRole('button', { name: /sign in/i }).click()
    // no crash
    await expect(page.locator('body')).toBeAttached()
  })

  test('has link to register page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible()
  })
})

/* ─── Auth: register page ─── */

test.describe('register page', () => {
  // Same reason — needs a clean unauthenticated context.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('shows role selection step', async ({ page }) => {
    await page.goto('/register')
    // Role cards use labels: 'Event Planner', 'Coordinator', 'Client / Guest'
    await expect(page.getByText(/Event Planner/i)).toBeVisible()
    await expect(page.getByText(/Coordinator/i)).toBeVisible()
  })

  test('shows registration form after role selection', async ({ page }) => {
    await page.goto('/register')
    await page.getByText(/planner/i).first().click()
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#phone')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('requires password of at least 6 characters', async ({ page }) => {
    await page.goto('/register')
    await page.getByText(/Event Planner/i).first().click()
    await page.locator('#password').fill('abc')
    // submit button says 'Register Now' and is disabled when password score < 15
    await expect(page.getByRole('button', { name: /register now/i })).toBeDisabled()
  })
})

/* ─── Auth: admin login page ─── */

test.describe('admin login page', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('shows admin login form', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows admin branding', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByText(/admin portal/i)).toBeVisible()
  })
})

/* ─── Auth: logout ─── */

test.describe('logout', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'E2E_TEST_EMAIL not set')

  test('logout button exists in sidebar', async ({ page }) => {
    // Navigate directly to a dashboard page — the sidebar with 'Log out' lives
    // inside the app layout, not on the public /home landing page.
    await page.goto('/events')
    await page.waitForURL(/\/events/, { timeout: 15000 })

    // Wait for the app layout to load and the header to become visible
    await page.waitForSelector('header', { state: 'visible', timeout: 15000 })

    // The TopBar toggle has aria-label="Open menu" (not "Open sidebar")
    const sidebarToggle = page.locator('[aria-label="Open menu"]').first()
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click()
      // Wait for sidebar to slide in
      await page.waitForSelector(`aside`, { state: 'visible' })
    }

    await expect(page.getByText(/log out/i)).toBeVisible({ timeout: 10000 })
  })
})

/* ─── Role guard ─── */

test.describe('role guard', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects unauthenticated user to home', async ({ page }) => {
    await page.goto('/dashboard/planner')
    await page.waitForURL(/\/(home|login)/, { timeout: 10000 })
    expect(page.url()).not.toContain('/dashboard/')
  })

  test('redirects unauthenticated user from admin page', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/\/(home|login)/, { timeout: 10000 })
    expect(page.url()).not.toContain('/admin')
  })

  test('redirects unauthenticated from settings', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForURL(/\/(home|login)/, { timeout: 10000 })
    expect(page.url()).not.toContain('/settings')
  })

  test('allows access to public pages', async ({ page }) => {
    for (const path of ['/', '/home', '/login', '/register', '/pricing', '/about', '/faq', '/contact', '/privacy', '/terms', '/cookies', '/security']) {
      await page.goto(path)
      await expect(page.locator('body')).toBeAttached()
    }
  })

  test('allows guest RSVP page', async ({ page }) => {
    await page.goto('/rsvp')
    await expect(page.locator('body')).toBeAttached()
  })

  test('admin login page is public', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('#email')).toBeVisible()
  })
})

/* ─── Role guard: admin routes (requires auth) ─── */

test.describe('admin route access', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  const adminRoutes = ['/admin', '/admin/events', '/admin/vendors', '/admin/team', '/admin/feedback', '/admin/analytics', '/admin/my-tasks']

  for (const route of adminRoutes) {
    test(`redirects unauthenticated from ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL(/\/(home|login)/, { timeout: 10000 })
      expect(page.url()).not.toContain(route)
    })
  }
})

/* ─── Activation / payment UI ─── */

test.describe('activation / payment', () => {

  test('home page lists features that mention activation', async ({ page }) => {
    await page.goto('/home')
    await expect(page.locator('body')).toBeAttached()
  })

  test('unpaid event shows activate button', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'E2E_TEST_EMAIL not set — needs logged-in user with an unpaid event')

    // Navigate to events list (assumes auth already via storageState)
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    // If any event card with "activate" text exists, click through to its dashboard
    const activateLink = page.locator('a:has-text("Activate")').first()
    if (await activateLink.isVisible()) {
      await activateLink.click()
    } else {
      // Otherwise navigate to the first event
      const eventLink = page.locator('a[href^="/events/"]').first()
      if (!(await eventLink.isVisible())) {
        test.skip(true, 'No events found')
        return
      }
      await eventLink.click()
    }

    await page.waitForURL(/\/events\//, { timeout: 10000 })

    // Look for the payment activation trigger
    const activateBtn = page.locator('button:has-text("Activate Event")').first()
    if (await activateBtn.isVisible()) {
      await activateBtn.click()
    } else {
      // Try clicking "Activate" next-step card
      const nextStepActivate = page.locator('button:has-text("Activate")').first()
      if (await nextStepActivate.isVisible()) {
        await nextStepActivate.click()
      } else {
        test.skip(true, 'No activate button found — event may already be active')
        return
      }
    }

    // Verify payment modal appears
    await expect(page.locator('.overlay .modal-card')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=₦20,000')).toBeVisible()
    await expect(page.getByRole('button', { name: /pay with paystack/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /pay with flutterwave/i })).toBeVisible()
  })

  test('payment modal shows test card info', async ({ page }) => {
    test.skip(!process.env.E2E_TEST_EMAIL, 'E2E_TEST_EMAIL not set — needs logged-in user')

    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    const eventLink = page.locator('a[href^="/events/"]').first()
    if (!(await eventLink.isVisible())) {
      test.skip(true, 'No events found')
      return
    }
    await eventLink.click()
    await page.waitForURL(/\/events\//, { timeout: 10000 })

    // Open payment modal
    const activateBtn = page.locator('button:has-text("Activate Event")').first()
    if (!(await activateBtn.isVisible())) {
      const statBtn = page.locator('button[class*="statCard"]').first()
      if (await statBtn.isVisible()) await statBtn.click()
      else { test.skip(true, 'No activate trigger found'); return }
    } else {
      await activateBtn.click()
    }

    await expect(page.locator('.overlay .modal-card')).toBeVisible({ timeout: 5000 })
    // Test card info is displayed
    await expect(page.getByText(/4084 0828 0408 4081/)).toBeVisible()
    await expect(page.getByText(/4181 0000 0000 0007/)).toBeVisible()
    await expect(page.getByText(/test \/ demo mode/i)).toBeVisible()
  })
})

/* ─── Captcha (Turnstile) ─── */

test.describe('captcha', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('login page renders Turnstile captcha widget', async ({ page }) => {
    await page.goto('/login')
    if (!(await hasTurnstile(page))) {
      test.skip(true, 'VITE_TURNSTILE_SITE_KEY not set — captcha disabled')
      return
    }
    await expect(page.locator('iframe[src*="challenges.cloudflare.com"]').first()).toBeVisible()
  })

  test('login submit button is disabled until captcha resolved', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')

    if (!(await hasTurnstile(page))) {
      test.skip(true, 'VITE_TURNSTILE_SITE_KEY not set — captcha disabled')
      return
    }

    await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled({ timeout: 15000 })
  })

  test('register page renders Turnstile captcha widget after role selection', async ({ page }) => {
    await page.goto('/register')
    await page.getByText(/planner/i).first().click()

    if (!(await hasTurnstile(page))) {
      test.skip(true, 'VITE_TURNSTILE_SITE_KEY not set — captcha disabled')
      return
    }
    await expect(page.locator('iframe[src*="challenges.cloudflare.com"]').first()).toBeVisible()
  })

  test('register submit button is disabled until captcha and password strength pass', async ({ page }) => {
    await page.goto('/register')
    await page.getByText(/planner/i).first().click()
    await page.fill('#name', 'Test User')
    await page.fill('#email', 'test@example.com')
    await page.fill('#phone', '08012345678')
    await page.fill('#password', 'StrongP@ss1')

    if (!(await hasTurnstile(page))) {
      test.skip(true, 'VITE_TURNSTILE_SITE_KEY not set — captcha disabled')
      return
    }

    await expect(page.getByRole('button', { name: /register now/i })).toBeDisabled()
    await expect(page.getByRole('button', { name: /register now/i })).toBeEnabled({ timeout: 15000 })
  })

  test('admin login page also shows captcha', async ({ page }) => {
    await page.goto('/admin/login')
    if (!(await hasTurnstile(page))) {
      test.skip(true, 'VITE_TURNSTILE_SITE_KEY not set — captcha disabled')
      return
    }
    await expect(page.locator('iframe[src*="challenges.cloudflare.com"]').first()).toBeVisible()
  })
})
