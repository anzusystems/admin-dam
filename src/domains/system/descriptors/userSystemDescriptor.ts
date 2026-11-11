import { defineUserSystemDescriptor } from '@anzusystems/common-admin'
import type { AnyUserSystemDescriptor, AnzuUser, AxiosClientFn, IntegerId } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

/**
 * One record with two parts: AnzuUser (roles, groups, grants) and dam (licences, ext systems, distribution services).
 * `PUT /adm/users/{id}` takes the full `DamUserDto`, so one save writes both.
 */
export interface DamUser extends AnzuUser {
  licenceGroups: IntegerId[]
  assetLicences: IntegerId[]
  adminToExtSystems: IntegerId[]
  userToExtSystems: IntegerId[]
  allowedAssetExternalProviders: string[]
  allowedDistributionServices: string[]
  selectedLicence: IntegerId | null
  ugcDeactivated?: boolean
}

export const damUserSystemDescriptor: AnyUserSystemDescriptor = defineUserSystemDescriptor({
  system: 'dam',
  client: damClient as AxiosClientFn,
  entity: 'anzuUser',
  label: 'DAM',
  isEnabled: () => true,
  // One required-metadata profile applies to both create and edit, so creating needs the full set.
  requiredMetadata: true,
  idInput: true,
  endpoints: {
    // `base` is the one that matters: it carries the dam fields, and
    // the whole `V1/` branch goes through `DeprecatedUserFacade`.
    anzuUser: { get: '/adm/v1/anzu-user/:id', put: '/adm/v1/anzu-user/:id', post: '/adm/v1/anzu-user' },
    base: { get: '/adm/users/:id', put: '/adm/users/:id', patch: '/adm/users/:id', post: '/adm/users' },
    permissionGroup: '/adm/v1/permission-group',
    currentUser: '/adm/users/current',
    list: '/adm/users',
    // `GET /adm/v1/anzu-user/{id}` has no access check in dam, so probing it could never show "no access".
    // `/adm/users` is behind `DAM_USER_READ` and is also where writes go.
    probe: 'base',
  },
})
