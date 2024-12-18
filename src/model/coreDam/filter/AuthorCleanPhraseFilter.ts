import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  phrase: {
    ...makeFilter({ name: 'phrase' }),
  },
  mode: {
    ...makeFilter({ name: 'mode' }),
  },
  type: {
    ...makeFilter({ name: 'type' }),
  },
})

export function useAuthorCleanPhraseListFilter() {
  return filter
}
