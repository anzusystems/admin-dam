import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiDeleteOne, apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@anzusystems/common-admin'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@anzusystems/common-admin'
import type { VideoShow } from '@/types/dam/VideoShow'
import type { DocId, IntegerId } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/video-show'
export const ENTITY = 'videoShow'

export const fetchVideoShowListByExtSystem = (extSystemId: IntegerId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<VideoShow[]>(
    damClient,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchVideoShowListByLicence = (licenceId: IntegerId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<VideoShow[]>(
    damClient,
    END_POINT + '/licence/:licenceId',
    { licenceId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchVideoShowListByIds = (extSystemId: IntegerId, ids: string[]) =>
  apiFetchByIds<VideoShow[]>(
    damClient,
    ids,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createVideoShow = (data: VideoShow) =>
  apiCreateOne<VideoShow>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateVideoShow = (id: DocId, data: VideoShow) =>
  apiUpdateOne<VideoShow>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchVideoShow = (id: DocId) =>
  apiFetchOne<VideoShow>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deleteVideoShow = (id: DocId) =>
  apiDeleteOne<VideoShow>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
