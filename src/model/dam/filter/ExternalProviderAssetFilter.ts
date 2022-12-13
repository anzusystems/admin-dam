import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  _elastic: {
    ...makeFilter({ exclude: true }),
  },
  term: {
    ...makeFilter({ name: 'text' }),
  },
})

export function useExternalProviderAssetFilter() {
  return filter
}
