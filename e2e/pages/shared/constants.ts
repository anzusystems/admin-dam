/** staging | devel | local — set by bin/test and the test:run:* scripts. */
const ADAM_ENV = process.env.ADAM_ENV ?? 'devel'

const ENV_LABEL: Record<string, string> = {
  staging: 'STG',
  devel: 'DEV',
  local: 'LOCAL',
}

/** Prefix for every spec describe title, e.g. "ADMIN-DAM (DEV) - Author". */
export const ADMIN_SUITE = `ADMIN-DAM (${ENV_LABEL[ADAM_ENV] ?? ADAM_ENV.toUpperCase()})`

/**
 * Suffix that keeps fixture names unique across runs — and across parallel workers, which can boot
 * inside the same millisecond. Flooring to 10ms and adding the worker slot (0-9) makes every slot
 * land on its own final digit.
 */
export const RAND_NUM = (Math.floor(Date.now() / 10) * 10 + Number(process.env.TEST_PARALLEL_INDEX ?? 0)).toString()

/** Licence every test runs under — see `prepareUser`. */
export const LICENCE_ID = process.env.LICENCE_ID ?? ''

export const BASE_URL = process.env.BASE_URL ?? ''
export const URL_PROTO = process.env.URL_PROTO ?? 'https'
export const URL_DOMAIN = process.env.URL_DOMAIN ?? ''

/** `https://core-dam.<domain>/api/adm/v1` */
export const CORE_DAM_API = `${URL_PROTO}://core-dam.${URL_DOMAIN}/api/adm/v1`

export const ALERT_CREATE = 'Záznam bol vytvorený'
export const ALERT_UPDATE = 'Záznam bol upravený'
export const ALERT_DELETE = 'Záznam bol odstránený'
export const ALERT_UPLOAD = 'Nahrávanie ukončené'
export const ALERT_SYSTEM_ERROR = 'Systémová chyba'
