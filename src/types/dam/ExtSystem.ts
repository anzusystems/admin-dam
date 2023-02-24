import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { IntegerId } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'

export interface ExtSystem extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  name: string
  slug: string
  adminUsers: IntegerId[]
}

export interface ExtSystemMinimal extends Pick<ExtSystem, 'id' | 'name'> {}
