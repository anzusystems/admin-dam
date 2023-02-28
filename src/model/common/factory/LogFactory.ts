import type { Log } from '@anzusystems/common-admin'
import { LogLevel } from '@anzusystems/common-admin'

export function useLogFactory() {
  const createDefault = (): Log => {
    return {
      id: '',
      message: '',
      datetime: '',
      levelName: LogLevel.Default,
      context: {
        appVersion: '',
        appSystem: '',
        requestOriginAppVersion: '',
        path: '',
        method: '',
        contextId: '',
        userId: null,
        ip: '',
        response: '',
        content: '',
        params: '',
        httpStatus: 0,
      },
      _resourceName: '',
      _system: '',
      _type: '',
    }
  }

  return {
    createDefault,
  }
}
