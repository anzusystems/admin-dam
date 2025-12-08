import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const DeviceType = {
  All: 'all',
  Ios: 'ios',
  Android: 'android',
} as const

export const DeviceTypeDefault = DeviceType.All
export type DeviceTypeType = (typeof DeviceType)[keyof typeof DeviceType]

export function useDeviceTypeTypes() {
  const { t } = useI18n()

  const deviceTypeOptions = ref<ValueObjectOption<DeviceTypeType>[]>([
    {
      value: DeviceType.All,
      title: t('coreDam.publicExport.deviceType.all'),
    },
    {
      value: DeviceType.Ios,
      title: t('coreDam.publicExport.deviceType.ios'),
    },
    {
      value: DeviceType.Android,
      title: t('coreDam.publicExport.deviceType.android'),
    },
  ])

  const getDeviceTypeOption = (value: DeviceTypeType) => {
    return deviceTypeOptions.value.find((item) => item.value === value)
  }

  return {
    deviceTypeOptions,
    getDeviceTypeOption,
  }
}
