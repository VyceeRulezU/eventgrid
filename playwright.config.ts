import { defineConfig } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './src/test/e2e/auth.setup.ts',
  use: {
    baseURL: process.env.E2E_APP_URL || 'http://localhost:4173',
    headless: true,
    storageState: 'playwright/.auth.json',
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
})
