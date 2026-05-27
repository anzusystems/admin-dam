import { makeFilterHelper } from '@anzusystems/common-admin'
import { ENTITY } from '@/domains/common/permissionGroup/api/permissionGroupApi'

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
