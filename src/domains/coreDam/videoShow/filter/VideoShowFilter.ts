import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/videoShow/api/videoShowApi'

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

export function useVideoShowListFilter() {
  return filter
}

export function useVideoShowFilter() {
  return reactive({
    title: {
      ...makeFilter({ name: 'title', field: 'texts.title', variant: 'startsWith' }),
    },
  })
}
