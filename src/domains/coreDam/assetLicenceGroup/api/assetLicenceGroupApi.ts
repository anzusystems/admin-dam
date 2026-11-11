import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin'
import type { DamAssetLicenceGroup } from '@anzusystems/common-admin'

import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/asset-licence-group'
export const ENTITY = 'assetLicenceGroup'

export const useFetchAssetLicenceGroupList = () =>
  useApiFetchList<DamAssetLicenceGroup>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT })

export const useCreateAssetLicenceGroup = () =>
  useApiRequest<DamAssetLicenceGroup, DamAssetLicenceGroup>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAssetLicenceGroup = () =>
  useApiRequest<DamAssetLicenceGroup, DamAssetLicenceGroup>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAssetLicenceGroup = () =>
  useApiRequest<DamAssetLicenceGroup, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
