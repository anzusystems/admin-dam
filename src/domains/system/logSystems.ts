import { DEFAULT_LOG_PATHS } from '@anzusystems/common-admin'
import type { AxiosClientFn, LogPaths } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

/**
 * One backend, but the registry is still used: the guard reads
 * `authSystem`, the page reads `client`, `apiSystem` and `logPaths`.
 * Here `authSystem` and `apiSystem` differ.
 */
export interface LogSystemDescriptor {
  segment: string
  authSystem: string
  apiSystem: string
  client: AxiosClientFn
  logPaths: LogPaths
}

export const LOG_SYSTEM: LogSystemDescriptor = {
  segment: 'dam',
  authSystem: 'dam',
  apiSystem: 'coreDam',
  client: damClient,
  logPaths: DEFAULT_LOG_PATHS,
}
