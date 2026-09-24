import type { DamCurrentUserDto } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin'

import type { UpdateCurrentUserDto } from '@/domains/system/auth/CurrentUser'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/users'
export const CURRENT_USER_END_POINT = END_POINT + '/current'
export const ENTITY = 'user'

export const useUpdateCurrentUser = () =>
  useApiRequest<DamCurrentUserDto, UpdateCurrentUserDto>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: CURRENT_USER_END_POINT,
  })

export const updateCurrentUser = (data: UpdateCurrentUserDto) => {
  const { execute } = useUpdateCurrentUser()
  return execute({ body: data })
}
