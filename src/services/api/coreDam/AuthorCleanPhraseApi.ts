import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  apiAnyRequest,
  apiCreateOne,
  apiDeleteOne,
  apiFetchList,
  apiFetchOne,
  apiUpdateOne,
  type FilterBag,
  type IntegerId,
  type Pagination,
} from '@anzusystems/common-admin'
import type { AuthorCleanPhrase, AuthorCleanResultDto, AuthorNameDto } from '@/types/coreDam/AuthorCleanPhrase'

const END_POINT = '/adm/v1/author-clean-phrase'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'

export const ENTITY = 'authorCleanPhrase'

export const fetchAuthorCleanPhraseList = (extSystemId: IntegerId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<AuthorCleanPhrase[]>(
    damClient,
    END_POINT_LIST,
    {
      extSystemId,
    },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createAuthorCleanPhrase = (data: AuthorCleanPhrase) =>
  apiCreateOne<AuthorCleanPhrase>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAuthorCleanPhrase = (id: IntegerId, data: AuthorCleanPhrase) =>
  apiUpdateOne<AuthorCleanPhrase>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAuthorCleanPhrase = (id: IntegerId) =>
  apiFetchOne<AuthorCleanPhrase>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deleteAuthorCleanPhrase = (id: IntegerId) =>
  apiDeleteOne<AuthorCleanPhrase>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const playground = (extSystemId: IntegerId, data: AuthorNameDto) =>
  apiAnyRequest<AuthorNameDto, AuthorCleanResultDto>(
    damClient,
    'PATCH',
    END_POINT_LIST + '/playground',
    {
      extSystemId,
    },
    data,
    SYSTEM_CORE_DAM,
    ENTITY
  )
