import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/keywordApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  _elastic: {
    ...makeFilter({ exclude: true }),
  },
  id: {
    ...makeFilter({ name: 'id' }),
  },
  text: {
    ...makeFilter({ name: 'text' }),
  },
  reviewed: {
    ...makeFilter({ name: 'reviewed' }),
  },
})

export function useKeywordFilter() {
  return filter
}
