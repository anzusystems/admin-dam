import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type {
  AuthorCleanPhrase,
  AuthorCleanResultDto,
  AuthorNameDto,
} from '@/domains/coreDam/authorCleanPhrase/types/AuthorCleanPhrase'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/author-clean-phrase'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'

export const ENTITY = 'authorCleanPhrase'

export const useFetchAuthorCleanPhraseList = () =>
  useApiFetchList<AuthorCleanPhrase>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useCreateAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanPhrase, AuthorCleanPhrase>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanPhrase, AuthorCleanPhrase>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanPhrase, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteAuthorCleanPhrase = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const usePlaygroundAuthorCleanPhrase = () =>
  useApiRequest<AuthorCleanResultDto, AuthorNameDto>({
    ...damApiBase,
    method: 'PATCH',
    entity: ENTITY,
    urlTemplate: END_POINT_LIST + '/playground',
  })
