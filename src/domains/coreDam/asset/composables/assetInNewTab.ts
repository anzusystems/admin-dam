import { useAlerts } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import { useRouter } from 'vue-router'

/*
 * Queue row edit and "Create empty asset" open the asset detail, which the asset list page draws.
 * External provider pages draw only the provider detail, so there the asset
 * opens in a new tab and uploads keep running. A page opts in by providing this.
 */
const AssetOpensInNewTabKey: InjectionKey<boolean> = Symbol('assetOpensInNewTab')

const EMPTY_TAB = 'about:blank'

/**
 * Call in the setup of a page that draws no DAM asset detail.
 */
export const provideAssetOpensInNewTab = () => provide(AssetOpensInNewTabKey, true)

// A popup blocker gives no tab and says nothing, so the editor is warned here.
const sayNoTab = () => useAlerts().showWarningT('coreDam.asset.newTabBlocked')

/**
 * A tab for an address not known yet, such as a new asset or a signed file.
 * Browsers allow a tab on a user action but may block one opened after a request,
 * so it opens empty now. `show` sends it to the address, `close` closes it.
 * Both act only while it is still the empty tab. One the user closed or navigated is theirs.
 * Until then the tab closes with the opening page, since nothing would be left to navigate or close it.
 */
export const openTabForAddress = () => {
  const tab = window.open('', '_blank')
  /*
   * Cut `opener` right away, while the tab is still an empty same-origin
   * page. After it navigates to another site it can no longer be cut off.
   */
  if (tab) tab.opener = null
  else sayNoTab()

  const whileEmpty = () => {
    try {
      return tab && !tab.closed && tab.location.href === EMPTY_TAB ? tab : null
    } catch {
      // A cross-origin tab does not expose its location.
      return null
    }
  }
  const closeWithPage = () => whileEmpty()?.close()
  if (tab) window.addEventListener('pagehide', closeWithPage)
  const stopClosingWithPage = () => window.removeEventListener('pagehide', closeWithPage)

  return {
    /**
     * Whether the browser gave a tab. Without one, there is no need to request an address.
     */
    opened: !!tab,
    show: (address: string) => {
      // First, because while navigating the tab still reports itself as empty.
      stopClosingWithPage()
      whileEmpty()?.location.replace(address)
    },
    close: () => {
      stopClosingWithPage()
      whileEmpty()?.close()
    },
  }
}

/**
 * Call in the setup of code that opens asset detail. Returns whether
 * the page opts into new tabs, and the two ways to open one.
 */
export const useAssetInNewTab = () => {
  const router = useRouter()
  const saidByPage = inject(AssetOpensInNewTabKey, false)

  const pageOf = (assetId: DocId) => router.resolve({ name: '/(coreDam)/assets/[id]', params: { id: assetId } }).href

  /**
   * Opens an existing asset page with `opener` cut. Not using `noopener`,
   * because then the browser does not tell whether a tab was given.
   */
  const openAssetInNewTab = (assetId: DocId) => {
    const tab = window.open(pageOf(assetId), '_blank')
    if (tab) tab.opener = null
    else sayNoTab()
  }

  /**
   * For an asset not created yet: opens a tab now and navigates it once the asset exists.
   */
  const openTabForAsset = () => {
    const tab = openTabForAddress()

    return { opened: tab.opened, show: (assetId: DocId) => tab.show(pageOf(assetId)), close: tab.close }
  }

  return { opensInNewTab: () => saidByPage, openAssetInNewTab, openTabForAsset }
}
