import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamCurrentUserDto } from '@anzusystems/common-admin'
import { apiAnyRequest } from '@anzusystems/common-admin'
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
