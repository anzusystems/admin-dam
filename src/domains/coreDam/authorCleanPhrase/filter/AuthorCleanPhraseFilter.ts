import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/authorCleanPhrase/api/AuthorCleanPhraseApi'

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
