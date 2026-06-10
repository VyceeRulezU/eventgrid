import { defineConfig } from '@playwright/test'
import 'dotenv/config'
import { existsSync } from 'node:fs'

const authFile = 'playwright/.auth.json'
const hasCredentials = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD)

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  ...(hasCredentials && {
    globalSetup: './src/test/e2e/auth.setup.ts',
  }),
  use: {
    baseURL: process.env.E2E_APP_URL || 'http://localhost:4173',
    headless: true,
    ...(existsSync(authFile) && { storageState: authFile }),
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
})
