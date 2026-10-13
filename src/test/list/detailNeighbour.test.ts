import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import {
  buttonsNamed,
  customField,
  dialogButton,
  eventually,
  startUploadUi,
  stopUploadUi,
} from '@/test/support/uploadUi'

/* The detail of an asset opened from the list, and the ways from it to its neighbour in the list: the arrow keys,
 * which the list hears on the whole window, and the two buttons of the bar of the detail. The real page of the list
 * with its real detail, the application around it as it starts; the server is a fake, and so is the address the
 * page asks about a new version of the application.
 *
 * The read of the neighbour puts the detail behind its loader: whatever is open over the detail is unmounted with
 * it, and what was typed into the detail is replaced by what the server has. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SERVICE = 'custom_main'
const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const MAKE_PRIVATE = /^\/adm\/v1\/image\/file-1\/make-private$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const LIST = '/assets'

/** An asset the server has, in the list and in its detail: a video unless told otherwise, its title is its id. */
const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

/** What the server has, in the order of the list: three videos, unless a case puts another asset in the place of one. */
let assets: ReturnType<typeof onServer>[] = []
const inThePlaceOfItsVideo = (asset: ReturnType<typeof onServer>) => {
  assets = assets.map((known) => (known.id === asset.id ? asset : known))
  server.asset(asset)
}
const ofType = (assetType: string) => ({ attributes: { assetType, assetStatus: 'with_file' } })

/** The list answers with objects of its own: the page writes into what it was handed. */
const onServerCopy = (asset: ReturnType<typeof onServer>) => structuredClone(asset)

const settled = () => vi.advanceTimersByTimeAsync(100)

/** Past the few seconds in which an asset read a moment ago is not read again. */
const later = () => vi.advanceTimersByTimeAsync(6_000)

const address = () => window.location.pathname

/** What the bar of the detail says: the place of the asset in the list and its title, the place alone under the loader. */
const shown = () =>
  Array.from(document.body.querySelectorAll('.dam-image-detail .v-toolbar .text-label-large > div'))
    .map((part) => part.textContent?.trim())
    .join(' ')

/** An arrow key let go over the element, as the window hears it: over the page itself unless told otherwise. */
const arrow = async (key: typeof RIGHT | typeof LEFT, over: Element = document.body) => {
  over.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

/** How many times the server was asked for each of the assets. */
const reads = (...assetIds: string[]) => assetIds.map((assetId) => server.assetReads(assetId))

/** The page of the list with its three assets, none of them opened. */
const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_distribution_access'],
    extSystem: {
      video: {
        distribution: {
          distributionServices: [SERVICE],
          distributionRequirements: { [SERVICE]: { title: 'Custom service', requiredAuth: false, blockedBy: [] } },
        },
      } as never,
    },
    // A text and a select: the second one opens a menu over the detail.
    customForm: {
      video: [customField('title'), customField('subtitled', { type: 'boolean' })],
      image: [customField('title')],
    },
  })
  const config = ui.library.useDamConfigStore()
  config.damPrvConfig = {
    ...config.damPrvConfig,
    distributionServices: {
      [SERVICE]: {
        title: 'Custom service',
        iconPath: '',
        type: ui.library.DamDistributionServiceType.Custom,
        allowedRedistributeStatuses: [],
      },
    },
  }
  // The form of a distribution to the service, as its load writes it into the store of the library.
  config.damConfigDistributionCustomFormElements.set(SERVICE, [customField('headline')])
  // The user as the bar of the page draws them, with the service on their account.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
    allowedDistributionServices: [SERVICE],
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  /* The page as the router draws it, at its own address: it asks the router about the way out of it. With it the
   * other page the bar of the list links to. */
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll('.dam-image-grid__item')
    expect(found).toHaveLength(3)

    return found
  })

  return { ...ui, page, tiles }
}

/** The detail of one of the three assets, opened by the pencil of its tile: of the second unless told otherwise. */
const openDetail = async (index = 1) => {
  const ui = await openList()
  ui.tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(shown()).toBe(`${index + 1} / 3 asset-${index + 1}`))

  /** The buttons of the bar of the detail: previous, next, the panel of the detail and close. */
  const bar = () => {
    const [previous, next, info, close] = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('.dam-image-detail .v-toolbar button')
    )

    return { previous, next, info, close }
  }
  /** The question about changes that were not saved, while it is open. */
  const question = () =>
    Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).find((dialog) =>
      dialog.textContent?.includes(UNSAVED)
    ) ?? null

  return {
    ...ui,
    shown,
    bar,
    question,
    /** The button of the open question. */
    answer: async (name: typeof STAY | typeof LEAVE) => {
      buttonsNamed(question()!, name)[0].click()
      await settled()
    },
    /** The title in the form of the detail. */
    title: () => document.body.querySelector<HTMLTextAreaElement>('.dam-image-detail textarea')!,
    typeTitle: async (value: string) => {
      const title = document.body.querySelector<HTMLTextAreaElement>('.dam-image-detail textarea')!
      title.value = value
      title.dispatchEvent(new Event('input'))
      await nextTick()
    },
    save: () => document.body.querySelector<HTMLButtonElement>('[data-cy="button-save"]')!,
    /** The switch of the form of the detail with that label. */
    switchNamed: (label: string) =>
      Array.from(document.body.querySelectorAll('.dam-image-detail .v-switch'))
        .find((control) => control.querySelector('label')?.textContent?.trim() === label)
        ?.querySelector<HTMLInputElement>('input') ?? null,
  }
}

type Detail = Awaited<ReturnType<typeof openDetail>>

beforeEach(() => {
  server = createFakeDam()
  assets = ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id))
  assets.forEach((asset) => server.asset(asset))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: assets.map(onServerCopy), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/custom-distribution\/asset-file\/[^/]+\/prepare-payload\/[^/]+$/, () => ({
    status: 200,
    data: { customData: {}, blockedBy: [], publishAt: null },
  }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the arrow keys of the list while the detail of an asset is open', () => {
  it('switch the detail to the neighbour when nothing is open over it, as its two buttons do', async () => {
    const detail = await openDetail()
    expect([detail.bar().previous.disabled, detail.bar().next.disabled, address()]).toEqual([
      false,
      false,
      '/assets/asset-2',
    ])

    // The address is the one of the asset the detail shows.
    await arrow(RIGHT)
    expect([detail.shown(), reads('asset-1', 'asset-3'), address()]).toEqual([
      '3 / 3 asset-3',
      [0, 1],
      '/assets/asset-3',
    ])

    // Over a button of the detail as over the page: the key is heard on the window.
    await arrow(LEFT, detail.bar().info)
    expect([detail.shown(), address()]).toEqual(['2 / 3 asset-2', '/assets/asset-2'])

    detail.bar().previous.click()
    await settled()
    expect([detail.shown(), address()]).toEqual(['1 / 3 asset-1', '/assets/asset-1'])

    detail.bar().next.click()
    await settled()
    expect([detail.shown(), detail.question(), address()]).toEqual(['2 / 3 asset-2', null, '/assets/asset-2'])
  })

  /* The dialog that adds a distribution, its form half filled in and the focus on one of its buttons: neither an
   * input nor a textarea, so the keys were taken for the list. */
  it('do not switch it while a dialog of the detail is open: the dialog stays, with what was typed into it', async () => {
    const detail = await openDetail()
    document.body.querySelector<HTMLButtonElement>('[data-cy="button-distribution"]')!.click()
    const add = await eventually(() => {
      const button = document.body.querySelector<HTMLButtonElement>('[data-cy="add-new-distribution"]')
      expect(button).not.toBeNull()

      return button!
    })
    add.click()
    const dialog = () => document.body.querySelector('.dialog-distribution.v-overlay--active')
    await eventually(() => expect(dialog()).not.toBeNull())
    buttonsNamed(dialog()!, 'Custom service')[0].click()
    const headline = await eventually(() => {
      const field = dialog()?.querySelector<HTMLTextAreaElement>('textarea')
      expect(field).toBeTruthy()

      return field!
    })
    headline.value = 'half filled in'
    headline.dispatchEvent(new Event('input'))
    await nextTick()
    const cancel = dialogButton('Cancel')!
    cancel.focus()

    await arrow(RIGHT, cancel)
    await arrow(LEFT, cancel)

    expect([detail.shown(), reads('asset-1', 'asset-3')]).toEqual(['2 / 3 asset-2', [0, 0]])
    expect([dialog() === null, headline.isConnected, headline.value]).toEqual([false, true, 'half filled in'])

    // Closed, it holds the keys no longer.
    cancel.click()
    await eventually(() => expect(dialog()).toBeNull())
    await arrow(RIGHT)
    expect(detail.shown()).toBe('3 / 3 asset-3')
  })

  // The options of an open select take the focus: the key comes from one of them, not from an input.
  it('do not switch it while a select of the detail has its menu open', async () => {
    const detail = await openDetail()
    const select = document.body.querySelector<HTMLElement>('.dam-image-detail .v-select .v-field')!
    const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
    select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const option = await eventually(() => {
      const found = menu()?.querySelector('.v-list-item')
      expect(found).toBeTruthy()

      return found!
    })

    await arrow(RIGHT, option)
    await arrow(LEFT, option)

    expect([detail.shown(), reads('asset-1', 'asset-3'), menu() === null]).toEqual(['2 / 3 asset-2', [0, 0], false])

    select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await eventually(() => expect(menu()).toBeNull())
    await arrow(LEFT)
    expect(detail.shown()).toBe('1 / 3 asset-1')
  })

  // A tooltip is drawn the way a dialog and a menu are; it shows under the pointer and on a focused button.
  it('switch it while nothing but a tooltip shows', async () => {
    const detail = await openDetail()
    const { info } = detail.bar()
    info.dispatchEvent(new MouseEvent('mouseenter'))
    await eventually(() => expect(document.body.querySelector('.v-tooltip.v-overlay--active')).not.toBeNull())

    await arrow(RIGHT, info)

    expect(detail.shown()).toBe('3 / 3 asset-3')
  })

  // Only the detail is kept from the keys: with none open they pick the neighbour in the list, as they always did.
  it('pick the neighbour in the list while no detail is open, also under an open menu of the page', async () => {
    const list = await openList()
    list.page.querySelector<HTMLButtonElement>('[data-cy="button-main"]')!.click()
    await eventually(() => expect(document.body.querySelector('.v-menu.v-overlay--active')).not.toBeNull())

    await arrow(RIGHT)

    const active = () => Array.from(list.tiles).map((tile) => tile.classList.contains('dam-image-grid__item--active'))
    expect([active(), reads('asset-1', 'asset-2', 'asset-3')]).toEqual([
      [false, true, false],
      [0, 1, 0],
    ])
  })
})

describe('metadata typed into the detail and not saved, when the detail is switched to the neighbour', () => {
  const ways: Array<[string, (detail: Detail) => Promise<void>, string, string[]]> = [
    ['the right arrow key', () => arrow(RIGHT), '3 / 3 asset-3', ['asset-3', 'asset-1']],
    ['the left arrow key', () => arrow(LEFT), '1 / 3 asset-1', ['asset-1', 'asset-3']],
    [
      'the "next" button of the bar',
      async (detail) => {
        detail.bar().next.click()
        await settled()
      },
      '3 / 3 asset-3',
      ['asset-3', 'asset-1'],
    ],
    [
      'the "previous" button of the bar',
      async (detail) => {
        detail.bar().previous.click()
        await settled()
      },
      '1 / 3 asset-1',
      ['asset-1', 'asset-3'],
    ],
  ]

  it.each(ways)(
    'are asked about by %s: "Stay" keeps them, "Leave anyway" switches',
    async (_way, leave, neighbour, ids) => {
      const detail = await openDetail()
      await detail.typeTitle('typed and not saved')

      await leave(detail)

      expect(detail.question()?.textContent).toContain('You have unsaved changes. Are you sure you want to leave?')
      // Nothing was asked of the server yet, and the detail is as it was.
      expect([detail.shown(), reads(...ids)]).toEqual(['2 / 3 asset-2', [0, 0]])

      await detail.answer(STAY)

      expect([detail.question(), detail.shown(), reads(...ids)]).toEqual([null, '2 / 3 asset-2', [0, 0]])
      expect([detail.title().isConnected, detail.title().value]).toEqual([true, 'typed and not saved'])
      expect(server.sent('PATCH', BULK)).toHaveLength(0)

      // They are still not saved: the next try asks again.
      await leave(detail)
      expect(detail.question()).not.toBeNull()

      await detail.answer(LEAVE)

      expect([detail.question(), detail.shown(), reads(...ids)]).toEqual([null, neighbour, [1, 0]])
      expect(detail.title().value).toBe('from the server')
      // Neither answer saves: what was typed is kept in the form, or given up.
      expect(server.sent('PATCH', BULK)).toHaveLength(0)
    }
  )

  it('are not asked about when nothing was typed, nor on the way back from an asset nothing was typed into', async () => {
    const detail = await openDetail()

    await arrow(RIGHT)
    expect([detail.question(), detail.shown()]).toEqual([null, '3 / 3 asset-3'])

    await detail.typeTitle('typed and not saved')
    await arrow(LEFT)
    await detail.answer(LEAVE)
    expect(detail.shown()).toBe('2 / 3 asset-2')

    // What was typed went with the asset it was typed into.
    await arrow(LEFT)
    expect([detail.question(), detail.shown()]).toEqual([null, '1 / 3 asset-1'])
  })

  it('are not asked about once the detail has saved them', async () => {
    const detail = await openDetail()
    await detail.typeTitle('typed and saved')
    detail.save().click()
    await eventually(() => expect(detail.alerts()).toEqual([UPDATED]))

    await arrow(RIGHT)

    expect([detail.question(), detail.shown()]).toEqual([null, '3 / 3 asset-3'])
  })

  it('are asked about after a save the server refused', async () => {
    server.on('PATCH', BULK, () => {
      throw httpError(500)
    })
    const detail = await openDetail()
    await detail.typeTitle('typed and not saved')
    detail.save().click()
    await eventually(() => expect(detail.alerts()).toEqual([SYSTEM_ERROR]))

    await arrow(RIGHT)

    expect([detail.question() === null, detail.shown(), reads('asset-3')]).toEqual([false, '2 / 3 asset-2', [0]])
  })

  // The save sent what the form held as it started: what is typed after that is not in it.
  it('are asked about after a save that went through, for what was typed while it was on the wire', async () => {
    let answer: () => void = () => undefined
    server.on('PATCH', BULK, () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve({ status: 200 }))))
    const detail = await openDetail()
    await detail.typeTitle('typed')
    detail.save().click()
    await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
    await detail.typeTitle('typed while the save was on the wire')
    answer()
    await eventually(() => expect(detail.alerts()).toEqual([UPDATED]))

    await arrow(RIGHT)

    expect([detail.question() === null, detail.shown()]).toEqual([false, '2 / 3 asset-2'])
  })

  // The question is a dialog over the detail as any other: the keys are not the list's while it is open.
  it('are asked about once: an arrow key pressed while the question is open does nothing', async () => {
    const detail = await openDetail()
    await detail.typeTitle('typed and not saved')
    await arrow(RIGHT)
    const stay = buttonsNamed(detail.question()!, STAY)[0]

    await arrow(RIGHT, stay)
    await arrow(LEFT, stay)

    expect(document.body.querySelectorAll('.v-dialog.v-overlay--active')).toHaveLength(2)
    expect([detail.shown(), reads('asset-1', 'asset-3')]).toEqual(['2 / 3 asset-2', [0, 0]])

    // One step, the one that was asked about.
    await detail.answer(LEAVE)
    expect([detail.shown(), reads('asset-1', 'asset-3')]).toEqual(['3 / 3 asset-3', [0, 1]])
  })

  // "Leave anyway" was said, and the detail is behind its loader: the form is not there to be asked about.
  it('are not asked about again while the neighbour is being read', async () => {
    const detail = await openDetail()
    let answer: () => void = () => undefined
    server.assetBy('asset-1', () => new Promise((resolve) => (answer = () => resolve(onServer('asset-1')))))
    // Past the few seconds in which an asset read a moment ago is not read again.
    await vi.advanceTimersByTimeAsync(6_000)
    await detail.typeTitle('typed and not saved')
    await arrow(LEFT)
    await detail.answer(LEAVE)
    expect([detail.question(), reads('asset-1', 'asset-2')]).toEqual([null, [1, 1]])

    await arrow(RIGHT)

    // Back on the asset it was typed into, as the server has it.
    expect([detail.question(), detail.shown(), reads('asset-1', 'asset-2')]).toEqual([null, '2 / 3 asset-2', [1, 2]])
    expect(detail.title().value).toBe('from the server')
    answer()
    await settled()
    expect(detail.shown()).toBe('2 / 3 asset-2')
  })

  it('are asked about one question at a time: whatever else asks while it is open is told to stay', async () => {
    const detail = await openDetail()
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    const store = useAssetDetailStore()
    await detail.typeTitle('typed and not saved')
    await arrow(RIGHT)
    expect(detail.question()).not.toBeNull()

    const told = vi.fn()
    void store.askToLeaveUnsaved().then(told)
    await settled()

    expect(told.mock.calls).toEqual([[false]])
    // The question is still the first one's, and its answer is taken.
    expect([detail.question() === null, detail.shown()]).toEqual([false, '2 / 3 asset-2'])
    await detail.answer(LEAVE)
    expect([detail.shown(), reads('asset-3')]).toEqual(['3 / 3 asset-3', [1]])
  })

  /* The detail reads its asset anew when the address of its file changes. The answer that tells it so can come
   * while the question is open: the request was sent before the question, here the one that makes the file of an
   * image private. Of that read only the file is taken while what was typed is not saved: the form the question is
   * about stays as it is, and so does the question. */
  it('are asked about by a question that stays while the detail takes the file of its asset read anew under it', async () => {
    const published = { id: 'route-1', publicUrl: 'https://dam.test/public/file-1' }
    const image = (mainRoute: typeof published | null) =>
      onServer('asset-2', {
        ...ofType('image'),
        mainFile: { ...assetFile('file-1', 'processed', { asset: 'asset-2' }), mainRoute },
      })
    /** What the card of the file in the detail says of it. */
    const route = () =>
      Array.from(document.body.querySelectorAll('.dam-image-detail .v-chip'))
        .map((chip) => chip.textContent?.trim())
        .filter((text) => text?.startsWith('File is'))
    inThePlaceOfItsVideo(image(published))
    let madePrivate: () => void = () => undefined
    server.on(
      'PATCH',
      MAKE_PRIVATE,
      // As core-dam answers it for an image: 204, with no body.
      () => new Promise<FakeDamAnswer>((resolve) => (madePrivate = () => resolve({ status: 204 })))
    )
    const detail = await openDetail()
    const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
    document.body.querySelector('.dam-image-detail .mdi-dots-vertical')!.closest('button')!.click()
    const makePrivate = await eventually(() => {
      const item = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (found) => found.textContent?.trim() === 'Make private'
      )
      expect(item).toBeTruthy()

      return item!
    })
    makePrivate.click()
    await eventually(() => expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1))
    // The menu stays open over the request, and holds the keys: it is closed as Esc closes it.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await eventually(() => expect(menu()).toBeNull())
    await detail.typeTitle('typed and not saved')
    const typedInto = detail.title()
    await arrow(RIGHT)
    expect(detail.question()).not.toBeNull()
    let answerRead: () => void = () => undefined
    server.assetBy('asset-2', () => new Promise((resolve) => (answerRead = () => resolve(image(null)))))

    madePrivate()
    await settled()

    // The read has begun, with no loader over the form: the question is still there, about the same field.
    expect([detail.question() === null, reads('asset-2', 'asset-3'), route()]).toEqual([
      false,
      [2, 0],
      ['File is public'],
    ])
    expect([detail.title() === typedInto, typedInto.isConnected, typedInto.value]).toEqual([
      true,
      true,
      'typed and not saved',
    ])

    answerRead()
    await settled()

    expect([detail.question() === null, detail.shown(), reads('asset-2', 'asset-3'), route()]).toEqual([
      false,
      '2 / 3 asset-2',
      [2, 0],
      ['File is private'],
    ])
    expect([detail.title() === typedInto, typedInto.value]).toEqual([true, 'typed and not saved'])
    // And it is answered as it was asked: "Stay" keeps what was typed, "Leave anyway" takes the step.
    await detail.answer(STAY)
    expect([detail.question(), detail.shown(), typedInto.isConnected, reads('asset-3')]).toEqual([
      null,
      '2 / 3 asset-2',
      true,
      [0],
    ])
    await arrow(RIGHT)
    await detail.answer(LEAVE)
    expect([detail.question(), detail.shown(), reads('asset-2', 'asset-3')]).toEqual([null, '3 / 3 asset-3', [2, 1]])
  })

  // A read of the detail that begins under the question, as the read of its asset after a bulk save begins.
  it('are asked about by a question that goes when the detail goes behind its loader under it', async () => {
    const detail = await openDetail()
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    await detail.typeTitle('typed and not saved')
    await arrow(RIGHT)
    expect(detail.question()).not.toBeNull()

    useAssetDetailStore().showLoader()
    await settled()

    expect([detail.question(), shown(), reads('asset-3')]).toEqual([null, '2 / 3', [0]])
  })

  // An asset written into the detail without its loader, as the start of the application writes one.
  it('are asked about by a question that goes when an asset is written into the detail under it', async () => {
    const detail = await openDetail()
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    await detail.typeTitle('typed and not saved')
    await arrow(RIGHT)
    expect(detail.question()).not.toBeNull()

    useAssetDetailStore().setAsset(onServer('asset-2') as never)
    await settled()

    expect([detail.question(), detail.shown(), reads('asset-3')]).toEqual([null, '2 / 3 asset-2', [0]])
    expect(detail.title().value).toBe('from the server')
  })

  /* Nothing in the page reaches the X of the detail under the open question; the detail is closed the same way
   * when its asset is deleted meanwhile, and emptied when a read of it fails or the list is mounted anew. The
   * question is drawn in the detail and goes with it, answered "stay": left open, it would be there again the next
   * time a detail opens, about nothing.
   *
   * A closed detail leaves what was typed in the panel beside the list, an emptied one leaves nothing: after the
   * first the pencil of another tile asks a question of its own, which is the page's. */
  it.each<[string, (detail: Detail) => Promise<void>, boolean]>([
    ['closed', async (detail) => detail.bar().close.click(), true],
    [
      'emptied',
      async () => {
        const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
        useAssetDetailStore().reset()
      },
      false,
    ],
  ])(
    'are asked about by a question that goes with the detail %s under it: the next detail opens without it',
    async (_how, gone, typedIsKept) => {
      const detail = await openDetail()
      await detail.typeTitle('typed and not saved')
      await arrow(RIGHT)
      expect(detail.question()).not.toBeNull()

      await gone(detail)
      await settled()

      expect([detail.question(), reads('asset-3')]).toEqual([null, [0]])
      expect(document.body.querySelectorAll('.v-dialog.v-overlay--active')).toHaveLength(0)

      detail.tiles[2].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
      if (typedIsKept) {
        await settled()
        // A question of its own: the old one was answered as the detail closed, and its step is not taken.
        expect([detail.question() === null, reads('asset-3')]).toEqual([false, [0]])
        await detail.answer(LEAVE)
      }
      await eventually(() => expect(detail.shown()).toBe('3 / 3 asset-3'))
      expect([detail.question(), reads('asset-3')]).toEqual([null, [1]])
      // And the ways to the neighbour are open.
      await arrow(LEFT)
      expect([detail.question(), detail.shown()]).toEqual([null, '2 / 3 asset-2'])
    }
  )
})

/* The four switches of the form go out with the same "Save" as the fields: single use with every asset, TTS with an
 * audio, the two "internal" ones with an image that has a file. */
describe('a switch of the form of the detail changed and not saved, when the detail is switched to the neighbour', () => {
  const SINGLE_USE = 'Single-use license'
  const TTS = 'TTS audio'
  const OVERRIDE_INTERNAL = 'Override internal flag'
  const INTERNAL = 'Internal'
  /** An image whose file overrides the "internal" flag: only then can that flag be switched. */
  const overriding = (internal: boolean) => ({
    ...ofType('image'),
    mainFile: assetFile('file-1', 'processed', {
      asset: 'asset-2',
      flags: { singleUse: false, internal, overrideInternal: true },
    }),
  })

  it.each<[string, Record<string, unknown>]>([
    [SINGLE_USE, {}],
    [TTS, ofType('audio')],
    [OVERRIDE_INTERNAL, ofType('image')],
    [INTERNAL, overriding(false)],
  ])('is asked about, and no longer once the detail has saved it: "%s"', async (label, asset) => {
    inThePlaceOfItsVideo(onServer('asset-2', asset))
    const detail = await openDetail()
    expect(detail.switchNamed(label)?.checked).toBe(false)

    detail.switchNamed(label)!.click()
    await nextTick()
    expect(detail.switchNamed(label)?.checked).toBe(true)
    await arrow(RIGHT)

    expect([detail.question() === null, detail.shown(), reads('asset-3')]).toEqual([false, '2 / 3 asset-2', [0]])

    await detail.answer(STAY)
    detail.save().click()
    await eventually(() => expect(detail.alerts()).toEqual([UPDATED]))
    await arrow(RIGHT)

    expect([detail.question(), detail.shown()]).toEqual([null, '3 / 3 asset-3'])
  })

  // The switches are set as the asset is read: that is not a change of them.
  it('is not asked about when the assets are read with their switches on and nobody touched one', async () => {
    inThePlaceOfItsVideo(onServer('asset-2', { ...overriding(true), mainFileSingleUse: true }))
    const synthesized = {
      distributesInServices: [],
      slotNames: [],
      fromRss: false,
      width: 0,
      height: 0,
      ttsAudio: true,
    }
    inThePlaceOfItsVideo(onServer('asset-3', { ...ofType('audio'), assetFileProperties: synthesized }))
    const detail = await openDetail()
    const on = (...labels: string[]) => labels.map((label) => detail.switchNamed(label)?.checked)
    expect(on(SINGLE_USE, OVERRIDE_INTERNAL, INTERNAL)).toEqual([true, true, true])

    await arrow(RIGHT)

    expect([detail.question(), detail.shown(), on(TTS)]).toEqual([null, '3 / 3 asset-3', [true]])

    await arrow(LEFT)

    expect([detail.question(), detail.shown()]).toEqual([null, '2 / 3 asset-2'])
  })
})

/* The list is walked from the active tile to its neighbour: at the last asset that was read there is none to the
 * right, at the first none to the left. Further pages of the list are not read from the detail. */
describe('the detail of the asset at an end of the list', () => {
  it.each<[string, number, typeof RIGHT | typeof LEFT, 'next' | 'previous', 'next' | 'previous']>([
    ['the last', 2, RIGHT, 'next', 'previous'],
    ['the first', 0, LEFT, 'previous', 'next'],
  ])(
    'has nowhere to go from %s: the key and the button do nothing, and ask nothing',
    async (_end, index, key, out, back) => {
      const detail = await openDetail(index)
      const id = `asset-${index + 1}`
      const here = [`${index + 1} / 3 ${id}`, '/assets/' + id]
      const untouched = detail.title()
      expect([detail.bar()[out].disabled, detail.bar()[back].disabled]).toEqual([true, false])

      // However long after the read of the asset: it is not read again, and the detail does not go behind its loader.
      await later()
      await arrow(key)
      detail.bar()[out].click()
      await settled()

      expect([detail.shown(), address(), reads(id), detail.question()]).toEqual([...here, [1], null])
      expect([detail.title() === untouched, untouched.isConnected]).toEqual([true, true])

      // Nor is there anything to ask about metadata that were typed: no step would replace them.
      await detail.typeTitle('typed and not saved')
      await arrow(key)
      detail.bar()[out].click()
      await settled()

      expect([detail.shown(), address(), reads(id), detail.question()]).toEqual([...here, [1], null])
      expect([detail.title() === untouched, untouched.value]).toEqual([true, 'typed and not saved'])

      // The other way is open, and asks as it does anywhere in the list.
      detail.bar()[back].click()
      await settled()
      expect(detail.question()).not.toBeNull()
      await detail.answer(LEAVE)
      expect([detail.shown(), address()]).toEqual(['2 / 3 asset-2', '/assets/asset-2'])
      expect([detail.bar().previous.disabled, detail.bar().next.disabled]).toEqual([false, false])
    }
  )

  // The bar under the loader counts as the bar of the detail does: the first asset is at place one.
  it.each([
    ['first', 0],
    ['second', 1],
  ])('says the place of the %s asset in the list while it is being read', async (_which, index) => {
    const list = await openList()
    const id = `asset-${index + 1}`
    let answer: () => void = () => undefined
    server.assetBy(id, () => new Promise((resolve) => (answer = () => resolve(onServer(id)))))

    list.tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await settled()

    expect([shown(), document.body.querySelector('.dam-image-detail textarea')]).toEqual([`${index + 1} / 3`, null])

    answer()
    await eventually(() => expect(shown()).toBe(`${index + 1} / 3 ${id}`))
  })
})

/* The read of the neighbour fails when its asset was deleted meanwhile, when the user may not read it, when the server
 * is down. The panel and the detail then hold no asset, and the user is told why: with a detail open and with none. */
describe('the read of the neighbour that fails', () => {
  const NO_ASSET = 'No asset selected'
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
  type Opened = Awaited<ReturnType<typeof openList>>
  const active = (list: Opened) =>
    Array.from(list.tiles).map((tile) => tile.classList.contains('dam-image-grid__item--active'))
  /** The second tile picked, with no detail open: the keys go from it to the first and to the third. */
  const pickedSecond = async () => {
    const list = await openList()
    ;(list.tiles[1] as HTMLElement).click()
    await settled()

    return list
  }
  const fails = (assetId: string) =>
    server.assetBy(assetId, () => {
      throw httpError(500)
    })

  // A click on the tile always said so; the keys said nothing, beside a tile picked and a panel with no asset.
  it.each<[string, typeof RIGHT | typeof LEFT, string, boolean[]]>([
    ['the right arrow key', RIGHT, 'asset-3', [false, false, true]],
    ['the left arrow key', LEFT, 'asset-1', [true, false, false]],
  ])('is told with no detail open, after %s: the address is the one of the list still', async (_way, key, id, tile) => {
    const list = await pickedSecond()
    fails(id)

    await arrow(key)

    expect(list.alerts()).toEqual([SYSTEM_ERROR])
    expect([panel().textContent, active(list), address()]).toEqual([NO_ASSET, tile, LIST])
  })

  // The guard: with the detail open it was told already, and the address goes back from the asset to the list.
  it.each<[string, typeof RIGHT | typeof LEFT, string]>([
    ['the right arrow key', RIGHT, 'asset-3'],
    ['the left arrow key', LEFT, 'asset-1'],
  ])(
    'is told with the detail open, after %s: the detail closes and the address is the one of the list',
    async (_way, key, id) => {
      const detail = await openDetail()
      expect(address()).toBe('/assets/asset-2')
      fails(id)

      await arrow(key)

      await eventually(() => expect(detail.alerts()).toEqual([SYSTEM_ERROR]))
      expect([document.body.querySelector('.dam-image-detail-dialog.v-overlay--active'), address()]).toEqual([
        null,
        LIST,
      ])
      expect(panel().textContent).toBe(NO_ASSET)
    }
  )

  // Held keys put several reads on the wire: only the one asked for last has anything to say.
  it('is not told when another asset was asked for since: the panel holds that one', async () => {
    const list = await pickedSecond()
    let fail: () => void = () => undefined
    server.assetBy('asset-3', () => new Promise((_resolve, reject) => (fail = () => reject(httpError(500)))))

    await arrow(RIGHT)
    await arrow(LEFT)
    fail()
    await settled()

    expect([list.alerts(), active(list), reads('asset-2', 'asset-3')]).toEqual([[], [false, true, false], [1, 1]])
    expect(panel().querySelector('.anzu-copy-text > span')?.textContent).toBe('asset-2')
  })

  // The page the user is on the way to has nothing to do with it; the page of the list is still drawn until that one loads.
  it('is not told once the user is on the way to another page', async () => {
    const list = await pickedSecond()
    let fail: () => void = () => undefined
    server.assetBy('asset-3', () => new Promise((_resolve, reject) => (fail = () => reject(httpError(500)))))
    let arrive: () => void = () => undefined
    list.router.beforeEach(() => new Promise<void>((resolve) => (arrive = resolve)))

    await arrow(RIGHT)
    void list.router.push('/settings')
    await settled()
    expect(list.tiles[0].isConnected).toBe(true)
    fail()
    await settled()

    expect([list.alerts(), address()]).toEqual([[], LIST])
    arrive()
    await settled()
    expect([list.alerts(), list.router.currentRoute.value.path]).toEqual([[], '/settings'])
  })
})
