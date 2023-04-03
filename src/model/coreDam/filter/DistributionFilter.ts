import { reactive } from 'vue'
import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

export function useDistributionFilter() {
  return reactive({
    id: {
      ...makeFilter({ name: 'id' }),
    },
    distributionService: {
      ...makeFilter({ name: 'distributionService' }),
    },
    distributionServicesIn: {
      ...makeFilter({ name: 'distributionServicesIn', field: 'distributionService', variant: 'in', default: [] }),
    },
    distributionServicesNotIn: {
      ...makeFilter({ name: 'distributionServicesNotIn', field: 'distributionService', variant: 'notIn', default: [] }),
    },
  })
}
