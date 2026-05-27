import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  name: {
    ...makeFilter({ name: 'name', variant: 'startsWith' }),
  },
  slug: {
    ...makeFilter({ name: 'slug', variant: 'startsWith' }),
  },
})

export function useExtSystemListFilter() {
  return filter
}

export function useExtSystemFilter() {
  return reactive({
    name: {
      ...makeFilter({ name: 'name', variant: 'startsWith' }),
    },
  })
}
