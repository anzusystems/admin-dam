import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'

const END_POINT = '/adm/v1/video-show-episode'
export const ENTITY = 'videoShowEpisode'

export const useFetchVideoShowEpisodeListByVideoShow = () =>
  useApiFetchList<VideoShowEpisode[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/video-show/:videoShowId',
  })

export const useFetchVideoShowEpisodeListByAsset = () =>
  useApiFetchList<VideoShowEpisode[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const usePrepareFormDataVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId/video-show/:videoShowId/prepare-payload',
  })

export const useCreateVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, VideoShowEpisode>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, VideoShowEpisode>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteVideoShowEpisode = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
