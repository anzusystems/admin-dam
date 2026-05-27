import { makeFilterHelper } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/distributionApi'

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
