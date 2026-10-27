import { TimeIntervalSpecialOptions } from '@anzusystems/common-admin'
import type { TimeIntervalToolsValue } from '@anzusystems/common-admin'

export const allowedTimeIntervalValuesSubject: TimeIntervalToolsValue[] = [
  1_440,
  10_080,
  40_320,
  TimeIntervalSpecialOptions.CurrentMonth,
  TimeIntervalSpecialOptions.LastMonth,
  TimeIntervalSpecialOptions.Last3Months,
  TimeIntervalSpecialOptions.Custom,
]
