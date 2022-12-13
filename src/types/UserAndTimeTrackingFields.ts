import type { DatetimeUTC, IntegerId } from '@/types/common'

export interface TimeTrackingFields {
  createdAt: DatetimeUTC
  modifiedAt: DatetimeUTC
}

export interface UserTrackingFields {
  createdBy: IntegerId
  modifiedBy: IntegerId
}

export interface UserAndTimeTrackingFields extends TimeTrackingFields, UserTrackingFields {}
