import type { AnzuUserAndTimeTrackingAware, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'

export interface ExtSystem extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  name: string
  slug: string
  adminUsers: IntegerId[]
}

export interface ExtSystemMinimal extends Pick<ExtSystem, 'id' | 'name'> {}
