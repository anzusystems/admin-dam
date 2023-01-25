import { apiFetchOne } from '@/services/api/anzuApi'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { IntegerId } from '@anzusystems/common-admin'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DamConfigAssetCustomFormElement } from '@/types/dam/DamConfigAssetCustomForm'

const END_POINT = '/adm/v1/asset-custom-form'
const ENTITY = 'assetCustomForm'

// todo limit set to 100 for now, add load for pagination
export const fetchAssetCustomFormElements = (extSystem: IntegerId, assetType: AssetType) =>
  apiFetchOne<{ data: DamConfigAssetCustomFormElement[] }>(
    damClient,
    END_POINT + '/ext-system/:extSystem/type/:assetType/element?order[position]=asc&limit=100',
    { extSystem, assetType },
    SYSTEM_CORE_DAM,
    ENTITY
  )
