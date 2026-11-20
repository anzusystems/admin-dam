import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const environment = process.env.ADAM_ENV || 'devel'
const envFile = path.resolve(__dirname, `.env.${environment}`)

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile, quiet: true })
} else {
  console.warn(`Environment file not found: .env.${environment}`)
  console.warn(`Create it by copying .env.dist and filling in credentials`)
}

// Every worker switches the licence of the account it runs as, so two workers sharing one account would
// flip each other's licence mid-test. Run in parallel only when there is an account per worker.
const userPool = (process.env.FORCE_LOGIN_USER_IDS ?? '').split(',').filter((id) => id.trim())

export default defineConfig({
  globalTimeout: 210 * 60 * 1000,
  timeout: 10 * 60 * 1000,
  expect: { timeout: 15000 },
  testDir: path.resolve(__dirname, 'tests'),
  testMatch: '**/*.spec.ts',
  workers: Math.max(1, Math.min(2, userPool.length)),
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { outputFolder: '.report', open: 'never' }]],
  globalSetup: path.resolve(__dirname, 'setup/globalSetup.ts'),
  use: {
    baseURL: process.env.BASE_URL,
    // Chromium pins every `*.localhost` host to 127.0.0.1 and ignores /etc/hosts, so inside a container
    // the local app is unreachable. HOST_RESOLVER_RULES remaps those hostnames (local env only).
    launchOptions: process.env.HOST_RESOLVER_RULES
      ? { args: [`--host-resolver-rules=${process.env.HOST_RESOLVER_RULES}`] }
      : {},
    headless: true,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15000,
  },
  outputDir: '.results',
})
