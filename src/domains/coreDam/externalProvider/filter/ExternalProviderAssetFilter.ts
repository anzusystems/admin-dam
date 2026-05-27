import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  _elastic: {
    ...makeFilter({ exclude: true }),
  },
  term: {
    ...makeFilter({ name: 'text' }),
  },
})

export function useExternalProviderAssetListFilter() {
  return filter
}
