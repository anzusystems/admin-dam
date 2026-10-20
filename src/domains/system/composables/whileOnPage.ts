import { isNavigationPending, usePageNavigation } from '@anzusystems/common-admin'
import { NavigationFailureType, isNavigationFailure, useRouter } from 'vue-router'

// How long the history is waited for to be back on the page, at most.
const HISTORY_BACK_WAIT_MS = 1_000

/**
 * For what an answer leaves to be done on the page it was asked from - its address put back, an error said: only while
 * the user is on it. A way out of the page that waits - the question whether to leave what was typed - is not the page
 * left yet: then it is done once that way was given up ("Stay"), and not at all once the page was left. In the setup of
 * the page or a part of it.
 */
export function useWhileOnPage() {
  const router = useRouter()
  const { onPage } = usePageNavigation(router)

  /* A way back or forward given up is undone by the browser only after the router has said so: until its popstate the
   * entry of the history is still the one gone to, and an address put back would be written into that one. The router
   * knows it is there: its history is at another place than the page it shows. Waited for no longer than the next
   * navigation that settles, or a moment - a popstate may not come -, and done then only on the page still. */
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
        // Called off by a newer navigation: that one settles it.
        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) return
        settled()
      }),
      router.onError(settled)
    )
  }
}
