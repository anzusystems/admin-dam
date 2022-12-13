import { LogLevel } from '@/model/common/valueObject/LogLevel'
import type { Log } from '@/types/common/Log'

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
