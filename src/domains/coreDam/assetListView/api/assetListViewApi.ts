import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/asset-list-view'
export const ENTITY = 'assetListView'

export const useFetchAssetListViewList = () =>
  useApiFetchList<AssetListView>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT })

export const useCreateAssetListView = () =>
  useApiRequest<AssetListView, AssetListView>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAssetListView = () =>
  useApiRequest<AssetListView, AssetListView>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAssetListView = () =>
  useApiRequest<AssetListView, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteAssetListView = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
