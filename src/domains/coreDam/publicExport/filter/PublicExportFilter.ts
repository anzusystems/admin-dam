import { makeFilterHelper } from '@anzusystems/common-admin'
import { ENTITY } from '@/domains/coreDam/publicExport/api/publicExportApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  type: {
    ...makeFilter({ name: 'type' }),
  },
  slug: {
    ...makeFilter({ name: 'slug', variant: 'startsWith' }),
  },
})

export function usePublicExportListFilter() {
  return filter
}
