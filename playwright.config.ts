import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
  },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
})
