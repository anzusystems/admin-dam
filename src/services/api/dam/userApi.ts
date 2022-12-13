import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiDeleteOne, apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@/types/Filter'
import type { CreateUser, UpdateUser, User } from '@/types/dam/User'

const END_POINT = '/adm/v1/user'
export const CURRENT_USER_END_POINT = END_POINT + '/current'
export const ENTITY = 'user'

export const fetchCurrentUser = () => apiFetchOne<User>(damClient, CURRENT_USER_END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchUserListByIds = (ids: number[]) =>
  apiFetchByIds<User[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchUserList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<User[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createUser = (data: CreateUser) =>
  apiCreateOne<CreateUser, User>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateUser = (id: number, data: UpdateUser) =>
  apiUpdateOne<UpdateUser, User>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchUser = (id: number) =>
  apiFetchOne<User>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deleteUser = (id: number) =>
  apiDeleteOne<User>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
