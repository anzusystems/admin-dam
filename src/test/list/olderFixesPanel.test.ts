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
const MAKE_PRIVATE = /^\/adm\/v1\/image\/file-1\/make-private$/
const MAKE_PUBLIC = /^\/adm\/v1\/image\/file-1\/make-public$/

const UNSAVED = 'Unsaved changes'
const STAY = 'Stay'
const LEAVE = 'Leave anyway'
const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TYPED = 'typed and not saved'
const EDIT_MORE = 'Edit more'

const LIST = '/assets'
const SETTINGS = '/settings'
const UPLOADED = 'asset-9'

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
})

const PUBLISHED = { id: 'route-1', publicUrl: 'https://dam.test/public/file-1' }
const image = (mainRoute: typeof PUBLISHED | null) =>
  onServer('asset-2', {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    mainFile: { ...assetFile('file-1', 'processed', { asset: 'asset-2' }), mainRoute },
  })

let listed: ReturnType<typeof onServer>[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

const standsOut = (button: HTMLButtonElement) => button.classList.contains('v-btn--variant-flat')

const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
const dialogOfList = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const menu = () => document.body.querySelector('.v-menu.v-overlay--active')
const questions = () =>
  Array.from(document.body.querySelectorAll('.v-dialog.v-overlay--active')).filter((dialog) =>
    dialog.textContent?.includes(UNSAVED)
  )
const answer = async (name: typeof STAY | typeof LEAVE) => {
  buttonsNamed(questions()[0], name)[0].click()
  await settled()
}

const openList = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_create', 'dam_asset_update', 'dam_asset_delete', 'dam_image_update'],
    customForm: { video: [customField('title')], image: [customField('title')] },
    queues: { global: [queueRow({ status: 'uploaded', canEditMetadata: true, assetId: UPLOADED, fileId: 'file-9' })] },
  })
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: SETTINGS, component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  await eventually(() => expect(tiles()).toHaveLength(listed.length))
  const queue = () => document.body.querySelector<HTMLElement>('.overlay--sidebar')

  return {
    ...ui,
    page,
    tiles,
    queue,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    pick: async (index: number) => {
      tiles()[index].click()
      await settled()
    },
    pencil: (index: number) => tiles()[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    title: () => panel().querySelector<HTMLTextAreaElement>('textarea')!,
    save: () => buttonsNamed(panel(), 'Save')[0],
    reload: async () => {
      buttonsNamed(page, 'Reload list')[0].click()
      await settled()
    },
    makePrivate: async () => {
      panel().querySelector('.mdi-dots-vertical')!.closest('button')!.click()
      const item = await eventually(() => {
        const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
          (listed) => listed.textContent?.trim() === 'Make private'
        )
        expect(found).toBeTruthy()

        return found!
      })
      item.click()
      await settled()
    },
    editRowOfUploadQueue: async () => {
      document.body.querySelector<HTMLButtonElement>('[data-cy="button-add-description"]')!.click()
      await eventually(() => expect(queue()).not.toBeNull())
      const edit = await eventually(() => {
        const button = buttonsNamed(queue()!, EDIT_MORE)[0]
        expect(button?.disabled).toBe(false)

        return button
      })
      edit.click()
      await settled()
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
    detail: () => {
      const dialog = dialogOfList()
      if (!dialog) return null

      return Array.from(dialog.querySelectorAll('.v-toolbar .text-label-large > div'))
        .map((part) => part.textContent?.trim())
        .join(' ')
    },
    address: () => ui.router.currentRoute.value.path,
  }
}

type List = Awaited<ReturnType<typeof openList>>

const typeInto = async (field: HTMLTextAreaElement) => {
  field.value = TYPED
  field.dispatchEvent(new Event('input'))
  await nextTick()
}

const typedIntoTheSecond = async (list: List) => {
  await list.pick(1)
  await typeInto(list.title())

  return list.title()
}

beforeEach(() => {
  server = createFakeDam()
  listed = ['asset-1', 'asset-2', 'asset-3'].map((id) => onServer(id))
  listed.forEach((asset) => server.asset(asset))
  server.asset(
    onServer(UPLOADED, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      mainFile: assetFile('file-9', 'processed', { asset: UPLOADED }),
    })
  )
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: listed.map((asset) => structuredClone(asset)), hasNextPage: false },
  }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', MAKE_PRIVATE, () => ({ status: 204 }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

const holdSaves = () => {
  const answers: Array<(saved: boolean) => void> = []
  server.on(
    'PATCH',
    BULK,
    (request) =>
      new Promise<FakeDamAnswer>((resolve, reject) =>
        answers.push((saved) =>
          saved ? resolve({ status: 200, data: JSON.parse(request.data as string) }) : reject(httpError(500))
        )
      )
  )

  return (saved: boolean) => {
    answers.shift()!(saved)

    return settled()
  }
}

/*
 * "Save" spins while a save is on its way and can be pressed again.
 * A second save that failed after the first one saved the same form left the form lit and taken as unsaved.
 */
describe('two saves of the form of the panel on their way at once', () => {
  it('leave nothing unsaved when the second one fails after the first saved what both sent', async () => {
    const answerSave = holdSaves()
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await settled()
    list.save().click()
    await settled()
    expect(server.sent('PATCH', BULK)).toHaveLength(2)

    await answerSave(true)
    await answerSave(false)

    expect([list.alerts(), list.title().value, standsOut(list.save())]).toEqual([[UPDATED, SYSTEM_ERROR], TYPED, false])
    await list.pick(2)
    expect([questions(), list.active()]).toEqual([[], [false, false, true]])
  })

  it('leave unsaved what was typed between them when the second one fails', async () => {
    const answerSave = holdSaves()
    const list = await openList()
    await typedIntoTheSecond(list)
    list.save().click()
    await settled()
    list.title().value = 'typed after the first save'
    list.title().dispatchEvent(new Event('input'))
    await nextTick()
    list.save().click()
    await settled()

    await answerSave(true)
    await answerSave(false)

    expect([list.title().value, standsOut(list.save())]).toEqual(['typed after the first save', true])
    await list.pick(2)
    expect(questions()).toHaveLength(1)
  })
})

/*
 * The route change failed while the page asked whether to leave what was typed.
 * The error was shown at once under the question, and on the next page when the page was left.
 * It must be shown only once the page stays, as for a change that went through.
 */
describe('a change of the route of the file of the panel that fails while the page asks whether to leave', () => {
  it.each<[string, typeof STAY | typeof LEAVE, string[], string]>([
    ['"Stay"', STAY, [SYSTEM_ERROR], LIST],
    ['"Leave anyway"', LEAVE, [], SETTINGS],
  ])('is said after %s only while the page is there', async (_answered, answered, alerts, at) => {
    const [first, , third] = listed
    listed = [first, image(PUBLISHED), third]
    server.asset(image(PUBLISHED))
    let refuse: () => void = () => undefined
    server.on(
      'PATCH',
      MAKE_PRIVATE,
      () => new Promise<FakeDamAnswer>((_resolve, reject) => (refuse = () => reject(httpError(500))))
    )
    const list = await openList()
    await typedIntoTheSecond(list)
    await list.makePrivate()
    expect(server.sent('PATCH', MAKE_PRIVATE)).toHaveLength(1)

    void list.router.push(SETTINGS)
    await settled()
    expect(questions()).toHaveLength(1)
    refuse()
    await settled()
    expect(list.alerts()).toEqual([])

    await answer(answered)

    expect([list.alerts(), list.address()]).toEqual([alerts, at])
  })

  it('is said, for "Make public" of its dialog, after "Stay" only', async () => {
    const [first, , third] = listed
    listed = [first, image(null), third]
    server.asset(image(null))
    let refuse: () => void = () => undefined
    server.on(
      'PATCH',
      MAKE_PUBLIC,
      () => new Promise<FakeDamAnswer>((_resolve, reject) => (refuse = () => reject(httpError(500))))
    )
    const list = await openList()
    await typedIntoTheSecond(list)
    panel().querySelector('.mdi-dots-vertical')!.closest('button')!.click()
    const item = await eventually(() => {
      const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (listed) => listed.textContent?.trim() === 'Make public'
      )
      expect(found).toBeTruthy()

      return found!
    })
    item.click()
    const confirm = await eventually(() => {
      const button = document.body.querySelector<HTMLButtonElement>(
        '.v-dialog.v-overlay--active [data-cy="button-confirm"]'
      )
      expect(button).not.toBeNull()

      return button!
    })
    confirm.click()
    await settled()
    expect(server.sent('PATCH', MAKE_PUBLIC)).toHaveLength(1)

    void list.router.push(SETTINGS)
    await settled()
    expect(questions()).toHaveLength(1)
    refuse()
    await settled()
    expect(list.alerts()).toEqual([])

    await answer(STAY)

    expect([list.alerts(), list.address()]).toEqual([[SYSTEM_ERROR], LIST])
  })
})
