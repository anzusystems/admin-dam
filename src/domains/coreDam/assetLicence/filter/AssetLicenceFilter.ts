import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  extId: {
    ...makeFilter({ name: 'extId' }),
  },
  extSystem: {
    ...makeFilter({ name: 'extSystem' }),
  },
})

export function useAssetLicenceListFilter() {
  return filter
}
