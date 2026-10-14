import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The download button of the Info tab of a detail opens a dialog that asks the server for the address of a file of
 * the asset and shows a link to it: of the main file as it opens, and of the file of another slot once the select
 * of the dialog is changed. Each is a request of its own, and they are answered in whatever order. The real page of
 * the list with its real detail, the application around it as it starts; the server is a fake, and so is the address
 * the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DOWNLOAD_LINK = /^\/adm\/v1\/audio\/([^/]+)\/download-link$/

const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const LIST = '/assets'
const ASSET = 'asset-1'
/** The files of the two slots of the asset: of "default", the main one, and of "free". */
const MAIN = 'file-a'
const OTHER = 'file-b'

const signed = (fileId: string) => 'https://storage.test/' + fileId + '?signature=1'

const fileOf = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: ASSET }),
  _resourceName: 'audioFile',
  audioAttributes: { duration: 1000, bitrate: 1000, codecName: 'mp3' },
})

const onServer = () => ({
  ...assetDetail(ASSET, { attributes: { assetType: 'audio', assetStatus: 'with_file' }, mainFile: fileOf(MAIN) }),
  keywords: [],
  authors: [],
})

const slotsOnServer = () => {
  const data = Object.entries({ default: MAIN, free: OTHER }).map(([slotName, fileId]) => ({
    id: 'slot-' + slotName,
    slotName,
    default: slotName === 'default',
    main: fileId === MAIN,
    assetFile: fileOf(fileId),
  }))

  return { data, totalCount: data.length }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const dialog = () => document.body.querySelector<HTMLElement>('.v-dialog [data-cy="delete-panel"]')

/** The dialog: the slot its select says, whether it still waits for an address, and the address of its link. */
const shows = () => ({
  slot: dialog()?.querySelector('.v-select .v-select__selection')?.textContent?.trim() ?? null,
  waiting: !!dialog()?.querySelector('.v-progress-circular'),
  link: dialog()?.querySelector('[data-cy="button-download-file"]')?.getAttribute('href') ?? null,
})

/* Every request for the address of a file is held from now on. Let go by the order they were asked in: answered
 * with the address of the file it asked for, or failed. */
const holdLinks = () => {
  const answers: Array<(went: boolean) => void> = []
  server.on(
    'GET',
    DOWNLOAD_LINK,
    (_request, match) =>
      new Promise<FakeDamAnswer>((resolve, reject) =>
        answers.push((went) =>
          went ? resolve({ status: 200, data: { link: signed(match[1]) } }) : reject(httpError(500))
        )
      )
  )

  return async (asked: number, went = true) => {
    answers[asked](went)
    await settled()
  }
}

/** The dialog opened from the detail of the asset, and its select then set to the slot "free": two requests. */
const openDialogAndPickFree = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_audio_update'],
    extSystem: { audio: { slots: ['default', 'free'] } },
    customForm: { audio: [customField('title')] },
  })
  // The user as the bar of the page draws them.
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
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(1)

    return found
  })
  tiles[0].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(detail()?.querySelector('.anzu-copy-text > span')?.textContent?.trim()).toBe(ASSET))

  detail()!.querySelector<HTMLButtonElement>('[data-cy="button-download"]')!.click()
  await eventually(() => expect(shows().slot).toBe('default'))
  dialog()!
    .querySelector('.v-select .v-field')!
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  const option = await eventually(() => {
    const found = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
      (item) => item.textContent?.trim() === 'free'
    )
    expect(found).toBeTruthy()

    return found!
  })
  option.click()
  await settled()
  expect(server.sent('GET', DOWNLOAD_LINK).map((request) => request.url)).toEqual([
    `/adm/v1/audio/${MAIN}/download-link`,
    `/adm/v1/audio/${OTHER}/download-link`,
  ])

  return ui
}

beforeEach(() => {
  server = createFakeDam()
  server.assetBy(ASSET, onServer)
  server.slotsBy(ASSET, slotsOnServer)
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [onServer()], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/* The link was set by whichever request was answered last, and the spinner stopped by whichever was answered first:
 * under a select that said one slot, the link could be to the file of another. */
describe('the link of the download dialog of a detail, the slot changed while the address of the main file is asked for', () => {
  it('is to the file of the slot picked when the address of the main file is answered last', async () => {
    const answer = holdLinks()
    const ui = await openDialogAndPickFree()

    await answer(1)
    expect(shows()).toEqual({ slot: 'free', waiting: false, link: signed(OTHER) })
    await answer(0)

    expect([shows(), ui.alerts()]).toEqual([{ slot: 'free', waiting: false, link: signed(OTHER) }, []])
  })

  it('is waited for until the address of the file of the slot picked is answered, the one of the main file come first', async () => {
    const answer = holdLinks()
    await openDialogAndPickFree()

    await answer(0)
    expect(shows()).toEqual({ slot: 'free', waiting: true, link: null })
    await answer(1)

    expect(shows()).toEqual({ slot: 'free', waiting: false, link: signed(OTHER) })
  })

  // The guard: a request nobody waits for any more has nothing to say, also when it failed.
  it('is waited for all the same when the address of the main file could not be had, and nothing is said of that', async () => {
    const answer = holdLinks()
    const ui = await openDialogAndPickFree()

    await answer(0, false)
    expect([shows(), ui.alerts()]).toEqual([{ slot: 'free', waiting: true, link: null }, []])
    await answer(1)

    expect([shows(), ui.alerts()]).toEqual([{ slot: 'free', waiting: false, link: signed(OTHER) }, []])
  })

  // The guard: the request asked for last says when it failed, and the dialog stops waiting.
  it('says once that the address of the file of the slot picked could not be had', async () => {
    const answer = holdLinks()
    const ui = await openDialogAndPickFree()

    await answer(0)
    await answer(1, false)

    expect([shows(), ui.alerts()]).toEqual([{ slot: 'free', waiting: false, link: null }, [SYSTEM_ERROR]])
  })
})
