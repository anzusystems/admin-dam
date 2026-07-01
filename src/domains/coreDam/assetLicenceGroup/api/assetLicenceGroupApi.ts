import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { type DamAssetLicenceGroup } from '@anzusystems/common-admin'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'

const END_POINT = '/adm/v1/asset-licence-group'
export const ENTITY = 'assetLicenceGroup'

export const useFetchAssetLicenceGroupList = () =>
  useApiFetchList<DamAssetLicenceGroup[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useCreateAssetLicenceGroup = () =>
  useApiRequest<DamAssetLicenceGroup, DamAssetLicenceGroup>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAssetLicenceGroup = () =>
  useApiRequest<DamAssetLicenceGroup, DamAssetLicenceGroup>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAssetLicenceGroup = () =>
  useApiRequest<DamAssetLicenceGroup, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
