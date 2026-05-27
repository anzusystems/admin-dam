import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export const DistributionAuthStatus = {
  Idle: 'idle',
  WaitingForLogin: 'waiting_for_login',
  Success: 'success',
  Error: 'error',
} as const

export type DistributionAuthStatusType = (typeof DistributionAuthStatus)[keyof typeof DistributionAuthStatus]
export const DistributionAuthStatusDefault = DistributionAuthStatus.Idle

export interface DistributionAuth {
  distributionService: DamDistributionServiceName
  status: DistributionAuthStatusType
}
