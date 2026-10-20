import { useAlerts } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import { useRouter } from 'vue-router'

/* The edit of a row of the upload queue and "Create empty asset" open the detail of their asset, which the page of
 * the list of assets draws. They are drawn on the page of an external provider as well, and that one draws only the
 * detail of the provider: there the asset is opened on its own page, in a new tab of the browser, and the page stays
 * as it is, with its uploads running. A page says so by providing this. */
const AssetOpensInNewTabKey: InjectionKey<boolean> = Symbol('assetOpensInNewTab')

/** The address of a tab that is opened with none. */
const EMPTY_TAB = 'about:blank'

/** For a page that draws no detail of an asset of DAM, in its setup. */
export const provideAssetOpensInNewTab = () => provide(AssetOpensInNewTabKey, true)

// A browser that gives no tab - its blocker of new windows - says nothing: the editor is told here.
const sayNoTab = () => useAlerts().showWarningT('coreDam.asset.newTabBlocked')

/**
 * A tab for an address that is yet to come: of an asset being made, of a file being signed. A browser opens a tab at a
 * press and can block one opened after a request, so the tab is opened now, empty, and is sent to the address once
 * there is one (`show`), or closed when there is none (`close`). Either only while it is still the empty tab that was
 * opened: one the user has closed or taken elsewhere meanwhile is theirs. And until either, the tab goes with the page
 * that opened it: that page closed or reloaded, nothing would be left to send the tab on or to close it.
 */
export const openTabForAddress = () => {
  const tab = window.open('', '_blank')
  /* No way back to the page that opened it, from the start: the tab is cut off while it is still the empty page of
   * this origin. Taken to another site while the address is on its way, it could not be cut off any more. */
  if (tab) tab.opener = null
  else sayNoTab()

  const whileEmpty = () => {
    try {
      return tab && !tab.closed && tab.location.href === EMPTY_TAB ? tab : null
    } catch {
      // A tab that is on another site by now does not say where it is.
      return null
    }
  }
  const closeWithPage = () => whileEmpty()?.close()
  // With no tab there is nothing to close: nothing is left listening for the page to go.
  if (tab) window.addEventListener('pagehide', closeWithPage)
  const stopClosingWithPage = () => window.removeEventListener('pagehide', closeWithPage)

  return {
    /** Whether the browser gave the tab: with none, there is nothing to ask for an address for. */
    opened: !!tab,
    show: (address: string) => {
      // First: on its way to the address the tab still says it is empty.
      stopClosingWithPage()
      whileEmpty()?.location.replace(address)
    },
    close: () => {
      stopClosingWithPage()
      whileEmpty()?.close()
    },
  }
}

/** For what opens the detail of an asset, in its setup: whether its page has said the above, and the two ways to. */
export const useAssetInNewTab = () => {
  const router = useRouter()
  const saidByPage = inject(AssetOpensInNewTabKey, false)

  const pageOf = (assetId: DocId) => router.resolve({ name: '/(coreDam)/assets/[id]', params: { id: assetId } }).href

  /** The page of an asset there already is. The tab has no way back to the page that opened it, from the start. Opened
   * so that it is known whether the browser gave one (with `noopener` it says nothing either way). */
  const openAssetInNewTab = (assetId: DocId) => {
    const tab = window.open(pageOf(assetId), '_blank')
    if (tab) tab.opener = null
    else sayNoTab()
  }

  /** For an asset that is yet to be made: a tab opened now, sent to the page of the asset once there is one. */
  const openTabForAsset = () => {
    const tab = openTabForAddress()

    return { opened: tab.opened, show: (assetId: DocId) => tab.show(pageOf(assetId)), close: tab.close }
  }

  return { opensInNewTab: () => saidByPage, openAssetInNewTab, openTabForAsset }
}
