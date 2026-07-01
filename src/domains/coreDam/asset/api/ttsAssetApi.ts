import { damClient } from '@/shared/apiClients/damClient'
import type { DocId } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { TtsAssetDetail } from '@/domains/coreDam/asset/types/TtsAsset'

const END_POINT = '/adm/v1/tts-asset'
export const ENTITY = 'ttsAsset'

export const useFetchTtsAsset = () =>
  useApiRequest<TtsAssetDetail, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:assetId',
  })

export const fetchTtsAsset = (assetId: DocId) => {
  const { executeRequest } = useFetchTtsAsset()
  return executeRequest({ urlParams: { assetId } })
}
