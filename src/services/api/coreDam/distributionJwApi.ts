import type { DocId } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import type { DistributionJwCreateRedistributeDto, DistributionJwItem } from '@/types/coreDam/Distribution'

const END_POINT = '/adm/v1/jw-distribution'
export const ENTITY = 'jwDistribution'

export const createJwDistribution = (assetFileId: DocId, data: DistributionJwCreateRedistributeDto) =>
  apiCreateOne<DistributionJwCreateRedistributeDto>(
    damClient,
    data,
    END_POINT + '/asset-file/:assetFileId/distribute',
    { assetFileId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const redistributeJwDistribution = (distributionId: DocId, data: DistributionJwCreateRedistributeDto) =>
  apiUpdateOne<DistributionJwCreateRedistributeDto>(
    damClient,
    data,
    END_POINT + '/:distributionId/redistribute',
    { distributionId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataJwDistribution = (assetFileId: DocId, distributionServiceName: DamDistributionServiceName) =>
  apiFetchOne<DistributionJwItem>(
    damClient,
    END_POINT + '/asset-file/:assetFileId/prepare-payload/:distributionServiceName',
    { assetFileId, distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )
