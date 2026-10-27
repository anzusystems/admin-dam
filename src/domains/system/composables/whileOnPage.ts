import { isNavigationPending, usePageNavigation } from '@anzusystems/common-admin'
import { NavigationFailureType, isNavigationFailure, useRouter } from 'vue-router'

// Maximum wait for the history to return to the page.
const HISTORY_BACK_WAIT_MS = 1_000

/**
 * Runs work left by a response (restoring the URL, showing an error) only while the user is on the page that asked.
 * A pending leave (the unsaved-changes prompt) does not count as leaving:
 * the work runs if the user picks "Stay", and not at all if they leave.
 * Call in the setup of the page or a component.
 */
export function useWhileOnPage() {
  const router = useRouter()
  const { onPage } = usePageNavigation(router)

  /*
   * A cancelled back/forward is undone by the browser only after the router's popstate. Until
   * then the history entry is the target one, and a restored URL would be written there.
   * The router detects this: its history location differs from the shown route.
   * Waits until the next settled navigation or a short timeout,
   * since popstate may not come. Runs only if still on the page.
   */
  const afterHistoryIsBack = (then: () => void) => {
    if (router.options.history.location === router.currentRoute.value.fullPath) {
      then()
      return
    }
    const stops: Array<() => void> = []
    const done = () => {
      stops.forEach((stop) => stop())
      stops.length = 0
      if (onPage()) then()
    }
    window.addEventListener('popstate', done)
    const timer = setTimeout(done, HISTORY_BACK_WAIT_MS)
    stops.push(
      () => window.removeEventListener('popstate', done),
      () => clearTimeout(timer),
      router.afterEach((_to, _from, failure) => {
        if (!isNavigationFailure(failure, NavigationFailureType.cancelled)) done()
      })
    )
  }

  return (then: () => void) => {
    if (onPage()) {
      then()
      return
    }
    if (!isNavigationPending(router)) return
    const stops: Array<() => void> = []
    const settled = () => {
      stops.forEach((stop) => stop())
      if (onPage()) afterHistoryIsBack(then)
    }
    stops.push(
      router.afterEach((_to, _from, failure) => {
        // Cancelled by a newer navigation, which settles it.
        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) return
        settled()
      }),
      router.onError(settled)
    )
  }
}
