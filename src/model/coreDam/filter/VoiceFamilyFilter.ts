import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/voiceFamilyApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  displayName: {
    ...makeFilter({ name: 'displayName', variant: 'startsWith' }),
  },
  language: {
    ...makeFilter({ name: 'language' }),
  },
  active: {
    ...makeFilter({ name: 'active' }),
  },
})

export function useVoiceFamilyListFilter() {
  return filter
}

export function useVoiceFamilyFilter() {
  return reactive({
    displayName: {
      ...makeFilter({ name: 'displayName', variant: 'startsWith' }),
    },
  })
}
