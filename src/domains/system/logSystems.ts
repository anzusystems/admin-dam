import { DEFAULT_LOG_PATHS, type AxiosClientFn, type LogPaths } from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'

/**
 * One backend, so one entry -- but the registry exists anyway. The guard reads `authSystem` from
 * it and the page reads `client`, `apiSystem` and `logPaths`, which keeps the three identities in
 * one place instead of spread across two files. Here `authSystem` and `apiSystem` differ.
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
