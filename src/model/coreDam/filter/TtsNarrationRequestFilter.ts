import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  status: {
    ...makeFilter({ name: 'status', variant: 'in', titleT: 'coreDam.ttsNarrationRequest.filter.status' }),
  },
  voiceFamilySlug: {
    ...makeFilter({ name: 'voiceFamilySlug', titleT: 'coreDam.ttsNarrationRequest.filter.voiceFamilySlug' }),
  },
})

export function useTtsNarrationRequestListFilter() {
  return filter
}
