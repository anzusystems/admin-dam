import { e2eEnvLabel, isLocalStack } from '@anzusystems/common-admin/e2e'
import { coreDamUrl } from '@pages/shared/urls'

/** Prefix for every spec describe title, e.g. "ADMIN-DAM (DEV) - Asset"; the env is E2E_ENV. */
export const ADMIN_SUITE = `ADMIN-DAM (${e2eEnvLabel()})`

/**
 * The local Docker stack (`E2E_ENV=local`). It has no external services: no JW Player site, no Cloudflare in front
 * of the image servers, and core-dam's default auth redirect points to the dev server, not the build the suite opens.
 */
export const IS_LOCAL = isLocalStack()

/** Why a spec that distributes to JW Player is skipped on the local stack (core-dam has no `DISTRIBUTION_JW_CMS_SITE_ID`). */
export const NO_JW_PLAYER_LOCALLY = 'the local core-dam has no JW Player site, a distribution there ends in "Chyba"'

/**
 * Why a spec that waits for a system job is skipped on the local stack: core-dam's jobs are run by cron, and its local
 * cron container installs no crontab unless `ENABLE_AUTOMATIC_CRON_STARTUP` is on.
 */
export const NO_JOB_RUNNER_LOCALLY = 'the local core-dam runs no jobs, its cron has no crontab'

/**
 * Keeps fixture names unique across runs and across parallel workers, which can boot in the same millisecond.
 * Flooring to 10ms and adding the worker slot (0-9) makes every slot land on its own final digit.
 */
export const RAND_NUM = (Math.floor(Date.now() / 10) * 10 + Number(process.env.TEST_PARALLEL_INDEX ?? 0)).toString()

/** Licence every test runs under — see `prepareUser`. */
export const LICENCE_ID = process.env.LICENCE_ID ?? ''

export const BASE_URL = process.env.BASE_URL ?? ''

export const CORE_DAM_API = `${coreDamUrl()}/api/adm/v1`

const ASSET_LIST_SEARCH = /^\/asset\/licence\/(?:(\d+)\/)?search(?:\?|$)/

/**
 * The asset list's search. develop and `next` name the licence in the path, `/asset/licence/<licence>/search?…`; the
 * mixed-licence listing of #86490 (on devel from a feature branch) asks `/asset/licence/search?licences=<licence>`.
 * With `licenceId`, that licence's only.
 */
export function isAssetListSearch(url: string, licenceId?: string): boolean {
  if (!url.startsWith(`${CORE_DAM_API}/`)) return false
  const match = ASSET_LIST_SEARCH.exec(url.slice(CORE_DAM_API.length))
  if (!match) return false
  const licence = match[1] ?? new URL(url).searchParams.get('licences')
  return licenceId === undefined || licence === licenceId
}

export const ALERT_CREATE = 'Záznam bol vytvorený'
export const ALERT_UPDATE = 'Záznam bol upravený'
export const ALERT_DELETE = 'Záznam bol odstránený'
export const ALERT_UPLOAD = 'Nahrávanie ukončené'
export const ALERT_SYSTEM_ERROR = 'Systémová chyba'
