import type { CustomDataFormElement, IntegerId } from '@anzusystems/common-admin'
import { apiFetchOne } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamAssetType } from '@anzusystems/common-admin'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/asset-custom-form'
const ENTITY = 'assetCustomForm'

// todo limit set to 100 for now, add load for pagination?
export const fetchAssetCustomFormElements = (extSystem: IntegerId, assetType: DamAssetType) =>
  apiFetchOne<{ data: CustomDataFormElement[] }>(
    damClient,
    END_POINT + '/ext-system/:extSystem/type/:assetType/element?order[position]=asc&limit=100',
    { extSystem, assetType },
    SYSTEM_CORE_DAM,
    ENTITY
  )

// todo limit set to 100 for now, add load for pagination?
export const fetchDistributionCustomFormElements = (distributionService: DamDistributionServiceName) =>
  apiFetchOne<{ data: CustomDataFormElement[] }>(
    damClient,
    END_POINT + '/distribution-service/:distributionService/element?order[position]=asc&limit=100',
    { distributionService },
    SYSTEM_CORE_DAM,
    ENTITY
  )
