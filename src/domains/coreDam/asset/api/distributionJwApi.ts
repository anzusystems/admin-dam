import type { DamDistributionServiceName, DocId } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin'

import type {
  DistributionJwCreateRedistributeDto,
  DistributionJwItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/jw-distribution'
export const ENTITY = 'jwDistribution'

export const useCreateJwDistribution = () =>
  useApiRequest<DistributionJwCreateRedistributeDto, DistributionJwCreateRedistributeDto>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/distribute',
  })

export const createJwDistribution = (assetFileId: DocId, data: DistributionJwCreateRedistributeDto) => {
  const { execute } = useCreateJwDistribution()
  return execute({ urlParams: { assetFileId }, body: data })
}

export const useRedistributeJwDistribution = () =>
  useApiRequest<DistributionJwCreateRedistributeDto, DistributionJwCreateRedistributeDto>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId/redistribute',
  })

export const redistributeJwDistribution = (distributionId: DocId, data: DistributionJwCreateRedistributeDto) => {
  const { execute } = useRedistributeJwDistribution()
  return execute({ urlParams: { distributionId }, body: data })
}

export const usePrepareFormDataJwDistribution = () =>
  useApiRequest<DistributionJwItem, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
  })

export const prepareFormDataJwDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) => {
  const { execute } = usePrepareFormDataJwDistribution()
  return execute({ urlParams: { assetFileId, distributionServiceName } })
}
