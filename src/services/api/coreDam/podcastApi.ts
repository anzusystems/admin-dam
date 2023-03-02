import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId, FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import {
  apiCreateOne,
  apiDeleteOne,
  apiFetchByIds,
  apiFetchList,
  apiFetchOne,
  apiUpdateOne
} from '@anzusystems/common-admin'
import type { Podcast } from '@/types/coreDam/Podcast'

const END_POINT = '/adm/v1/podcast'
export const ENTITY = 'podcast'

export const fetchPodcastListByExtSystem = (extSystemId: IntegerId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<Podcast[]>(
    damClient,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchPodcastListByLicence = (licenceId: IntegerId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<Podcast[]>(
    damClient,
    END_POINT + '/licence/:licenceId',
    { licenceId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchPodcastListByIds = (extSystemId: IntegerId, ids: string[]) =>
  apiFetchByIds<Podcast[]>(
    damClient,
    ids,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createPodcast = (data: Podcast) =>
  apiCreateOne<Podcast>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updatePodcast = (id: DocId, data: Podcast) =>
  apiUpdateOne<Podcast>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchPodcast = (id: DocId) =>
  apiFetchOne<Podcast>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deletePodcast = (id: DocId) =>
  apiDeleteOne<Podcast>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
