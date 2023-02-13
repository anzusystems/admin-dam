import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

export function useDistributionFilter() {
  return reactive({
    distributionService: {
      ...makeFilter({ name: 'distributionService' }),
    },
  })
}
