import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const CREATE = /^\/adm\/v1\/asset\/licence\/1$/
const OTHER_LICENCE = /^\/adm\/v1\/asset-licence\/2$/
const CURRENT_USER = /^\/adm\/users\/current$/
const PROVIDER = 'provider-1'
const PROVIDER_LIST = /^\/adm\/v1\/asset-external-provider\/provider-1\/search$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const EDIT = 'Edit more'
const UPDATED = 'Record was updated'
const CREATED = 'Record was created'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const FROM_SERVER = 'from the server'
const CHANGE_LICENCE = 'Switch Media Library ext system and asset licence'

const LIST = '/assets'
const SETTINGS = '/settings'
const PROVIDED = '/external-providers/' + PROVIDER
const UPLOADED = 'asset-9'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const reads = () => ['asset-1', 'asset-2', 'asset-3', UPLOADED].map((assetId) => server.assetReads(assetId))

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

const held = () => detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )

const answer = async (name: typeof STAY | typeof LEAVE) => {
  buttonsNamed(questions()[0], name)[0].click()
  await settled()
}

const dialogOf = (text: string) =>
  Array.from(document.body.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active')).find((dialog) =>
    dialog.textContent?.includes(text)
  ) ?? null

const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

const openList = async () => {
  const uploaded: UploadQueueItem[] = [
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' }),
  ]
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: uploaded },
  })
  const config = ui.library.useDamConfigStore()
  const extSystem = config.damConfigExtSystem.get(1) as unknown as Record<string, unknown>
  extSystem.assetExternalProviders = { [PROVIDER]: { title: 'Provider' } }
  config.damPrvConfig = {
    ...config.damPrvConfig,
    settings: { ...config.damPrvConfig.settings, allowSelectExtSystem: true, allowSelectLicenceId: true },
  }
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    userToExtSystemsDto: [{ id: 1, name: 'Ext system' }],
    assetLicencesDto: [
      { id: 1, name: 'Licence', extSystem: 1 },
      { id: 2, name: 'Other licence', extSystem: 1 },
    ],
    allowedAssetExternalProviders: [PROVIDER],
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  /*
   * The page is drawn by the router at its own address, because it asks the router about the way out of it.
   * The pages linked from the list bar and the external provider list page are added too.
   */
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  const Provided = (await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetListView.vue'))
    .default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: SETTINGS, component: { render: () => null } })
  ui.router.addRoute({ path: '/not-found', component: { render: () => null } })
  ui.router.addRoute({
    path: '/external-providers/:provider',
    name: '/(coreDam)/external-providers/[provider]',
    component: Provided,
  })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(3))
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')
  const menuItem = async (mark: string) => {
    if (!document.body.querySelector('[data-cy="' + mark + '"]')) {
      page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    }

    return eventually(() => {
      const item = document.body.querySelector<HTMLElement>('[data-cy="' + mark + '"]')
      expect(item).not.toBeNull()

      return item!
    })
  }

  return {
    ...ui,
    page,
    tiles,
    queue,
    at: () => ui.router.currentRoute.value.path,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')!,
    save: () => buttonsNamed(panel(), 'Save')[0],
    openUploadQueue: () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()

      return eventually(() => expect(queue()).not.toBeNull())
    },
    openMassEdit: async (index: number) => {
      tiles()[index].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
      const open = await eventually(() => {
        const footer = document.body.querySelector('.asset-footer__selected')
        const button = footer ? buttonsNamed(footer, 'Edit')[0] : undefined
        expect(button).toBeTruthy()

        return button!
      })
      open.click()
      await eventually(() => expect(queue()).not.toBeNull())
    },
    editRow: async () => {
      const edit = await eventually(() => {
        const button = queue() ? buttonsNamed(queue()!, EDIT)[0] : undefined
        expect(button?.disabled).toBe(false)

        return button!
      })
      edit.click()
      await settled()
    },
    openCreate: async () => {
      ;(await menuItem('button-main-empty-asset')).click()

      return eventually(() => {
        const dialog = document.body.querySelector<HTMLElement>('[data-cy="create-panel"]')
        expect(dialog).not.toBeNull()

        return dialog!
      })
    },
    openLicenceChange: async () => {
      ;(await menuItem('button-switch-licence')).click()
      const dialog = await eventually(() => {
        const open = dialogOf(CHANGE_LICENCE)
        expect(open).not.toBeNull()

        return open!
      })
      const licence = Array.from(dialog.querySelectorAll<HTMLElement>('.v-select'))[1]
      licence.querySelector('.v-field')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      const other = await eventually(() => {
        const option = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
          (item) => item.textContent?.trim() === 'Other licence'
        )
        expect(option).toBeTruthy()

        return option!
      })
      other.click()
      await settled()

      return dialog
    },
    followMenuLink: async (mark: string) => {
      ;(await menuItem(mark)).click()
      await settled()
    },
    goTo: async (address: string) => {
      // Not awaited before the clock moves: an open Vuetify dialog or menu holds every navigation back by a timer.
      void ui.router.push(address)
      await settled()
    },
    goBack: async () => {
      ui.router.back()
      await settled()
    },
    /**
     * The back button as the app hears it: the router first, then
     * everything else listening to `popstate` on the window.
     * Every Vuetify dialog and menu keeps its own `popstate` watch. The
     * state is the one of the history entry the browser goes back to.
     */
    goBackInTheBrowser: async (state: Record<string, unknown> = {}) => {
      ui.router.back()
      // The router guards run up to the Vuetify guard, which waits a moment for the event below.
      for (let turn = 0; turn < 50; turn++) await Promise.resolve()
      window.dispatchEvent(new PopStateEvent('popstate', { state }))
      await settled()
    },
  }
}

type List = Awaited<ReturnType<typeof openList>>

const typeInto = async (field: HTMLTextAreaElement, value = TYPED) => {
  field.value = value
  field.dispatchEvent(new Event('input'))
  await nextTick()
}

const typedIntoTheSecond = async (list: List) => {
  await list.pick(1)
  await typeInto(list.title())

  return list.title()
}

const typedIsKept = (list: List, typedInto: HTMLTextAreaElement) =>
  expect([list.title() === typedInto, typedInto.isConnected, typedInto.value, standsOut(list.save())]).toEqual([
    true,
    true,
    TYPED,
    true,
  ])

const closeDetail = async () => {
  detail()!.querySelector('.v-toolbar .mdi-close')!.closest('button')!.click()
  await eventually(() => expect(detail()).toBeNull())
}

let reload: ReturnType<typeof vi.spyOn>

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
  server.on('GET', OTHER_LICENCE, () => ({ status: 200, data: { id: 2, name: 'Other licence', extSystem: 1 } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', PROVIDER_LIST, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', CURRENT_USER, () => ({ status: 200, data: { id: 7 } }))
  server.on('POST', CREATE, () => ({
    status: 201,
    data: onServer('asset-new', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: null }),
  }))
  // The window and its address are shared by the whole file.
  // It must not be reloaded under the cases.
  window.history.replaceState(null, '', LIST)
  reload = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined)
})

afterEach(() => {
  reload.mockRestore()
  stopUploadUi()
})

/*
 * Editing a queue row reads the row's asset into the detail, which is where the panel reads from.
 * It always reads, also when the asset is the one the panel holds.
 */
describe('metadata typed into the panel beside the list and not saved, when a row of a queue is edited', () => {
  it.each<[string, (list: List) => Promise<void>, string, number]>([
    ['the upload queue', (list) => list.openUploadQueue(), UPLOADED, 3],
    ['the mass edit', (list) => list.openMassEdit(2), 'asset-3', 2],
  ])(
    'are asked about by the edit of a row of %s: "Stay" keeps them, "Leave anyway" opens it',
    async (_of, open, id, read) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)
      await open(list)
      const before = { asked: server.requests.length, reads: reads() }

      await list.editRow()

      expect([questions().length, detail(), server.requests.length - before.asked]).toEqual([1, null, 0])
      typedIsKept(list, typedInto)

      await answer(STAY)

      expect([questions(), detail(), list.queue() === null, server.requests.length - before.asked]).toEqual([
        [],
        null,
        false,
        0,
      ])
      typedIsKept(list, typedInto)

      await list.editRow()
      expect([questions().length, server.requests.length - before.asked]).toEqual([1, 0])
      await answer(LEAVE)

      await eventually(() => expect(held()).toBe(id))
      expect([questions(), reads()[read] - before.reads[read], server.sent('PATCH', BULK)]).toEqual([[], 1, []])
    }
  )

  it('are asked about also when the row is of the asset the panel holds: its edit reads that asset anew', async () => {
    const list = await openList()
    await list.openUploadQueue()
    await list.editRow()
    await eventually(() => expect(held()).toBe(UPLOADED))
    await closeDetail()
    await typeInto(list.title())
    const typedInto = list.title()
    expect(reads()).toEqual([0, 0, 0, 1])

    await list.editRow()

    expect([questions().length, detail(), reads()]).toEqual([1, null, [0, 0, 0, 1]])
    await answer(STAY)
    typedIsKept(list, typedInto)

    await list.editRow()
    await answer(LEAVE)
    await eventually(() => expect(held()).toBe(UPLOADED))
    expect([reads(), detail()!.querySelector<HTMLTextAreaElement>('textarea')!.value]).toEqual([
      [0, 0, 0, 2],
      FROM_SERVER,
    ])
  })

  // The answer can take its time. The queue goes on under the question meanwhile.
  it('are kept when the row is of another asset by the time "Leave anyway" is said: nothing is read', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    await list.openUploadQueue()
    await list.editRow()
    expect(questions()).toHaveLength(1)

    list.rows.global[0].assetId = 'asset-3'
    await answer(LEAVE)

    expect([questions(), detail(), reads()]).toEqual([[], null, [0, 1, 0, 0]])
    typedIsKept(list, typedInto)
  })

  it('are not there to be asked about when nothing was typed: the detail of the row opens at once', async () => {
    const list = await openList()
    await list.pick(1)
    await list.openUploadQueue()

    await list.editRow()

    await eventually(() => expect(held()).toBe(UPLOADED))
    expect([questions(), reads()]).toEqual([[], [0, 1, 0, 1]])
  })
})

describe('metadata typed into the panel beside the list and not saved, when an empty asset is created', () => {
  const confirm = async (dialog: HTMLElement) => {
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
    await settled()
  }

  it('are asked about as the dialog is confirmed: "Stay" sends nothing, "Leave anyway" creates the asset', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const dialog = await list.openCreate()
    expect(questions()).toEqual([])

    await confirm(dialog)

    expect([questions().length, server.sent('POST', CREATE), dialog.isConnected]).toEqual([1, [], true])
    typedIsKept(list, typedInto)

    await answer(STAY)

    expect([questions(), server.sent('POST', CREATE), dialog.isConnected, detail()]).toEqual([[], [], true, null])
    expect(dialog.querySelector('button[data-cy="button-confirm"]')).not.toBeNull()
    typedIsKept(list, typedInto)

    await confirm(dialog)
    expect(questions()).toHaveLength(1)
    await answer(LEAVE)

    await eventually(() => expect(held()).toBe('asset-new'))
    expect([questions(), server.sent('POST', CREATE).length, list.alerts()]).toEqual([[], 1, [CREATED]])
  })

  it('are not there to be asked about when nothing was typed: the asset is created at once', async () => {
    const list = await openList()
    await list.pick(1)

    await confirm(await list.openCreate())

    await eventually(() => expect(held()).toBe('asset-new'))
    expect([questions(), server.sent('POST', CREATE).length]).toEqual([[], 1])
  })
})

describe('metadata typed into the panel beside the list and not saved, when the page of the list is left', () => {
  const waysOut: Array<[string, (list: List) => Promise<void>, string]> = [
    ['a link of the menu of the page', (list) => list.followMenuLink('button-settings'), SETTINGS],
    ['a link of the application', (list) => list.goTo(PROVIDED), PROVIDED],
    ['the way back in the history', (list) => list.goBack(), '/'],
    ['the back button of the browser, with nothing open over the page', (list) => list.goBackInTheBrowser(), '/'],
  ]

  it.each(waysOut)(
    'are asked about by %s: "Stay" keeps the page, "Leave anyway" leaves it',
    async (_way, go, address) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)
      const asked = server.requests.length

      await go(list)

      expect(questions()).toHaveLength(1)
      expect(questions()[0].textContent).toContain('You have unsaved changes. Are you sure you want to leave?')
      expect([list.at(), list.tiles().length, server.requests.length - asked]).toEqual([LIST, 3, 0])

      await answer(STAY)

      expect([questions(), list.at(), list.active(), server.requests.length - asked]).toEqual([
        [],
        LIST,
        [false, true, false],
        0,
      ])
      typedIsKept(list, typedInto)

      await go(list)
      expect([questions().length, list.at()]).toEqual([1, LIST])
      await answer(LEAVE)

      expect([questions(), list.at(), list.tiles(), server.sent('PATCH', BULK)]).toEqual([[], address, [], []])
    }
  )

  it('are not there to be asked about when nothing was typed, nor once the panel has saved them', async () => {
    const list = await openList()
    await list.pick(1)

    await list.goTo(SETTINGS)
    expect([questions(), list.at()]).toEqual([[], SETTINGS])

    await list.goBack()
    await eventually(() => expect(list.tiles()).toHaveLength(3))
    await typedIntoTheSecond(list)
    list.save().click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))
    await list.goTo(SETTINGS)
    expect([questions(), list.at()]).toEqual([[], SETTINGS])
  })

  /*
   * Over an open dialog or menu the back button is no way out:
   * Vuetify calls the navigation off with a guard for each of them.
   * Dialogs of this app stay as they are because the library makes every dialog persistent. A menu closes.
   * The page asks after those guards, so nothing is left to ask about.
   */
  it.each<[string, boolean]>([
    ['with metadata typed into it', true],
    ['with nothing typed', false],
  ])(
    'are not asked about by the back button of the browser over an open detail, %s: nothing moves',
    async (_how, typed) => {
      const list = await openList()
      list.pencil(1).click()
      await eventually(() => expect(held()).toBe('asset-2'))
      const title = detail()!.querySelector<HTMLTextAreaElement>('textarea')!
      if (typed) await typeInto(title)
      const asked = server.requests.length

      await list.goBackInTheBrowser()
      await settled()

      expect([questions(), list.at(), held(), server.requests.length - asked]).toEqual([[], LIST, 'asset-2', 0])
      expect([title.isConnected, title.value]).toEqual([true, typed ? TYPED : FROM_SERVER])
      await list.goBackInTheBrowser()
      expect([questions(), list.at(), held()]).toEqual([[], LIST, 'asset-2'])
    }
  )

  it('are not asked about by the back button of the browser over an open menu of the page, which closes it', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
    list.page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    await eventually(() => expect(menu()).not.toBeNull())

    await list.goBackInTheBrowser()

    await eventually(() => expect(menu()).toBeNull())
    expect([questions(), list.at(), list.tiles().length]).toEqual([[], LIST, 3])
    typedIsKept(list, typedInto)
    await list.goBackInTheBrowser()
    expect([questions().length, list.at()]).toEqual([1, LIST])
  })

  /*
   * Vuetify leaves the way back alone when the history entry it leads
   * to was written by `replace`, as the first page of a session is.
   * The page would then be left with its detail open. The question is the detail's own dialog over it.
   */
  it('are asked about by the back button over an open detail where that would leave the page', async () => {
    const list = await openList()
    list.pencil(1).click()
    await eventually(() => expect(held()).toBe('asset-2'))
    const typedInto = detail()!.querySelector<HTMLTextAreaElement>('textarea')!
    await typeInto(typedInto)

    await list.goBackInTheBrowser({ replaced: true })

    expect([questions().length, list.at(), held()]).toEqual([1, LIST, 'asset-2'])
    expect(document.body.querySelectorAll('.v-dialog.v-overlay--active')).toHaveLength(2)
    await answer(STAY)
    expect([questions(), list.at(), held(), typedInto.isConnected, typedInto.value]).toEqual([
      [],
      LIST,
      'asset-2',
      true,
      TYPED,
    ])

    await list.goBackInTheBrowser({ replaced: true })
    await answer(LEAVE)
    expect([questions(), list.at(), list.tiles()]).toEqual([[], '/', []])
  })

  it.each([LIST + '?page=2', LIST + '#top'])(
    'are not asked about by a navigation that keeps the page: %s',
    async (to) => {
      const list = await openList()
      const typedInto = await typedIntoTheSecond(list)

      await list.goTo(to)

      expect([questions(), list.router.currentRoute.value.fullPath, list.tiles().length]).toEqual([[], to, 3])
      typedIsKept(list, typedInto)
    }
  )

  // The question belongs to the list page.
  // Pages after it ask nothing, whatever the detail is left holding.
  it('are not asked about on the pages that come after the list', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.goTo(SETTINGS)
    await answer(LEAVE)
    expect(list.at()).toBe(SETTINGS)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    useAssetDetailStore().metadataAreTouched = true

    await list.goTo('/')

    expect([list.at(), useAssetDetailStore().leaveUnsavedQuestion]).toEqual(['/', false])
  })

  /*
   * The detail's address and the list address given back on close
   * are written over the page address without a router navigation.
   * Nothing is left by them.
   */
  it('are not asked about by the address of a detail opened over them, nor by the one it gives back', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)

    buttonsNamed(panel(), EDIT)[0].click()
    await eventually(() => expect(held()).toBe('asset-2'))

    expect([questions(), window.location.pathname, list.at()]).toEqual([[], '/assets/asset-2', LIST])
    expect(detail()!.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe(TYPED)

    await closeDetail()

    expect([questions(), window.location.pathname, list.at()]).toEqual([[], LIST, LIST])
    typedIsKept(list, typedInto)
  })

  it('are asked about once: a way out of the page under an open question stays', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.pick(2)
    expect(questions()).toHaveLength(1)

    await list.goTo(SETTINGS)

    expect([questions().length, list.at(), reads()]).toEqual([1, LIST, [0, 1, 0, 0]])
    await answer(LEAVE)
    expect([questions(), list.at(), list.active(), reads()]).toEqual([[], LIST, [false, false, true], [0, 1, 1, 0]])
  })
})

/*
 * A reload or closed window is no navigation the page can hold.
 * The browser is told to ask its own question while there is something to lose.
 */
describe('metadata typed and not saved, when the window is reloaded or closed', () => {
  it('make the browser ask first, from the panel beside the list and from the detail alike', async () => {
    const list = await openList()
    expect(windowAsksBeforeItGoes()).toBe(false)
    await list.pick(1)
    expect(windowAsksBeforeItGoes()).toBe(false)

    await typeInto(list.title())
    expect(windowAsksBeforeItGoes()).toBe(true)

    buttonsNamed(panel(), EDIT)[0].click()
    await eventually(() => expect(held()).toBe('asset-2'))
    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  it('do not make it ask once they are saved', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    expect(windowAsksBeforeItGoes()).toBe(false)
  })

  it('do not make it ask once the page of the list is left, whatever its detail is left holding', async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.goTo(SETTINGS)
    await answer(LEAVE)
    expect(list.at()).toBe(SETTINGS)
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    expect(useAssetDetailStore().panelHoldsUnsavedMetadata).toBe(false)

    useAssetDetailStore().metadataAreTouched = true

    expect([useAssetDetailStore().panelHoldsUnsavedMetadata, windowAsksBeforeItGoes()]).toEqual([true, false])
  })
})

/*
 * The licence is changed in a dialog of the page menu.
 * The page is reloaded once the server accepts the change, and everything the page holds goes with it.
 */
describe('metadata typed into the panel beside the list and not saved, when the licence is changed', () => {
  const confirm = async (dialog: HTMLElement) => {
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()
    await settled()
  }
  const sent = () => [server.sent('GET', OTHER_LICENCE).length, server.sent('PATCH', CURRENT_USER).length]

  it('are asked about as the change is confirmed: "Stay" sends nothing, "Leave anyway" changes it and reloads', async () => {
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const dialog = await list.openLicenceChange()
    expect(questions()).toEqual([])
    const askedOnReload: boolean[] = []
    reload.mockImplementation(() => void askedOnReload.push(windowAsksBeforeItGoes()))

    await confirm(dialog)

    expect([questions().length, sent(), reload.mock.calls, dialog.isConnected]).toEqual([1, [0, 0], [], true])
    typedIsKept(list, typedInto)

    await answer(STAY)

    expect([questions(), sent(), reload.mock.calls, dialogOf(CHANGE_LICENCE) === dialog]).toEqual([
      [],
      [0, 0],
      [],
      true,
    ])
    expect(dialog.textContent).toContain('Other licence')
    typedIsKept(list, typedInto)

    await confirm(dialog)
    expect(questions()).toHaveLength(1)
    await answer(LEAVE)

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect([questions(), sent(), list.alerts()]).toEqual([[], [1, 1], [UPDATED]])
    expect(JSON.parse(server.sent('PATCH', CURRENT_USER)[0].data as string)).toEqual({ selectedLicence: 2 })
    // The answer was given to the page's question, so the browser does not ask again on the reload.
    expect(askedOnReload).toEqual([false])
  })

  it('are kept when the server refuses the change after "Leave anyway": nothing is reloaded', async () => {
    server.on('PATCH', CURRENT_USER, () => {
      throw httpError(500)
    })
    const list = await openList()
    const typedInto = await typedIntoTheSecond(list)
    const dialog = await list.openLicenceChange()

    await confirm(dialog)
    await answer(LEAVE)

    await eventually(() => expect(list.alerts()).toEqual([SYSTEM_ERROR]))
    expect([sent(), reload.mock.calls, dialogOf(CHANGE_LICENCE) === dialog]).toEqual([[1, 1], [], true])
    typedIsKept(list, typedInto)
    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  it('are not there to be asked about when nothing was typed: the licence is changed at once', async () => {
    const list = await openList()
    await list.pick(1)

    await confirm(await list.openLicenceChange())

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect([questions(), sent()]).toEqual([[], [1, 1]])
  })
})

/*
 * The upload queue, create button and licence dialog are drawn on every
 * page with the app bar, including the external provider list page.
 * The unsaved-changes question exists only on the DAM list page. The DAM detail is emptied when that page is
 * left, so elsewhere there is nothing to ask about and nothing to draw a question that would be waited for.
 * On the provider page, a queue row asset and a newly created asset open in a
 * new browser tab, which is a fake here (`externalProviderNewTab.test.ts`).
 */
describe('the page of the list of an external provider, come to from metadata typed and not saved', () => {
  const onTheProviderPage = async () => {
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.goTo(PROVIDED)
    await answer(LEAVE)
    expect([list.at(), questions()]).toEqual([PROVIDED, []])
    await eventually(() => expect(list.page.textContent).toContain('No matching assets found'))

    return list
  }

  it('creates an empty asset at once: nothing is asked, and nothing waits for an answer', async () => {
    const list = await onTheProviderPage()
    vi.stubGlobal('open', () => ({
      opener: window,
      closed: false,
      close: () => undefined,
      location: { href: 'about:blank', replace: () => undefined },
    }))

    const dialog = await list.openCreate()
    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()

    await eventually(() => expect(server.sent('POST', CREATE)).toHaveLength(1))
    expect(questions()).toEqual([])
  })

  it('opens the asset of a row of the upload queue at once', async () => {
    const list = await onTheProviderPage()
    const open = vi.fn<(...asked: unknown[]) => null>(() => null)
    vi.stubGlobal('open', open)
    await list.openUploadQueue()

    await list.editRow()

    expect([questions(), reads(), open.mock.calls.length]).toEqual([[], [0, 1, 0, 0], 1])
  })

  it('changes the licence at once', async () => {
    const list = await onTheProviderPage()
    const dialog = await list.openLicenceChange()

    dialog.querySelector<HTMLButtonElement>('button[data-cy="button-confirm"]')!.click()

    await eventually(() => expect(reload).toHaveBeenCalledTimes(1))
    expect([questions(), server.sent('PATCH', CURRENT_USER).length]).toEqual([[], 1])
  })
})
