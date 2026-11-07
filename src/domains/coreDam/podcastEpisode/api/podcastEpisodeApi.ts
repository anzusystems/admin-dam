import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/podcast-episode'
export const ENTITY = 'podcastEpisode'

export const useFetchPodcastEpisodeListByPodcast = () =>
  useApiFetchList<PodcastEpisode>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/podcast/:podcastId' })

export const useFetchPodcastEpisodeListByAsset = () =>
  useApiFetchList<PodcastEpisode>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/asset/:assetId' })

export const usePrepareFormDataPodcastEpisode = () =>
  useApiRequest<PodcastEpisode, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId/podcast/:podcastId/prepare-payload',
  })

export const useCreatePodcastEpisode = () =>
  useApiRequest<PodcastEpisode, PodcastEpisode>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdatePodcastEpisode = () =>
  useApiRequest<PodcastEpisode, PodcastEpisode>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchPodcastEpisode = () =>
  useApiRequest<PodcastEpisode, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useDeletePodcastEpisode = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
