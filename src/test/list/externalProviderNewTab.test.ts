import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The row edit of the upload queue and "Create empty asset" open the asset detail over the DAM list.
 * The external provider page draws only the provider detail, so there
 * the asset opens at its own address in a new tab and the page stays.
 * The create button has no asset until the server makes one. It opens an empty tab on press, cut off from the page,
 * then sends it on when there is an asset or closes it when there is none, only while the tab is still the empty one.
 * Until then the tab goes with the page and the dialog cannot be closed.
 * Real pages, menu, dialog and queue; fake server, new-version address and browser tabs.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/

const CREATED = 'Record was created'
const NO_TAB = 'The browser did not open a new tab. Allow pop-up windows for this site and try again.'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const EDIT = 'Edit more'
const UNSAVED = 'Unsaved changes'

const LIST = '/assets'
const PROVIDED = '/external-providers/' + PROVIDER
const UPLOADED = 'asset-9'
const NEW = 'asset-new'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

const createDialog = () => document.body.querySelector<HTMLElement>('[data-cy="create-panel"]')

/**
 * A tab the user took to another site does not report its address.
 */
const ANOTHER_SITE = null
const OF_THE_APPLICATION = 'http://localhost:3000/assets'

const newTab = () => {
  const sentTo: Array<{ address: string; reachesOpener: boolean }> = []
  let address: string | null = 'about:blank'
  const tab = {
    opener: window as unknown,
    closed: false,
    close: () => {
      tab.closed = true
    },
    location: {
      get href() {
        if (address === ANOTHER_SITE) {
          throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError')
        }

        return address
      },
      // The tab is only on its way there: until the page comes, it still says it is empty.
      replace: (to: string) => void sentTo.push({ address: to, reachesOpener: tab.opener !== null }),
    },
    sentTo,
    takenTo: (to: string | null) => {
      address = to
    },
  }

  return tab
}

type Tab = ReturnType<typeof newTab>

const browserOpensTabs = (give: () => Tab | null = newTab) => {
  const given: Array<Tab | null> = []
  const open = vi.fn<(...asked: unknown[]) => Tab | null>(() => {
    given.push(give())

    return given.at(-1) ?? null
  })
  vi.stubGlobal('open', open)

  return { asked: () => open.mock.calls, given }
}

const dismiss = async (dialog: Element) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settled()
  const scrim = dialog.closest('.v-overlay')!.querySelector<HTMLElement>('.v-overlay__scrim')!
  scrim.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  scrim.click()
  await settled()
}

const holdCreate = (answered: 'made' | 'refused' = 'made') => {
  let answer: () => void = () => undefined
  server.on(
    'POST',
    CREATE,
    () =>
      new Promise<FakeDamAnswer>((resolve, reject) => {
        answer = () => (answered === 'made' ? resolve({ status: 201, data: created() }) : reject(httpError(500)))
      })
  )

  return async () => {
    answer()
    await settled()
  }
}

const pageGoesAway = () => window.dispatchEvent(new Event('pagehide'))

const closeButtons = () => ({
  cross: createDialog()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!,
  cancel: createDialog()!.querySelector<HTMLButtonElement>('button[data-cy="button-cancel"]')!,
})

const created = () => onServer(NEW, { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null })

const inDetailStore = async () => {
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const store = useAssetDetailStore()

  return [store.asset?.id ?? null, store.detail]
}

const openPage = async (address: typeof LIST | typeof PROVIDED) => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_assetExternalProvider_access'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: uploaded },
  })
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    allowedAssetExternalProviders: [PROVIDER],
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push(address)
  const page = await ui.mount(async () => ({ default: RouterView }))
  await eventually(() =>
    address === LIST
      ? expect(page.querySelectorAll('.dam-image-grid__item')).toHaveLength(3)
      : expect(page.textContent).toContain('No matching assets found')
  )
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

  return {
    ...ui,
    queue,
    at: () => ui.router.currentRoute.value.path,
    editUploaded: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      const edit = await eventually(() => {
        const button = queue() ? buttonsNamed(queue()!, EDIT)[0] : undefined
        expect(button?.disabled).toBe(false)

        return button!
      })
      edit.click()
      await settled()
    },
    openCreate: async () => {
      page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
      const item = await eventually(() => {
        const found = document.body.querySelector<HTMLElement>('[data-cy="button-main-empty-asset"]')
        expect(found).not.toBeNull()

        return found!
      })
      item.click()

      return eventually(() => {
        const confirm = createDialog()?.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')
        expect(confirm).toBeTruthy()

        return confirm!
      })
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  for (const id of ['asset-1', 'asset-2', 'asset-3']) server.asset(onServer(id))
  server.asset(
    onServer(UPLOADED, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
    })
  )
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  server.on('POST', CREATE, () => ({ status: 201, data: created() }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the edit of a row of the upload queue on the page of an external provider', () => {
  // `noopener` is not used because it returns no tab either way.
  // The tab is cut off as it is given.
  it('opens the page of the asset of the row in a new tab that has no way back, and reads nothing here', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()

    await page.editUploaded()

    expect([tabs.asked(), tabs.given[0]!.opener]).toEqual([[['/assets/' + UPLOADED, '_blank']], null])
    expect([page.at(), page.queue() !== null, server.assetReads(UPLOADED), await inDetailStore()]).toEqual([
      PROVIDED,
      true,
      0,
      [null, false],
    ])
  })

  /*
   * The DAM detail is emptied when the DAM list page is left, so nothing of it is held here.
   * Even if it were held, nothing on this page could be replaced by the asset of the row, so no question is asked.
   */
  it('asks nothing about metadata that were not saved', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs(() => null)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    useAssetDetailStore().metadataAreTouched = true
    expect(useAssetDetailStore().panelHoldsUnsavedMetadata).toBe(true)

    await page.editUploaded()

    expect([tabs.asked().length, questions(), useAssetDetailStore().leaveUnsavedQuestion]).toEqual([1, [], false])
  })
})

describe('"Create empty asset" on the page of an external provider', () => {
  it('opens a tab as it is confirmed, and sends the tab to the page of the asset once the asset is made', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const answerCreate = holdCreate()
    const confirm = await page.openCreate()

    confirm.click()

    // At the press itself, with nothing waited for: a browser can block a tab that is opened later.
    expect(tabs.asked()).toEqual([['', '_blank']])
    await settled()
    expect([server.sent('POST', CREATE).length, tabs.given[0]!.sentTo, tabs.given[0]!.closed]).toEqual([1, [], false])

    await answerCreate()

    // Cut off from the page that opened it before it is sent on.
    expect(tabs.given[0]!.sentTo).toEqual([{ address: '/assets/' + NEW, reachesOpener: false }])
    expect([tabs.asked().length, tabs.given[0]!.closed, page.alerts(), createDialog()]).toEqual([
      1,
      false,
      [CREATED],
      null,
    ])
    expect([page.at(), await inDetailStore()]).toEqual([PROVIDED, [null, false]])
  })

  it('closes the tab when the asset is not made: the dialog stays, and the next confirm opens a tab of its own', async () => {
    server.on('POST', CREATE, () => {
      throw httpError(500)
    })
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const confirm = await page.openCreate()

    confirm.click()
    await settled()

    expect([tabs.given[0]!.closed, tabs.given[0]!.sentTo, page.alerts(), createDialog() !== null]).toEqual([
      true,
      [],
      [SYSTEM_ERROR],
      true,
    ])

    server.on('POST', CREATE, () => ({ status: 201, data: created() }))
    confirm.click()
    await settled()

    expect([tabs.asked().length, tabs.given[1]!.closed, tabs.given[1]!.sentTo]).toEqual([
      2,
      false,
      [{ address: '/assets/' + NEW, reachesOpener: false }],
    ])
  })

  // Each confirm would open a tab and make an asset of its own.
  it('takes one confirm while the asset is being made: one tab, and one asset', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const answerCreate = holdCreate()
    const confirm = await page.openCreate()

    confirm.click()
    await settled()
    confirm.click()
    await settled()

    expect([tabs.asked().length, server.sent('POST', CREATE).length]).toEqual([1, 1])

    await answerCreate()
    expect([tabs.asked().length, server.sent('POST', CREATE).length, tabs.given[0]!.sentTo.length]).toEqual([1, 1, 1])
  })

  /*
   * A tab taken to another site while the asset is made, if it could still reach the opener, would keep that for good.
   * It is cut off while it is still the empty page it was opened as.
   */
  it('cuts the tab off from this page as it opens it, with nothing waited for', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    holdCreate()
    const confirm = await page.openCreate()

    confirm.click()

    expect([tabs.asked().length, tabs.given[0]!.opener]).toEqual([1, null])
  })

  // An asset made without a tab would have nowhere to be shown.
  // The editor is told why and the dialog stays for another try.
  it('makes no asset when the browser gives no tab, and says so', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs(() => null)
    const confirm = await page.openCreate()

    confirm.click()
    await settled()

    expect([tabs.asked().length, server.sent('POST', CREATE).length, page.alerts()]).toEqual([1, 0, [NO_TAB]])
    expect(createDialog()).not.toBeNull()
  })

  /*
   * A tab that is no longer the empty one the page opened belongs
   * to the user, whether they closed it or took it elsewhere.
   * It is neither sent on nor closed.
   */
  const meanwhile: Array<[string, (tab: Tab) => void]> = [
    ['closed', (tab) => tab.close()],
    ['took to another site', (tab) => tab.takenTo(ANOTHER_SITE)],
    ['took to another page of the application', (tab) => tab.takenTo(OF_THE_APPLICATION)],
  ]

  it.each(meanwhile)('makes the asset and leaves alone a tab the user %s meanwhile', async (_what, did) => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const answerCreate = holdCreate()
    const confirm = await page.openCreate()
    confirm.click()
    await settled()
    const tab = tabs.given[0]!
    did(tab)
    const wasClosed = tab.closed

    await answerCreate()

    expect([server.sent('POST', CREATE).length, page.alerts(), createDialog()]).toEqual([1, [CREATED], null])
    expect([tabs.asked().length, tab.sentTo, tab.closed]).toEqual([1, [], wasClosed])
  })

  // A refusal used to close the tab even when it had become a page of the user's.
  it.each(meanwhile.slice(1))('does not close a tab the user %s when the asset is not made', async (_what, did) => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const answerCreate = holdCreate('refused')
    const confirm = await page.openCreate()
    confirm.click()
    await settled()
    did(tabs.given[0]!)

    await answerCreate()

    expect([page.alerts(), tabs.given[0]!.sentTo, tabs.given[0]!.closed]).toEqual([[SYSTEM_ERROR], [], false])
  })

  /*
   * A page closed or reloaded while the asset is made leaves nothing
   * to send the tab on or close it, so the tab would stay empty.
   * The tab goes with the page until the request is answered.
   */
  it('closes the tab that is still empty when the page goes away before the asset is made', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    holdCreate()
    const confirm = await page.openCreate()
    confirm.click()
    await settled()
    expect(tabs.given[0]!.closed).toBe(false)

    pageGoesAway()

    expect([tabs.given[0]!.closed, tabs.given[0]!.sentTo]).toEqual([true, []])
  })

  it('does not close with the page a tab the user took elsewhere', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    holdCreate()
    const confirm = await page.openCreate()
    confirm.click()
    await settled()
    tabs.given[0]!.takenTo(ANOTHER_SITE)

    pageGoesAway()

    expect(tabs.given[0]!.closed).toBe(false)
  })

  // And only until the request is answered: sent on, the tab still says it is empty while the page of the asset comes.
  it('does not close with the page a tab that is on its way to the asset', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const confirm = await page.openCreate()
    confirm.click()
    await settled()
    expect(tabs.given[0]!.sentTo).toHaveLength(1)

    pageGoesAway()

    expect(tabs.given[0]!.closed).toBe(false)
  })

  /*
   * The guard against a second confirm lives in the dialog, which lives in a menu drawn anew each time it opens.
   * Closed while the asset was being made and opened again, it made a
   * second asset, and the tab showed an asset the user had called off.
   */
  it('cannot be closed while the asset is being made, and can be once the request is answered', async () => {
    const page = await openPage(PROVIDED)
    browserOpensTabs()
    const answerCreate = holdCreate('refused')
    const confirm = await page.openCreate()
    const dialog = createDialog()

    confirm.click()
    await settled()
    expect(closeButtons().cancel.disabled).toBe(true)
    closeButtons().cross.click()
    await settled()

    expect([createDialog() === dialog, server.sent('POST', CREATE).length]).toEqual([true, 1])

    await answerCreate()
    expect([page.alerts(), closeButtons().cancel.disabled]).toEqual([[SYSTEM_ERROR], false])
    closeButtons().cross.click()
    await eventually(() => expect(createDialog()).toBeNull())
  })

  /*
   * Escape and a press outside do not close it either.
   * The library sets every dialog up as persistent, so neither ever closes one.
   */
  it('is not closed by Escape nor by a press outside it while the asset is being made', async () => {
    const page = await openPage(PROVIDED)
    browserOpensTabs()
    const answerCreate = holdCreate()
    const confirm = await page.openCreate()
    const dialog = createDialog()!

    confirm.click()
    await settled()
    await dismiss(dialog)

    expect([createDialog() === dialog, server.sent('POST', CREATE).length]).toEqual([true, 1])

    await answerCreate()
    expect([createDialog(), page.alerts()]).toEqual([null, [CREATED]])
  })

  it('asks nothing about metadata that were not saved', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    useAssetDetailStore().metadataAreTouched = true
    expect(useAssetDetailStore().panelHoldsUnsavedMetadata).toBe(true)
    const confirm = await page.openCreate()

    confirm.click()
    await settled()

    expect([questions(), server.sent('POST', CREATE).length, tabs.given[0]!.sentTo.length]).toEqual([[], 1, 1])
  })
})

describe('on the page of the list of DAM', () => {
  it('the edit of a row of the upload queue opens the detail of its asset over the list, and no tab', async () => {
    const page = await openPage(LIST)
    const tabs = browserOpensTabs()

    await page.editUploaded()

    await eventually(() => expect(held()).toBe(UPLOADED))
    expect([tabs.asked(), server.assetReads(UPLOADED), page.at()]).toEqual([[], 1, LIST])
  })

  it('"Create empty asset" opens the detail of the asset it made over the list, and no tab', async () => {
    const page = await openPage(LIST)
    const tabs = browserOpensTabs()
    const confirm = await page.openCreate()

    confirm.click()

    await eventually(() => expect(held()).toBe(NEW))
    expect([tabs.asked(), server.sent('POST', CREATE).length, page.alerts(), createDialog()]).toEqual([
      [],
      1,
      [CREATED],
      null,
    ])
  })

  // By the keyboard the button can be pressed while it spins: each press made an asset.
  it('"Create empty asset" takes one confirm while the asset is being made', async () => {
    const page = await openPage(LIST)
    const answerCreate = holdCreate()
    const confirm = await page.openCreate()

    confirm.click()
    await settled()
    confirm.click()
    await settled()
    await answerCreate()

    await eventually(() => expect(held()).toBe(NEW))
    expect([server.sent('POST', CREATE).length, page.alerts()]).toEqual([1, [CREATED]])
  })
})
