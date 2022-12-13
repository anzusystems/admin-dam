import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum UserRole {
  Admin = 'ROLE_ADMIN',
  User = 'ROLE_USER',
  Default = User,
}

export function useUserRole() {
  const { t } = useI18n({ useScope: 'global' })

  const userRoleOptions = ref<ValueObjectOption<UserRole>[]>([
    {
      value: UserRole.Admin,
      title: t('coreDam.user.role.admin'),
    },
    {
      value: UserRole.User,
      title: t('coreDam.user.role.user'),
    },
  ])

  const getUserRoleOption = (value: UserRole) => {
    return userRoleOptions.value.find((item) => item.value === value)
  }

  return {
    userRoleOptions,
    getUserRoleOption,
  }
}
