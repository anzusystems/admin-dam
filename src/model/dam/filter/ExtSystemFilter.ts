import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/extSystemApi'

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
