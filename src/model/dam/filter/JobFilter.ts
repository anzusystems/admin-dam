import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { SYSTEM_CORE_DAM } from '@/model/systems'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, 'job')

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  status: {
    ...makeFilter({ name: 'status', variant: 'in' }),
  },
  startedAtFrom: {
    ...makeFilter({ name: 'startedAtFrom', field: 'startedAt', variant: 'gte' }),
  },
  startedAtUntil: {
    ...makeFilter({ name: 'startedAtUntil', field: 'startedAt', variant: 'lte' }),
  },
})

export function useJobListFilter() {
  return filter
}
