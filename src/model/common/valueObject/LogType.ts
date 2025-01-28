import { ref } from 'vue'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const LogType = {
  App: 'app',
  Audit: 'audit',
} as const

export type LogTypeType = (typeof LogType)[keyof typeof LogType]
export const LogTypeDefault = LogType.App

export function useLogType() {
  const logTypeOptions = ref<ValueObjectOption<LogTypeType>[]>([
    {
      value: LogType.App,
      title: LogType.App,
    },
    {
      value: LogType.Audit,
      title: LogType.Audit,
    },
  ])

  const getLogTypeOption = (value: LogTypeType) => {
    return logTypeOptions.value.find((item) => item.value === value)
  }

  return {
    logTypeOptions,
    getLogTypeOption,
  }
}
