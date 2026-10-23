import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/video-show-episode'
export const ENTITY = 'videoShowEpisode'

export const useFetchVideoShowEpisodeListByVideoShow = () =>
  useApiFetchList<VideoShowEpisode>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT + '/video-show/:videoShowId',
  })

export const useFetchVideoShowEpisodeListByAsset = () =>
  useApiFetchList<VideoShowEpisode>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/asset/:assetId' })

export const usePrepareFormDataVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId/video-show/:videoShowId/prepare-payload',
  })

export const useCreateVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, VideoShowEpisode>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, VideoShowEpisode>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchVideoShowEpisode = () =>
  useApiRequest<VideoShowEpisode, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteVideoShowEpisode = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
