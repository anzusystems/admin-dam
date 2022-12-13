import type { DistributionServiceName } from '@/types/dam/DamConfig'

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
