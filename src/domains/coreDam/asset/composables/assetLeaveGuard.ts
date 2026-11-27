import { useEventListener } from '@vueuse/core'
import { onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'

/**
 * Unsaved metadata in the asset form of a page is lost with the page, so ask before leaving it.
 * `holdsUnsavedMetadata` says what is unsaved on the calling page.
 * The page draws `AUnsavedConfirmDialog` bound to the store's `leaveUnsavedQuestion`.
 * Used by the asset list and by the asset pages opened by address.
 */
export function useAssetLeaveGuard(holdsUnsavedMetadata: () => boolean) {
  const assetDetailStore = useAssetDetailStore()

  /*
   * Ask as the last step before navigation settles, not in the page's leave
   * guard, which runs first. A later guard can still cancel the navigation.
   * Vuetify adds such a guard for every dialog and menu. Browser back
   * over an open one only closes it, which is not leaving the page.
   * The router view is keyed by path. Another query or hash keeps the page, another path,
   * such as another asset's page, draws a new one. The URL of a detail open over the list
   * replaces the list's URL without the router. That is not leaving the page and is not asked about.
   */
  const router = useRouter()
  const pagePath = useRoute().path
  const stopAskingOnTheWayOut = router.beforeResolve((to) => {
    if (to.path === pagePath) return true

    return !holdsUnsavedMetadata() || assetDetailStore.askToLeaveUnsaved()
  })
  onUnmounted(stopAskingOnTheWayOut)

  /*
   * The page cannot ask on reload or window close, so the browser shows its own prompt.
   * Downloading a file from the detail does not trigger it, because the link opens in another tab.
   */
  useEventListener(window, 'beforeunload', (event) => {
    if (!holdsUnsavedMetadata()) return
    event.preventDefault()
    // Older browsers ask only when this is set.
    event.returnValue = ''
  })
}
