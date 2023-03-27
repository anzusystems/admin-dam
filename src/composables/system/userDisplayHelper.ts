import { isUndefined } from '@anzusystems/common-admin'
import type { UserMinimal } from '@/types/coreDam/User'

export function useUserDisplayHelper() {
  const getUsername = (user?: UserMinimal) => {
    if (isUndefined(user)) return ''
    if (user.person.fullName.length) return user.person.fullName
    if (user.person.firstName || user.person.lastName) return user.person.firstName + ' ' + user.person.lastName
    return user.email.split('@')[0]
  }

  return {
    getUsername,
  }
}
