import { defineConfig } from '@playwright/test'
import 'dotenv/config'
import { existsSync } from 'node:fs'

const authFile = 'playwright/.auth.json'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_APP_URL || 'http://localhost:4173',
    headless: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 60000,
    },
    {
      name: 'chromium',
      use: {
        ...(existsSync(authFile) && { storageState: authFile }),
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
})
