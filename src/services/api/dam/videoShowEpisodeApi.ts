import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiDeleteOne, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@/types/Filter'
import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'
import type { DocId } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/video-show-episode'
export const ENTITY = 'videoShowEpisode'

export const fetchVideoShowEpisodeListByVideoShow = (
  videoShowId: DocId,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<VideoShowEpisode[]>(
    damClient,
    END_POINT + '/video-show/:videoShowId',
    { videoShowId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchVideoShowEpisodeListByAsset = (assetId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<VideoShowEpisode[]>(
    damClient,
    END_POINT + '/asset/:assetId',
    { assetId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const prepareFormDataVideoShowEpisode = (assetId: DocId, videoShowId: DocId) =>
  apiFetchOne<VideoShowEpisode>(
    damClient,
    END_POINT + '/asset/:assetId/video-show/:videoShowId/prepare-payload',
    { assetId, videoShowId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createVideoShowEpisode = (data: VideoShowEpisode) =>
  apiCreateOne<VideoShowEpisode>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateVideoShowEpisode = (id: DocId, data: VideoShowEpisode) =>
  apiUpdateOne<VideoShowEpisode>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchVideoShowEpisode = (id: DocId) =>
  apiFetchOne<VideoShowEpisode>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deleteVideoShowEpisode = (id: DocId) =>
  apiDeleteOne<VideoShowEpisode>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)