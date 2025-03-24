import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const ExportType = {
  Web: 'web',
  Mobile: 'mobile',
} as const

export const ExportTypeDefault = ExportType.Web
export type ExportTypeType = (typeof ExportType)[keyof typeof ExportType]

export function useExportTypeTypes() {
  const { t } = useI18n()

  const exportTypeOptions = ref<ValueObjectOption<ExportTypeType>[]>([
    {
      value: ExportType.Mobile,
      title: t('coreDam.publicExport.exportType.mobile'),
    },
    {
      value: ExportType.Web,
      title: t('coreDam.publicExport.exportType.web'),
    },
  ])

  const getExportTypeOption = (value: ExportTypeType) => {
    return exportTypeOptions.value.find((item) => item.value === value)
  }

  return {
    exportTypeOptions,
    getExportTypeOption,
  }
}
