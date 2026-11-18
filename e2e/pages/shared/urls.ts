/**
 * Roots of the services the suite calls besides the admin itself (that one is `BASE_URL`).
 *
 * Each comes from its own env var, so a stack whose hostnames are not `<service>.<URL_DOMAIN>` (the numbered
 * local ones, `core-dam1.sme.local`) can say where the service is. Unset, the root is derived from
 * `URL_PROTO` and `URL_DOMAIN`, which is what devel and staging use.
 */
function serviceUrl(envName: string, host: string): string {
  const explicit = process.env[envName]
  if (explicit) return explicit.replace(/\/+$/, '')

  return `${process.env.URL_PROTO ?? 'https'}://${host}.${process.env.URL_DOMAIN ?? ''}`
}

/** core-dam, without `/api`. */
export function coreDamUrl(): string {
  return serviceUrl('CORE_DAM_URL', 'core-dam')
}

/** admin-cms, for the DAM-to-CMS integration specs. */
export function adminCmsUrl(): string {
  return serviceUrl('ADMIN_CMS_URL', 'admin-cms')
}

/** core-cms, without `/api`. */
export function coreCmsUrl(): string {
  return serviceUrl('CORE_CMS_URL', 'core-cms')
}

/** The public web (`www`). */
export function webUrl(): string {
  return serviceUrl('WEB_URL', 'www')
}
