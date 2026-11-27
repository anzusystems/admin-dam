import type { DocId } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin'

import type { TtsAssetDetail } from '@/domains/coreDam/asset/types/TtsAsset'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/tts-asset'
export const ENTITY = 'ttsAsset'

export const useFetchTtsAsset = () =>
  useApiRequest<TtsAssetDetail, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:assetId',
  })

export const fetchTtsAsset = (assetId: DocId) => {
  const { execute } = useFetchTtsAsset()
  return execute({ urlParams: { assetId } })
}
