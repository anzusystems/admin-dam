import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  DistributionJwCreateRedistributeDto,
  DistributionJwItem,
} from '@/domains/coreDam/asset/types/Distribution'

const END_POINT = '/adm/v1/jw-distribution'
export const ENTITY = 'jwDistribution'

export const useCreateJwDistribution = () =>
  useApiRequest<DistributionJwCreateRedistributeDto, DistributionJwCreateRedistributeDto>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/distribute',
  })

export const createJwDistribution = (assetFileId: DocId, data: DistributionJwCreateRedistributeDto) => {
  const { executeRequest } = useCreateJwDistribution()
  return executeRequest({ urlParams: { assetFileId }, object: data })
}

export const useRedistributeJwDistribution = () =>
  useApiRequest<DistributionJwCreateRedistributeDto, DistributionJwCreateRedistributeDto>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId/redistribute',
  })

export const redistributeJwDistribution = (distributionId: DocId, data: DistributionJwCreateRedistributeDto) => {
  const { executeRequest } = useRedistributeJwDistribution()
  return executeRequest({ urlParams: { distributionId }, object: data })
}

export const usePrepareFormDataJwDistribution = () =>
  useApiRequest<DistributionJwItem, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
  })

export const prepareFormDataJwDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) => {
  const { executeRequest } = usePrepareFormDataJwDistribution()
  return executeRequest({ urlParams: { assetFileId, distributionServiceName } })
}
