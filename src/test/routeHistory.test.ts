import { describeRouteHistory } from '@anzusystems/common-admin/testing'

import { initRouteHistory, routeHistoryBlacklist } from '@/router/routeHistory'
import declaration from '@/typed-router.d.ts?raw'

describeRouteHistory({ declaration, routeHistoryBlacklist, initRouteHistory })
