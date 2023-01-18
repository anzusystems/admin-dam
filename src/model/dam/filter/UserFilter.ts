import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/userApi'

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
