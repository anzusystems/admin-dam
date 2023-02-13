import { apiCreateOne, apiFetchOne } from '@/services/api/anzuApi'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId } from '@anzusystems/common-admin'
import type { DistributionServiceName } from '@/types/dam/DamConfig'
import type { DistributionCustomCreateDto, DistributionCustomItem } from '@/types/dam/Distribution'

const END_POINT = '/adm/v1/custom-distribution'
export const ENTITY = 'customDistribution'

export const createCustomDistribution = (assetFileId: DocId, data: DistributionCustomCreateDto) =>
  apiCreateOne<DistributionCustomCreateDto>(
    damClient,
    data,
    END_POINT + '/asset-file/:assetFileId/distribute',
    { assetFileId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataCustomDistribution = (
  assetFileId: DocId,
  distributionServiceName: DistributionServiceName
) =>
  apiFetchOne<DistributionCustomItem>(
    damClient,
    END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
    { assetFileId, distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )
