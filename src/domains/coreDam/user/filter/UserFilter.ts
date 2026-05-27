import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/user/api/userApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  email: {
    ...makeFilter({ name: 'email', variant: 'startsWith' }),
  },
})

export function useUserListFilter() {
  return filter
}

export function useUserFilter() {
  return reactive({
    email: {
      ...makeFilter({ name: 'email', variant: 'startsWith' }),
    },
  })
}
