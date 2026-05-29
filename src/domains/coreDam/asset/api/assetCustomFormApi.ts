import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { damClient } from '@/shared/apiClients/damClient'
import type { CustomDataFormElement, DamAssetTypeType, DamDistributionServiceName } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'

const END_POINT = '/adm/v1/asset-custom-form'
const ENTITY = 'assetCustomForm'

// todo limit set to 100 for now, add load for pagination?
export const useFetchAssetCustomFormElements = () =>
  useApiRequest<{ data: CustomDataFormElement[] }, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/ext-system/:extSystem/type/:assetType/element?order[position]=asc&limit=100',
  })

export const fetchAssetCustomFormElements = (extSystem: IntegerId, assetType: DamAssetTypeType) => {
  const { executeRequest } = useFetchAssetCustomFormElements()
  return executeRequest({ urlParams: { extSystem, assetType } })
}

// todo limit set to 100 for now, add load for pagination?
export const useFetchDistributionCustomFormElements = () =>
  useApiRequest<{ data: CustomDataFormElement[] }, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/distribution-service/:distributionService/element?order[position]=asc&limit=100',
  })

export const fetchDistributionCustomFormElements = (distributionService: DamDistributionServiceName) => {
  const { executeRequest } = useFetchDistributionCustomFormElements()
  return executeRequest({ urlParams: { distributionService } })
}
