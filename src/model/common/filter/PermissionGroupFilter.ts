import { makeFilterHelper } from '@anzusystems/common-admin'
import { reactive } from 'vue'
import { ENTITY } from '@/services/api/common/permissionGroupApi'

const makeFilter = makeFilterHelper('common', ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id', default: null }),
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
