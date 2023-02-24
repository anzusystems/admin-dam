import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { Author } from '@/types/dam/Author'

const END_POINT = '/adm/v1/author'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'author'

export const fetchAuthorListByIds = (extSystemId: number, ids: string[]) =>
  apiFetchByIds<Author[]>(
    damClient,
    ids,
    END_POINT_LIST + '/search',
    {
      extSystemId,
    },
    SYSTEM_CORE_DAM,
    ENTITY,
    {},
    true
  )

export const fetchAuthorList = (extSystemId: number, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<Author[]>(
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

export const createAuthor = (data: Author) =>
  apiCreateOne<Author>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAuthor = (id: string, data: Author) =>
  apiUpdateOne<Author>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAuthor = (id: string) =>
  apiFetchOne<Author>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
