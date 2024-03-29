import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiDeleteOne, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'

const END_POINT = '/adm/v1/podcast-episode'
export const ENTITY = 'podcastEpisode'

export const fetchPodcastEpisodeListByPodcast = (podcastId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<PodcastEpisode[]>(
    damClient,
    END_POINT + '/podcast/:podcastId',
    { podcastId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchPodcastEpisodeListByAsset = (assetId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<PodcastEpisode[]>(
    damClient,
    END_POINT + '/asset/:assetId',
    { assetId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataPodcastEpisode = (assetId: DocId, podcastId: DocId) =>
  apiFetchOne<PodcastEpisode>(
    damClient,
    END_POINT + '/asset/:assetId/podcast/:podcastId/prepare-payload',
    { assetId, podcastId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createPodcastEpisode = (data: PodcastEpisode) =>
  apiCreateOne<PodcastEpisode>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updatePodcastEpisode = (id: DocId, data: PodcastEpisode) =>
  apiUpdateOne<PodcastEpisode>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchPodcastEpisode = (id: DocId) =>
  apiFetchOne<PodcastEpisode>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deletePodcastEpisode = (id: DocId) =>
  apiDeleteOne<PodcastEpisode>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
