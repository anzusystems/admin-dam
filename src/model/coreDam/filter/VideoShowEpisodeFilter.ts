import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/videoShowEpisodeApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  title: {
    ...makeFilter({ name: 'title', field: 'texts.title', variant: 'startsWith' }),
  },
  webPublicExportEnabled: {
    ...makeFilter({ name: 'webPublicExportEnabled', field: 'flags.webPublicExportEnabled' }),
  },
  mobilePublicExportEnabled: {
    ...makeFilter({ name: 'mobilePublicExportEnabled', field: 'flags.mobilePublicExportEnabled' }),
  },
})

export function useVideoShowEpisodeListFilter() {
  return filter
}
