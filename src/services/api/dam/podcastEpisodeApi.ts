import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiDeleteOne, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@/types/Filter'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import type { DocId } from '@/types/common'

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
