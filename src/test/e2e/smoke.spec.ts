import { test, expect } from '@playwright/test'

test('app loads without crash', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeAttached()
})

test('page has a title', async ({ page }) => {
  await page.goto('/')
  const title = await page.title()
  expect(title).toBeTruthy()
})
