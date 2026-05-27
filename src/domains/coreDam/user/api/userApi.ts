import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { DamCurrentUserDto } from '@anzusystems/common-admin'
import { apiAnyRequest } from '@anzusystems/common-admin'
import type { UpdateCurrentUserDto } from '@/domains/system/auth/CurrentUser'

const END_POINT = '/adm/users'
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
