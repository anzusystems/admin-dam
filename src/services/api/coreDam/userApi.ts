import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamCurrentUserDto, FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiAnyRequest, apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { UpdateUser, User } from '@/types/coreDam/User'
import type { UpdateCurrentUserDto } from '@/types/coreDam/CurrentUser'

const END_POINT = '/adm/v1/user'
export const CURRENT_USER_END_POINT = END_POINT + '/current'
export const ENTITY = 'user'

export const updateCurrentUser = (data: UpdateCurrentUserDto) =>
  apiAnyRequest<UpdateCurrentUserDto, DamCurrentUserDto>(
    damClient,
    'PATCH',
    CURRENT_USER_END_POINT,
    {},
    data,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchUserListByIds = (ids: number[]) =>
  apiFetchByIds<User[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchUserList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<User[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const updateUser = (id: number, data: UpdateUser) =>
  apiUpdateOne<UpdateUser, User>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchUser = (id: number) =>
  apiFetchOne<User>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
