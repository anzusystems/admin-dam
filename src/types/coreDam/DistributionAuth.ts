import type { DistributionServiceName } from '@/types/coreDam/DamConfig'

export enum DistributionAuthStatus {
  Idle = 'idle',
  WaitingForLogin = 'waiting_for_login',
  Success = 'success',
  Error = 'error',
  Default = Idle,
}

export interface DistributionAuth {
  distributionService: DistributionServiceName
  status: DistributionAuthStatus
}
