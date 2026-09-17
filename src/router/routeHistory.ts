import { useRouteHistory } from '@anzusystems/common-admin'

// Routes that must never be recorded as a place to come back to.
//
// A close button walks the history backwards for the first entry it is allowed to return to. Left
// unfiltered, that walk can land on a page that immediately pushes somewhere else -- the button
// then reads as doing nothing, or as jumping two views at once -- or on a dead end that has no way
// back into the app at all.
//
// `/login` and `/logout` throw the session away, `/[...pathMatch]` is the 404 page, `/error`
// only offers a full reload and `/close-page` exists to be closed by the opener.
// `/unauthorized` is where a failed permission check parks the user.
export const routeHistoryBlacklist = ['/[...pathMatch]', '/close-page', '/error', '/login', '/logout', '/unauthorized']

// Registered at module scope rather than from a mounted component: the first navigation's guard
// runs before anything is mounted, and a route recorded before the list is set stays in history.
export const initRouteHistory = () => {
  useRouteHistory().setBlacklistedRoutes(routeHistoryBlacklist)
}
