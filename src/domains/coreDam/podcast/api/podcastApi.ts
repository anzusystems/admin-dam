import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'

const END_POINT = '/adm/v1/podcast'
const END_POINT_LIST_EXT_SYSTEM = END_POINT + '/ext-system/:extSystemId'
const END_POINT_LIST_LICENCE = END_POINT + '/licence/:licenceId'
export const ENTITY = 'podcast'

export const useFetchPodcastListByExtSystem = () =>
  useApiFetchList<Podcast[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST_EXT_SYSTEM,
  })

export const useFetchPodcastListByLicence = () =>
  useApiFetchList<Podcast[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST_LICENCE,
  })

export const useFetchPodcastListByIds = () =>
  useApiFetchByIds<Podcast[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST_EXT_SYSTEM,
  })

export const useCreatePodcast = () =>
  useApiRequest<Podcast, Podcast>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdatePodcast = () =>
  useApiRequest<Podcast, Podcast>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchPodcast = () =>
  useApiRequest<Podcast, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeletePodcast = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
