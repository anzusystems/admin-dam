import type { AnzuUserAndTimeTrackingAware, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'

export interface DamExtSystem extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  name: string
  slug: string
  adminUsers: IntegerId[]
}

export interface DamExtSystemMinimal extends Pick<DamExtSystem, 'id' | 'name'> {}
