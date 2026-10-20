import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The edit of a row of the upload queue and "Create empty asset" open the detail of their asset over the list of
 * DAM. Both are drawn on the page of the list of an external provider too, which draws only the detail of the
 * provider: there the asset is opened on its own page, in a new tab of the browser, and the page stays as it is. The
 * row knows its asset and opens the tab at its address. The create button has no asset until the server made one: it
 * opens an empty tab as it is pressed, cut off from the page at once, and sends that tab on once there is an asset,
 * or closes it when there is none - while the tab is still the empty one it opened. Until then the tab goes with
 * the page, and the dialog cannot be closed.
 * The real pages of the two lists with the real menu, create dialog and upload queue, the application around them as
 * it starts; the server is a fake, and so are the address the page asks about a new version of the application and
 * the tabs of the browser - what a browser does with a tab is not seen here. */

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
/** The asset of the row of the upload queue: an image the list does not hold. */
const UPLOADED = 'asset-9'
/** The asset the server makes. */
const NEW = 'asset-new'

/** An asset the server has, in the list and in its detail: a video unless told otherwise, its title is its id. */
const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The open detail of an asset of DAM, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** The asset the open detail holds, as the file panel of its form says it. */
const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

/** The questions about changes that were not saved that are open. */
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

/** The dialog of "Create empty asset", or null while it is not open. */
const createDialog = () => document.body.querySelector<HTMLElement>('[data-cy="create-panel"]')

/** Where a tab is that the user took to another site: such a tab does not say. */
const ANOTHER_SITE = null
/** A page of the application the user took a tab to. */
const OF_THE_APPLICATION = 'http://localhost:3000/assets'

/** A tab of the browser, as the page that opened it holds it: opened empty. */
const newTab = () => {
  /** Where the tab was sent, each time with whether it could reach the page that opened it by then. */
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
    /** The user takes the tab elsewhere, by its address bar. */
    takenTo: (to: string | null) => {
      address = to
    },
  }

  return tab
}

type Tab = ReturnType<typeof newTab>

/** The browser opens tabs from now on: what it was asked for each, and the tabs it gave. */
const browserOpensTabs = (give: () => Tab | null = newTab) => {
  const given: Array<Tab | null> = []
  const open = vi.fn<(...asked: unknown[]) => Tab | null>(() => {
    given.push(give())

    return given.at(-1) ?? null
  })
  vi.stubGlobal('open', open)

  return { asked: () => open.mock.calls, given }
}

/** The two ways a dialog of Vuetify is dismissed by, beside its own buttons: Escape, and a press outside it. */
const dismiss = async (dialog: Element) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await settled()
  const scrim = dialog.closest('.v-overlay')!.querySelector<HTMLElement>('.v-overlay__scrim')!
  scrim.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  scrim.click()
  await settled()
}

/** The request that makes the asset is held from now on: answered, with the asset or with a refusal, by what this
 * gives back. */
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

/** The page is on its way out - closed, or reloaded - as the browser tells it. */
const pageGoesAway = () => window.dispatchEvent(new Event('pagehide'))

/** The two buttons that close the dialog of "Create empty asset": the cross of its bar, and "Cancel". */
const closeButtons = () => ({
  cross: createDialog()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!,
  cancel: createDialog()!.querySelector<HTMLButtonElement>('button[data-cy="button-cancel"]')!,
})

/** An asset with no file yet, as the server makes one. */
const created = () => onServer(NEW, { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null })

/** What the detail of DAM holds in its store: the asset, and whether it is open. */
const inDetailStore = async () => {
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const store = useAssetDetailStore()

  return [store.asset?.id ?? null, store.detail]
}

/** One of the two pages, as the router draws it, with one uploaded asset in the upload queue. */
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
  // The provider, as the config of the ext system names it.
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  // The user as the bar of the page draws them, with the provider on their account.
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
  // The list of the page has answered: three assets of DAM, none of the provider.
  await eventually(() =>
    address === LIST
      ? expect(page.querySelectorAll('.dam-image-grid__item')).toHaveLength(3)
      : expect(page.textContent).toContain('No matching assets found')
  )
  /** The queue drawn over the whole page, or null while none is. */
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

  return {
    ...ui,
    queue,
    /** Where the router is: the address of the page it draws. */
    at: () => ui.router.currentRoute.value.path,
    /** The edit of the row of the upload queue, from the queue drawn over the whole page: pressed. */
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
    /** "Create empty asset" of the menu of the page: the "Create" button of the dialog that asks which kind. */
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
  // Without `noopener`, which gives no tab back either way: the tab is cut off as it is given.
  it('opens the page of the asset of the row in a new tab that has no way back, and reads nothing here', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()

    await page.editUploaded()

    expect([tabs.asked(), tabs.given[0]!.opener]).toEqual([[['/assets/' + UPLOADED, '_blank']], null])
    // The page is as it was: its queue drawn, nothing read for a detail it does not draw, and nothing written into it.
    expect([page.at(), page.queue() !== null, server.assetReads(UPLOADED), await inDetailStore()]).toEqual([
      PROVIDED,
      true,
      0,
      [null, false],
    ])
  })

  /* The detail of DAM is emptied as the page of the list of DAM is left, so nothing of it is held here. Were it held,
   * there would still be nothing of this page the asset of the row could replace: the question is not asked, and on
   * this page nothing would draw it. */
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
    // The page is as it was: nothing is written into a detail it does not draw.
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

  /* Taken to another site while the asset is being made, a tab that could still reach the page that opened it
   * would keep that way for good: it is cut off while it is still the empty page it was opened as. */
  it('cuts the tab off from this page as it opens it, with nothing waited for', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs()
    holdCreate()
    const confirm = await page.openCreate()

    confirm.click()

    expect([tabs.asked().length, tabs.given[0]!.opener]).toEqual([1, null])
  })

  // Made, it would have nothing to be shown in: the editor is told why, and the dialog stays for another try.
  it('makes no asset when the browser gives no tab, and says so', async () => {
    const page = await openPage(PROVIDED)
    const tabs = browserOpensTabs(() => null)
    const confirm = await page.openCreate()

    confirm.click()
    await settled()

    expect([tabs.asked().length, server.sent('POST', CREATE).length, page.alerts()]).toEqual([1, 0, [NO_TAB]])
    expect(createDialog()).not.toBeNull()
  })

  /* A tab that is no more the empty one the page opened is the user's: whatever they closed it for, or took it to,
   * it is neither sent on nor closed. */
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

  // A refusal closed whatever the tab was by then: a page of the user's.
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

  /* A page closed or reloaded while the asset is being made has nothing left that would send the tab on or close it:
   * the tab would stay empty for good. It goes with the page until the request is answered. */
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

  // The guard of the case above: only the empty tab goes with the page.
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

  /* What holds a second confirm back lives in the dialog, and the dialog in a menu that is drawn anew each time it is
   * opened: closed while the asset was being made and opened again, it made a second asset - and the tab showed an
   * asset the user had called off. */
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

  /* Nor by the two ways a dialog is dismissed without its buttons: the dialogs of the application are persistent, as
   * the library sets every dialog up, and neither Escape nor a press outside closes one - at any time. */
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

  // The same as for the row of the queue: nothing of this page is replaced, and nothing here would draw the question.
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

/* The page of the list of DAM draws the detail of an asset: there both open it, as they did. */
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
