import { ref } from 'vue'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const LogSystem = {
  CoreDam: 'coreDam',
  AdminDam: 'adminDam',
} as const

export type LogSystemType = (typeof LogSystem)[keyof typeof LogSystem]
export const LogSystemDefault = LogSystem.CoreDam

export function useLogSystem() {
  const logSystemOptions = ref<ValueObjectOption<LogSystemType>[]>([
    {
      value: LogSystem.CoreDam,
      title: LogSystem.CoreDam,
    },
    {
      value: LogSystem.AdminDam,
      title: LogSystem.AdminDam,
    },
  ])

  const getLogSystemOption = (value: LogSystemType) => {
    return logSystemOptions.value.find((item) => item.value === value)
  }

  return {
    logSystemOptions,
    getLogSystemOption,
  }
}
