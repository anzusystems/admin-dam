import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type {
  AssetExternalProviderDetailDto,
  AssetExternalProviderListDto,
} from '@/domains/coreDam/asset/types/AssetExternalProvider'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/asset-external-provider'
export const ENTITY = 'asset'

export const useFetchExternalProviderAssetList = () =>
  useApiFetchList<AssetExternalProviderListDto>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:externalProvider',
  })

export const useFetchExternalProviderAsset = () =>
  useApiRequest<AssetExternalProviderDetailDto, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:externalProvider/:id',
  })
