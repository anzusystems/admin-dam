import { friendlyDateTime, prettyDateTime } from '@/utils/datetime'
import type { DatetimeUTC, DatetimeUTCNullable } from '@/types/common'

export function useFriendlyDateTime() {
  return (value: DatetimeUTC | DatetimeUTCNullable | string | null) => friendlyDateTime(value)
}

export function usePrettyDateTime() {
  return (value: DatetimeUTC | DatetimeUTCNullable | string | null) => prettyDateTime(value)
}
