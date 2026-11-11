import { useRouteHistory } from '@anzusystems/common-admin'
import type { RouteRecordName } from 'vue-router'

// Routes never recorded as a place to return to.
// A close button walks history back to the first allowed entry. Unfiltered, it
// can land on a page that redirects at once, or on a dead end with no way back.
// `/login` and `/logout` drop the session, `/[...pathMatch]` is the 404 page,
// `/error` only offers a reload, `/close-page` is closed by the opener.
// `/unauthorized` is where a failed permission check sends the user.
export const routeHistoryBlacklist = [
  '/[...pathMatch]',
  '/close-page',
  '/error',
  '/login',
  '/logout',
  '/unauthorized',
] satisfies RouteRecordName[]

// Registered at module scope, not from a mounted component. The first navigation's guard
// runs before anything mounts, and a route recorded before the list is set stays in history.
export const initRouteHistory = () => {
  useRouteHistory().setBlacklistedRoutes(routeHistoryBlacklist)
}
