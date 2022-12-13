import { apiCreateOne, apiFetchOne } from '@/services/api/anzuApi'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId } from '@/types/common'
import type { DistributionServiceName } from '@/types/dam/DamConfig'
import type { DistributionJwCreateDto, DistributionJwItem } from '@/types/dam/Distribution'

const END_POINT = '/adm/v1/jw-distribution'
export const ENTITY = 'jwDistribution'

export const createJwDistribution = (assetFileId: DocId, data: DistributionJwCreateDto) =>
  apiCreateOne<DistributionJwCreateDto>(
    damClient,
    data,
    END_POINT + '/asset-file/:assetFileId/distribute',
    { assetFileId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataJwDistribution = (assetFileId: DocId, distributionServiceName: DistributionServiceName) =>
  apiFetchOne<DistributionJwItem>(
    damClient,
    END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
    { assetFileId, distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )
