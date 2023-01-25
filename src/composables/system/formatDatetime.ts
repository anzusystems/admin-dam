import { friendlyDateTime, prettyDateTime } from '@/utils/datetime'
import type { DatetimeUTC, DatetimeUTCNullable } from '@anzusystems/common-admin'

export function useFriendlyDateTime() {
  return (value: DatetimeUTC | DatetimeUTCNullable | string | null) => friendlyDateTime(value)
}

export function usePrettyDateTime() {
  return (value: DatetimeUTC | DatetimeUTCNullable | string | null) => prettyDateTime(value)
}
