import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type {
  AssetExternalProviderDetailDto,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/asset-external-provider'
export const ENTITY = 'asset'

export const useFetchExternalProviderAssetList = () =>
  useApiFetchList<AssetExternalProviderListDto>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:externalProvider',
  })

export const useFetchExternalProviderAsset = () =>
  useApiRequest<AssetExternalProviderDetailDto, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:externalProvider/:id',
  })
