import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type {
  AuthorCleanPhrase,
  AuthorCleanResultDto,
  AuthorNameDto,
} from '@/domains/coreDam/authorCleanPhrase/types/AuthorCleanPhrase'

const END_POINT = '/adm/v1/author-clean-phrase'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'

export const ENTITY = 'authorCleanPhrase'

export const useFetchAuthorCleanPhraseList = () =>
  useApiFetchList<AuthorCleanPhrase[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useCreateAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanPhrase, AuthorCleanPhrase>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanPhrase, AuthorCleanPhrase>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanPhrase, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteAuthorCleanPhrase = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const usePlaygroundAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanResultDto, AuthorNameDto>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST + '/playground',
  })
