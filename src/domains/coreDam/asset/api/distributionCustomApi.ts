import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  DistributionCustomCreateRedistributeDto,
  DistributionCustomItem,
} from '@/domains/coreDam/asset/types/Distribution'

const END_POINT = '/adm/v1/custom-distribution'
export const ENTITY = 'customDistribution'

export const useCreateCustomDistribution = () =>
  useApiRequest<DistributionCustomCreateRedistributeDto, DistributionCustomCreateRedistributeDto>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/distribute',
  })

export const createCustomDistribution = (assetFileId: DocId, data: DistributionCustomCreateRedistributeDto) => {
  const { executeRequest } = useCreateCustomDistribution()
  return executeRequest({ urlParams: { assetFileId }, object: data })
}

export const useRedistributeCustomDistribution = () =>
  useApiRequest<DistributionCustomCreateRedistributeDto, DistributionCustomCreateRedistributeDto>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId/redistribute',
  })

export const redistributeCustomDistribution = (
  distributionId: DocId,
  data: DistributionCustomCreateRedistributeDto
) => {
  const { executeRequest } = useRedistributeCustomDistribution()
  return executeRequest({ urlParams: { distributionId }, object: data })
}

export const usePrepareFormDataCustomDistribution = () =>
  useApiRequest<DistributionCustomItem, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
  })

export const prepareFormDataCustomDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) => {
  const { executeRequest } = usePrepareFormDataCustomDistribution()
  return executeRequest({ urlParams: { assetFileId, distributionServiceName } })
}

export const useCancelCustomDistribution = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId',
  })

export const cancelCustomDistribution = (distributionId: DocId) => {
  const { executeRequest } = useCancelCustomDistribution()
  return executeRequest({ urlParams: { distributionId } })
}
