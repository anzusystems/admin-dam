import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'
import { Grant } from '@/types/Permission'

export function usePermissionGrant() {
  const { t } = useI18n({ useScope: 'global' })

  const permissionGrantOptions = ref<ValueObjectOption<Grant>[]>([
    {
      value: Grant.NotSet,
      title: t('coreDam.permission.grant.notSet'),
    },
    {
      value: Grant.Deny,
      title: t('coreDam.permission.grant.deny'),
      color: 'error',
      icon: 'mdi-close-thick',
    },
    {
      value: Grant.AllowOwner,
      title: t('coreDam.permission.grant.allowOwner'),
    },
    {
      value: Grant.Allow,
      title: t('coreDam.permission.grant.allow'),
      color: 'success',
      icon: 'mdi-check-bold',
    },
  ])

  const getPermissionGrantOption = (value: Grant) => {
    return permissionGrantOptions.value.find((item) => item.value === value)
  }

  return {
    permissionGrantOptions,
    getPermissionGrantOption,
  }
}
