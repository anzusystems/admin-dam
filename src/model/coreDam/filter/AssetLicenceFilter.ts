import { makeFilterHelper } from '@anzusystems/common-admin'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  extId: {
    ...makeFilter({ name: 'extId' }),
  },
})

export function useAssetLicenceListFilter() {
  return filter
}

export function useAssetLicenceFilter() {
  return reactive({
    name: {
      ...makeFilter({ name: 'name', variant: 'startsWith' }),
    },
    extSystem: {
      ...makeFilter({ name: 'extSystem', default: null }),
    },
    extId: {
      ...makeFilter({ name: 'extId', default: null }),
    },
  })
}
