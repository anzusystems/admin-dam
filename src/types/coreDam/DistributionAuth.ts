import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export enum DistributionAuthStatus {
  Idle = 'idle',
  WaitingForLogin = 'waiting_for_login',
  Success = 'success',
  Error = 'error',
  Default = Idle,
}

export interface DistributionAuth {
  distributionService: DamDistributionServiceName
  status: DistributionAuthStatus
}
