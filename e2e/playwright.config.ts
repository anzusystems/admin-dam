import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { adminCmsUrl } from './pages/shared/urls'

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

// A local stack serves the admins over plain http, where the browser withholds what needs a secure context: the
// clipboard (without it the copy-id buttons and menu items are not rendered) and `crypto.randomUUID`. Deployed, they
// are served over https. admin-cms is opened by the integration specs.
const insecureOrigins = [process.env.BASE_URL, adminCmsUrl()]
  .filter((url): url is string => !!url && url.startsWith('http:'))
  .map((url) => new URL(url).origin)
const secureContextArgs = insecureOrigins.length
  ? [`--unsafely-treat-insecure-origin-as-secure=${insecureOrigins.join(',')}`]
  : []

export default defineConfig({
  globalTimeout: 210 * 60 * 1000,
  timeout: 10 * 60 * 1000,
  expect: { timeout: 15000 },
  testDir: path.resolve(__dirname, 'tests'),
  testMatch: '**/*.spec.ts',
  // The route walk runs on its own: playwright.routes.config.ts, `bin/test --routes`.
  testIgnore: '**/tests/routes/**',
  workers: Math.max(1, Math.min(2, userPool.length)),
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { outputFolder: '.report', open: 'never' }]],
  globalSetup: path.resolve(__dirname, 'setup/globalSetup.ts'),
  use: {
    baseURL: process.env.BASE_URL,
    // The headless shell Playwright uses by default ignores the secure-context flag; full Chromium in headless
    // mode honours it.
    ...(secureContextArgs.length ? { channel: 'chromium' } : {}),
    launchOptions: {
      args: [
        // Chromium pins every `*.localhost` host to 127.0.0.1 and ignores /etc/hosts, so inside a container
        // the local app is unreachable. HOST_RESOLVER_RULES remaps those hostnames (local env only).
        ...(process.env.HOST_RESOLVER_RULES ? [`--host-resolver-rules=${process.env.HOST_RESOLVER_RULES}`] : []),
        ...secureContextArgs,
      ],
    },
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
