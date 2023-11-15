import type { DocId } from '@anzusystems/common-admin'
import { apiCreateOne, apiDeleteOne, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import type { DistributionCustomCreateRedistributeDto, DistributionCustomItem } from '@/types/coreDam/Distribution'

const END_POINT = '/adm/v1/custom-distribution'
export const ENTITY = 'customDistribution'

export const createCustomDistribution = (assetFileId: DocId, data: DistributionCustomCreateRedistributeDto) =>
  apiCreateOne<DistributionCustomCreateRedistributeDto>(
    damClient,
    data,
    END_POINT + '/asset-file/:assetFileId/distribute',
    { assetFileId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const redistributeCustomDistribution = (distributionId: DocId, data: DistributionCustomCreateRedistributeDto) =>
  apiUpdateOne<DistributionCustomCreateRedistributeDto>(
    damClient,
    data,
    END_POINT + '/:distributionId/redistribute',
    { distributionId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataCustomDistribution = (
  assetFileId: DocId,
  distributionServiceName: DamDistributionServiceName
) =>
  apiFetchOne<DistributionCustomItem>(
    damClient,
    END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
    { assetFileId, distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const cancelCustomDistribution = (distributionId: DocId) =>
  apiDeleteOne(damClient, END_POINT + '/:distributionId', { distributionId }, SYSTEM_CORE_DAM, ENTITY)
