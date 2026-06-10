import { damClient } from '@/services/api/clients/damClient'
import type { DocId } from '@anzusystems/common-admin'
import { apiFetchOne } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { TtsAssetDetail } from '@/types/coreDam/TtsAsset'

const END_POINT = '/adm/v1/tts-asset'
export const ENTITY = 'ttsAsset'

export const fetchTtsAsset = (assetId: DocId) =>
  apiFetchOne<TtsAssetDetail>(damClient, END_POINT + '/:assetId', { assetId }, SYSTEM_CORE_DAM, ENTITY)
