import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsAudioApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  status: {
    ...makeFilter({ name: 'status', variant: 'in', titleT: 'coreDam.ttsAudio.filter.status' }),
  },
  voiceFamilySlug: {
    ...makeFilter({ name: 'voiceFamilySlug', titleT: 'coreDam.ttsAudio.filter.voiceFamilySlug' }),
  },
  startedAtFrom: {
    ...makeFilter({
      name: 'startedAtFrom',
      field: 'startedAt',
      variant: 'gte',
      titleT: 'coreDam.ttsAudio.filter.startedAtFrom',
    }),
  },
  startedAtUntil: {
    ...makeFilter({
      name: 'startedAtUntil',
      field: 'startedAt',
      variant: 'lte',
      titleT: 'coreDam.ttsAudio.filter.startedAtUntil',
    }),
  },
})

export function useTtsAudioListFilter() {
  return filter
}
