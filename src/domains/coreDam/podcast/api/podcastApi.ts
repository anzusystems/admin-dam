import { useApiCommand, useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/podcast'
const END_POINT_LIST_EXT_SYSTEM = END_POINT + '/ext-system/:extSystemId'
const END_POINT_LIST_LICENCE = END_POINT + '/licence/:licenceId'
export const ENTITY = 'podcast'

export const useFetchPodcastListByExtSystem = () =>
  useApiFetchList<Podcast>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST_EXT_SYSTEM })

export const useFetchPodcastListByLicence = () =>
  useApiFetchList<Podcast>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST_LICENCE })

export const useFetchPodcastListByIds = () =>
  useApiFetchByIds<Podcast>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST_EXT_SYSTEM })

export const useCreatePodcast = () =>
  useApiRequest<Podcast, Podcast>({ ...damApiBase, method: 'POST', entity: ENTITY, urlTemplate: END_POINT })

export const useUpdatePodcast = () =>
  useApiRequest<Podcast, Podcast>({ ...damApiBase, method: 'PUT', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useFetchPodcast = () =>
  useApiRequest<Podcast, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useDeletePodcast = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
