import type { DamDistributionServiceName, DocId } from '@anzusystems/common-admin'
import { useApiCommand, useApiRequest } from '@anzusystems/common-admin'

import type {
  DistributionCustomCreateRedistributeDto,
  DistributionCustomItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/custom-distribution'
export const ENTITY = 'customDistribution'

export const useCreateCustomDistribution = () =>
  useApiRequest<DistributionCustomCreateRedistributeDto, DistributionCustomCreateRedistributeDto>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/distribute',
  })

export const createCustomDistribution = (assetFileId: DocId, data: DistributionCustomCreateRedistributeDto) => {
  const { execute } = useCreateCustomDistribution()
  return execute({ urlParams: { assetFileId }, body: data })
}

export const useRedistributeCustomDistribution = () =>
  useApiRequest<DistributionCustomCreateRedistributeDto, DistributionCustomCreateRedistributeDto>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionId/redistribute',
  })

export const redistributeCustomDistribution = (
  distributionId: DocId,
  data: DistributionCustomCreateRedistributeDto
) => {
  const { execute } = useRedistributeCustomDistribution()
  return execute({ urlParams: { distributionId }, body: data })
}

export const usePrepareFormDataCustomDistribution = () =>
  useApiRequest<DistributionCustomItem, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
  })

export const prepareFormDataCustomDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) => {
  const { execute } = usePrepareFormDataCustomDistribution()
  return execute({ urlParams: { assetFileId, distributionServiceName } })
}

export const useCancelCustomDistribution = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:distributionId' })

export const cancelCustomDistribution = (distributionId: DocId) => {
  const { execute } = useCancelCustomDistribution()
  return execute({ urlParams: { distributionId } })
}
