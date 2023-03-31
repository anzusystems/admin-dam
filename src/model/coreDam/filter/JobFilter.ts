import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, 'job')

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id', titleT: 'common.job.filter.id' }),
  },
  status: {
    ...makeFilter({ name: 'status', variant: 'in', titleT: 'common.job.filter.status' }),
  },
  startedAtFrom: {
    ...makeFilter({
      name: 'startedAtFrom',
      field: 'startedAt',
      variant: 'gte',
      titleT: 'common.job.filter.startedAtFrom',
    }),
  },
  startedAtUntil: {
    ...makeFilter({
      name: 'startedAtUntil',
      field: 'startedAt',
      variant: 'lte',
      titleT: 'common.job.filter.startedAtUntil',
    }),
  },
})

export function useJobListFilter() {
  return filter
}
