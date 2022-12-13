import { ref } from 'vue'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum LogType {
  App = 'app',
  Audit = 'audit',
  Default = App,
}

export function useLogType() {
  const logTypeOptions = ref<ValueObjectOption<LogType>[]>([
    {
      value: LogType.App,
      title: LogType.App,
    },
    {
      value: LogType.Audit,
      title: LogType.Audit,
    },
  ])

  const getLogTypeOption = (value: LogType) => {
    return logTypeOptions.value.find((item) => item.value === value)
  }

  return {
    logTypeOptions,
    getLogTypeOption,
  }
}
