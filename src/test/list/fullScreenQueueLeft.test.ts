import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The mass edit of the list of DAM, the selection of the list of an external provider and the upload queue are drawn
 * over the whole page, and Vuetify keeps the back and forward buttons of the browser from leaving a page from under
 * them - except onto an entry of the history where ADAM was loaded or reloaded, which vue-router writes by `replace`.
 * Left from under a selection that way, the next page drew the dialog over the whole of it, empty, with no button and
 * no strip: only a reload helped. A selection drawn over the whole page is put back into its strip as its page goes,
 * and the answer of its "save and finish" leaves the next page alone. The upload queue is the same on both lists, and
 * is drawn over the next one, whole, as it always was. The two real pages of the lists, as the application draws
 * them, with their real strips and queues; the server is a fake, and so is the address the page asks about a new
 * version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/
const PROVIDER_ASSET = /^\/adm\/v1\/asset-external-provider\/provider-1\/(provided-\d)$/

const LIST = '/assets'
const PROVIDED = '/external-providers/' + PROVIDER

const UPDATED = 'Record was updated'
const SAVE_AND_FINISH = 'Save and finish'

const DAM_TITLES = ['asset-1', 'asset-2', 'asset-3']
const PROVIDED_TITLES = ['provided-1', 'provided-2', 'provided-3']

const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'image', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

/** An image of the provider. */
const provided = (id: string) => ({
  id,
  texts: { displayTitle: id },
  attributes: { assetType: 'image' },
  url: 'https://provider.test/' + id + '.jpg',
  metadata: {},
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const FULL_SCREEN = '.v-dialog--fullscreen'

/** The dialog over the whole page, or null while none is drawn. */
const fullScreen = () => document.body.querySelector<HTMLElement>(FULL_SCREEN)

/** The questions about changes that were not saved that are open. */
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes('Unsaved changes')
  )

/** The title in the form of the panel beside the list. */
const panelTitle = () => document.body.querySelector<HTMLTextAreaElement>('.v-navigation-drawer--right textarea')

/** The bulk save of metadata is held from now on: answered, as the server answers it, by what this gives back. */
const holdBulkSave = () => {
  let answer: () => Promise<unknown> = async () => undefined
  server.on(
    'PATCH',
    BULK,
    (request) =>
      new Promise<FakeDamAnswer>((resolve) => {
        answer = () => {
          resolve({ status: 200, data: JSON.parse(request.data as string) })

          return settled()
        }
      })
  )

  return () => answer()
}

/** "Save and finish" of the queue drawn over the whole page, pressed once it can be: its save is sent. */
const saveAndFinish = async (queue: () => HTMLElement | null) => {
  const button = await eventually(() => {
    const found = buttonsNamed(queue()!, SAVE_AND_FINISH)[0]
    expect(found?.disabled).toBe(false)

    return found
  })
  button.click()
  await settled()
  expect(server.sent('PATCH', BULK)).toHaveLength(1)
}

/** What says where each queue is drawn: the dialog over the whole page, the selection of DAM, the selection of the
 * provider, the upload. */
const positions = async () => {
  const { useMainWrapper } = await import('@/domains/system/composables/useMainWrapper')
  const { useAssetFooterSelectedView } = await import('@/domains/coreDam/asset/composables/assetFooterSelected')
  const { useExternalProviderAssetFooterSelectedView } =
    await import('@/domains/coreDam/asset/composables/externalProviderAssetFooterSelected')
  const { useAssetFooterUploadView } = await import('@/domains/coreDam/asset/composables/assetFooterUpload')

  return [
    useMainWrapper().customDialog.value,
    useAssetFooterSelectedView().footerViewSelected.value,
    useExternalProviderAssetFooterSelectedView().externalProviderFooterViewSelected.value,
    useAssetFooterUploadView().footerViewUpload.value,
  ]
}

/** The page of the list of DAM with its three assets, one uploaded asset in the upload queue, and the page of the list
 * of the provider beside it. */
const openList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: 'asset-9', fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_assetExternalProvider_access'],
    customForm: { image: [customField('title')] },
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
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push(LIST)
  // As `App.vue` draws the pages: each address its own page.
  const Pages = defineComponent({
    setup: () => {
      const route = useRoute()

      return () => h(RouterView, { key: route.path })
    },
  })
  const page = await ui.mount(async () => ({ default: Pages }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  /** The titles of the tiles drawn: whose list it is. */
  const titles = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  await eventually(() => expect(titles()).toEqual(DAM_TITLES))
  /** The queue drawn over the whole page, or null while none is. */
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
  /** The strip of the page under its list, with the strip of the selection in it, or null while it is not drawn. */
  const strip = () => page.querySelector<HTMLElement>('.v-app-bar .asset-footer__selected')

  /** The tile picked by a click with Ctrl. */
  const pick = (index: number) => {
    tiles()[index].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))

    return settled()
  }
  /** The tile picked, and the selection opened over the whole page by the button of its strip. */
  const openSelection = async (index: number, button: string) => {
    await pick(index)
    const open = await eventually(() => {
      const found = strip() ? buttonsNamed(strip()!, button)[0] : undefined
      expect(found).toBeTruthy()

      return found!
    })
    open.click()
    await eventually(() => expect(queue()).not.toBeNull())
  }

  return {
    ...ui,
    page,
    titles,
    queue,
    strip,
    /** Where the router is: the address of the page it draws. */
    at: () => ui.router.currentRoute.value.path,
    pick,
    /** A click on the tile: its asset is read into the panel beside the list. */
    click: (index: number) => {
      tiles()[index].click()

      return settled()
    },
    /** Which tiles are picked for the mass edit. */
    picked: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--selected')),
    /** The user goes where the address says, as a link of the application takes them, and its list is drawn. */
    goTo: async (address: string) => {
      void ui.router.push(address)
      await settled()
      await eventually(() => expect(titles()).toEqual(address === LIST ? DAM_TITLES : PROVIDED_TITLES))
    },
    /**
     * The back button of the browser onto an entry of the history where ADAM was loaded or reloaded, as the
     * application hears it: the router first, then whatever else listens to `popstate` on the window. The state of
     * that entry says it was written by `replace`, as vue-router writes the entry of every load. Answers whether a
     * dialog over the whole page was put into the page on the way, also one taken out again at once.
     */
    backToALoadedEntry: async () => {
      let drawn = false
      const note = (records: MutationRecord[]) => {
        for (const record of records) {
          for (const node of Array.from(record.addedNodes)) {
            if (node instanceof Element && (node.matches(FULL_SCREEN) || node.querySelector(FULL_SCREEN))) drawn = true
          }
        }
      }
      const watcher = new MutationObserver(note)
      watcher.observe(document.body, { childList: true, subtree: true })
      ui.router.back()
      // The guards of the router run up to the one of Vuetify that waits a moment for the event below.
      for (let turn = 0; turn < 50; turn++) await Promise.resolve()
      window.dispatchEvent(new PopStateEvent('popstate', { state: { replaced: true } }))
      await settled()
      note(watcher.takeRecords())
      watcher.disconnect()

      return drawn
    },
    /** The mass edit of the list of DAM drawn over the whole page, with the tile picked for it. */
    openMassEdit: (index: number) => openSelection(index, 'Edit'),
    /** The selection of the list of the provider drawn over the whole page, with the tile picked for it. */
    openProviderSelection: (index: number) => openSelection(index, 'View more'),
    /** The upload queue drawn over the whole page, as its "Add description" button draws it. */
    openUploadQueue: () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()

      return eventually(() => expect(queue()).not.toBeNull())
    },
    /** The upload queue put away into its strip, at its smallest, by its "hide" button. */
    putUploadQueueAway: async () => {
      queue()!.querySelector('.mdi-chevron-down')!.closest('button')!.click()
      await eventually(() => expect(queue()).toBeNull())
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  for (const id of DAM_TITLES) server.asset(onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: DAM_TITLES.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', PROVIDER_LIST, () => ({
    status: 200,
    data: { data: PROVIDED_TITLES.map(provided), hasNextPage: false },
  }))
  server.on('GET', PROVIDER_ASSET, (_request, match) => ({ status: 200, data: provided(match[1]) }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('a queue drawn over the whole page, left by the back button of the browser', () => {
  it('the selection of a provider: the list of DAM draws its own strip, and so does the provider when come back to', async () => {
    const list = await openList()
    await list.goTo(PROVIDED)
    await list.openProviderSelection(0)
    expect(await positions()).toEqual([true, 'hidden', 'full', 'hidden'])

    const drawnOnTheWay = await list.backToALoadedEntry()

    expect([drawnOnTheWay, list.at(), list.titles(), fullScreen()]).toEqual([false, LIST, DAM_TITLES, null])
    expect(await positions()).toEqual([false, 'hidden', 'hidden', 'hidden'])
    expect(list.strip()?.className).toContain('asset-footer__selected--hidden')

    await list.goTo(PROVIDED)

    expect([fullScreen(), list.picked()]).toEqual([null, [false, false, false]])
    expect(list.strip()?.className).toContain('asset-footer__selected--hidden')
  })

  it('the mass edit of DAM: the page of the provider draws its own strip, and the upload stays where it was put away', async () => {
    const list = await openList()
    await list.goTo(PROVIDED)
    await list.goTo(LIST)
    await list.openUploadQueue()
    await list.putUploadQueueAway()
    await list.openMassEdit(2)
    expect(await positions()).toEqual([true, 'full', 'hidden', 'minimal'])

    const drawnOnTheWay = await list.backToALoadedEntry()

    expect([drawnOnTheWay, list.at(), list.titles(), fullScreen()]).toEqual([false, PROVIDED, PROVIDED_TITLES, null])
    expect(await positions()).toEqual([false, 'hidden', 'hidden', 'minimal'])
    expect(list.strip()?.className).toContain('asset-footer__selected--hidden')

    await list.goTo(LIST)

    expect([fullScreen(), list.picked()]).toEqual([null, [false, false, false]])
    expect(list.strip()?.className).toContain('asset-footer__selected--hidden')
  })

  // As before the step that put the selections back into their strips: the upload is not the page's.
  it.each<[string, string, string]>([
    ['the list of DAM', LIST, PROVIDED],
    ['the page of a provider', PROVIDED, LIST],
  ])(
    'the upload queue, left from %s: drawn whole over the next list, and put away from there',
    async (_from, from, to) => {
      const list = await openList()
      await list.goTo(PROVIDED)
      if (from === LIST) await list.goTo(LIST)
      await list.openUploadQueue()
      expect(await positions()).toEqual([true, 'hidden', 'hidden', 'full'])

      await list.backToALoadedEntry()

      expect([list.at(), list.titles()]).toEqual([to, to === LIST ? DAM_TITLES : PROVIDED_TITLES])
      expect(await positions()).toEqual([true, 'hidden', 'hidden', 'full'])
      // Its row and its buttons, not an empty card.
      const queue = list.queue()!
      expect([buttonsNamed(queue, 'Edit more').length, buttonsNamed(queue, SAVE_AND_FINISH).length]).toEqual([1, 1])

      await list.putUploadQueueAway()

      expect([fullScreen(), await positions()]).toEqual([null, [false, 'hidden', 'hidden', 'minimal']])
      expect(list.strip()).not.toBeNull()
    }
  )

  /* "Save and finish" of the mass edit empties it and puts it away once the server answers: not when its page was left
   * meanwhile, where the lists share the mass edit and the next one has been picked anew. */
  it('the mass edit of DAM saved and finished: its answer after the page was left keeps what the next page picked', async () => {
    const answer = holdBulkSave()
    const list = await openList()
    await list.goTo(PROVIDED)
    await list.goTo(LIST)
    await list.openMassEdit(2)
    await saveAndFinish(list.queue)

    await list.backToALoadedEntry()
    await list.pick(0)
    expect([list.at(), list.picked(), list.strip()?.className]).toEqual([
      PROVIDED,
      [true, false, false],
      expect.stringContaining('asset-footer__selected--compact'),
    ])

    await answer()

    expect(list.alerts()).toEqual([UPDATED])
    expect([list.picked(), list.strip()?.textContent]).toEqual([
      [true, false, false],
      expect.stringContaining('Selected files: 1'),
    ])
    expect(list.strip()?.className).toContain('asset-footer__selected--compact')
    expect(await positions()).toEqual([false, 'hidden', 'compact', 'hidden'])
  })

  // A way out that still asks, and is called off then, leaves the page where it was: the mass edit is finished there.
  it('the mass edit of DAM saved and finished: its answer while a way out asks, called off, empties it and puts it away', async () => {
    const answer = holdBulkSave()
    const list = await openList()
    // What is typed into the panel beside the list and not saved is asked about before the page is left.
    await list.click(1)
    const typedInto = panelTitle()!
    typedInto.value = 'typed and not saved'
    typedInto.dispatchEvent(new Event('input'))
    await settled()
    await list.openMassEdit(2)
    await saveAndFinish(list.queue)

    await list.backToALoadedEntry()
    expect([questions().length, list.at()]).toEqual([1, LIST])
    await answer()
    buttonsNamed(questions()[0], 'Stay')[0].click()
    await settled()

    expect(list.alerts()).toEqual([UPDATED])
    expect([questions(), list.at(), fullScreen(), list.picked()]).toEqual([[], LIST, null, [false, false, false]])
    expect(await positions()).toEqual([false, 'hidden', 'hidden', 'hidden'])
    expect(list.strip()?.className).toContain('asset-footer__selected--hidden')
    expect([panelTitle() === typedInto, typedInto.value]).toEqual([true, 'typed and not saved'])
  })

  /* "Save and finish" of the upload queue stops it and hides it once the server answers. Put away meanwhile, it holds
   * the view over the whole page no more: a selection drawn there since stays. */
  it('the upload queue saved and finished: its answer once it was put away leaves the mass edit opened since', async () => {
    const answer = holdBulkSave()
    const list = await openList()
    await list.openUploadQueue()
    await saveAndFinish(list.queue)
    await list.putUploadQueueAway()
    await list.openMassEdit(2)
    expect(await positions()).toEqual([true, 'full', 'hidden', 'minimal'])

    await answer()

    expect(list.alerts()).toEqual([UPDATED])
    expect(await positions()).toEqual([true, 'full', 'hidden', 'hidden'])
    expect([fullScreen() === null, list.queue()?.textContent]).toEqual([
      false,
      expect.stringContaining('Selected files: 1'),
    ])
  })
})
