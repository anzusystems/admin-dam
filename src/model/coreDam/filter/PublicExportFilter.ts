import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/publicExportApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  type: {
    ...makeFilter({ name: 'type' }),
  },
  slug: {
    ...makeFilter({ name: 'slug' }),
  },
})

export function usePublicExportListFilter() {
  return filter
}
