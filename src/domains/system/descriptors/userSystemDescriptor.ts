import { defineUserSystemDescriptor, type AnyUserSystemDescriptor } from '@anzusystems/common-admin/labs'
import type { AxiosClientFn } from '@anzusystems/common-admin/labs'
import type { AnzuUser, IntegerId } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'

/**
 * The dam account, which is one record with two faces: the AnzuUser part (roles, groups, grants)
 * and the dam part (licences, ext systems, distribution services). `DamUserDto` extends `UserDto`
 * and `PUT /adm/users/{id}` takes the whole thing, so one save writes both.
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
  // Creating an account used to need only an id and an e-mail here, editing needed the full set.
  // One profile per system, applied the same way to both, is the rule now -- so creating is
  // stricter than it was.
  requiredMetadata: true,
  idInput: true,
  endpoints: {
    // Both exist, and `base` is the one that matters: it carries the dam fields, and the whole
    // `V1/` branch goes through `DeprecatedUserFacade`.
    anzuUser: { get: '/adm/v1/anzu-user/:id', put: '/adm/v1/anzu-user/:id', post: '/adm/v1/anzu-user' },
    base: { get: '/adm/users/:id', put: '/adm/users/:id', patch: '/adm/users/:id', post: '/adm/users' },
    permissionGroup: '/adm/v1/permission-group',
    currentUser: '/adm/users/current',
    list: '/adm/users',
    // Deliberate: `GET /adm/v1/anzu-user/{id}` has no gating in dam at all, so probing through it
    // would mean the state "you have no access" could never be shown. `/adm/users` is behind
    // `DAM_USER_READ`, and it is also the path the writes go to.
    probe: 'base',
  },
})
