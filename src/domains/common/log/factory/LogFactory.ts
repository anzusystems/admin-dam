import type { Log } from '@anzusystems/common-admin'
import { LogLevelDefault } from '@anzusystems/common-admin'

export function useLogFactory() {
  const createDefault = (): Log => {
    return {
      id: '',
      message: '',
      datetime: '',
      levelName: LogLevelDefault,
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
        resourceName: '',
        resourceIds: [],
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
