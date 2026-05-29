import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'

const END_POINT = '/adm/v1/podcast-episode'
export const ENTITY = 'podcastEpisode'

export const useFetchPodcastEpisodeListByPodcast = () =>
  useApiFetchList<PodcastEpisode[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/podcast/:podcastId',
  })

export const useFetchPodcastEpisodeListByAsset = () =>
  useApiFetchList<PodcastEpisode[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const usePrepareFormDataPodcastEpisode = () =>
  useApiRequest<PodcastEpisode, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId/podcast/:podcastId/prepare-payload',
  })

export const useCreatePodcastEpisode = () =>
  useApiRequest<PodcastEpisode, PodcastEpisode>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdatePodcastEpisode = () =>
  useApiRequest<PodcastEpisode, PodcastEpisode>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchPodcastEpisode = () =>
  useApiRequest<PodcastEpisode, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeletePodcastEpisode = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
