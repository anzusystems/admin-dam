import { useApiRequest } from '@anzusystems/common-admin'

import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/asset-licence'
export const ENTITY = 'assetLicence'

export const useCreateAssetLicence = () =>
  useApiRequest<DamAssetLicenceExtended, DamAssetLicenceExtended>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAssetLicence = () =>
  useApiRequest<DamAssetLicenceExtended, DamAssetLicenceExtended>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAssetLicence = () =>
  useApiRequest<DamAssetLicenceExtended, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

/**
 * Back-compat standalone fetch used by the not-yet-migrated `asset` slice
 * (AssetToolbarExtSystemLicenceDialog.vue, AssetToolbarOptions.vue, currentExtSystem.ts).
 * Remove once those callers move to `useFetchAssetLicence().execute({ urlParams: { id } })`.
 */
export const fetchAssetLicence = (id: number) => {
  const { execute } = useFetchAssetLicence()
  return execute({ urlParams: { id } })
}
