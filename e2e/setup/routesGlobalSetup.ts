/**
 * The route walk's setup: the variables it needs, nothing else. The default run's setup also requires the licence
 * and downloads the media fixtures, which a walk that only opens pages does not use.
 */
export default async function routesGlobalSetup(): Promise<void> {
  const missing = ['BASE_URL', 'FORCE_LOGIN_URL', 'ADMIN_USER_ID'].filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nCopy .env.dist to .env.${process.env.E2E_ENV} and fill in all values.`
    )
  }
}
