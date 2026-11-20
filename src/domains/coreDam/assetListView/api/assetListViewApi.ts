import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'

const END_POINT = '/adm/v1/asset-list-view'
export const ENTITY = 'assetListView'

export const useFetchAssetListViewList = () =>
  useApiFetchList<AssetListView[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useCreateAssetListView = () =>
  useApiRequest<AssetListView, AssetListView>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAssetListView = () =>
  useApiRequest<AssetListView, AssetListView>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAssetListView = () =>
  useApiRequest<AssetListView, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteAssetListView = () =>
  useApiRequest<null, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
