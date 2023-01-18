import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/permissionGroupApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  title: {
    ...makeFilter({ name: 'title' }),
  },
})

export function usePermissionGroupListFilter() {
  return filter
}

export function usePermissionGroupFilter() {
  return reactive({
    title: {
      ...makeFilter({ name: 'title', variant: 'startsWith' }),
    },
  })
}
