import { describeCloseButtons } from '@anzusystems/common-admin/testing'

import { routeHistoryBlacklist } from '@/router/routeHistory'
import declaration from '@/typed-router.d.ts?raw'

describeCloseButtons({
  sources: import.meta.glob<string>('/src/**/*.vue', { query: '?raw', import: 'default', eager: true }),
  declaration,
  routeHistoryBlacklist,
})
