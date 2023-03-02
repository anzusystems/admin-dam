import { ref } from 'vue'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export enum LogSystem {
  CoreDam = 'coreDam',
  AdminDam = 'adminDam',
  Default = CoreDam,
}

export function useLogSystem() {
  const logSystemOptions = ref<ValueObjectOption<LogSystem>[]>([
    {
      value: LogSystem.CoreDam,
      title: LogSystem.CoreDam,
    },
    {
      value: LogSystem.AdminDam,
      title: LogSystem.AdminDam,
    },
  ])

  const getLogSystemOption = (value: LogSystem) => {
    return logSystemOptions.value.find((item) => item.value === value)
  }

  return {
    logSystemOptions,
    getLogSystemOption,
  }
}
