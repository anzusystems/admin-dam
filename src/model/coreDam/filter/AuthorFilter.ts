import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/authorApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'

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
  identifier: {
    ...makeFilter({ name: 'identifier' }),
  },
  reviewed: {
    ...makeFilter({ name: 'reviewed' }),
  },
  type: {
    ...makeFilter({ name: 'type' }),
  },
})

export function useAuthorListFilter() {
  return filter
}

export function useAuthorFilter() {
  return reactive({
    _elastic: {
      ...makeFilter({ exclude: true }),
    },
    text: {
      ...makeFilter({ name: 'text' }),
    },
  })
}
