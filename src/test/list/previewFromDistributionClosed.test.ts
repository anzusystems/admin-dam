import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The dialog that picks a video preview image from a distribution frame sets it by
 * a request. The preview card in the detail reads its file again once it is set.
 * The dialog can be closed while the request is on its way. The card must be read again when it is answered.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const FROM_DISTRIBUTION = /^\/adm\/v1\/video\/([^/]+)\/distribution-preview\/([^/]+)$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const LIST = '/assets'
const VIDEO = 'asset-1'
const OF_VIDEO = 'video-1'
const SAVED = 'image-saved'
const OF_DISTRIBUTION = 'image-of-distribution'

let preview = SAVED

const imageFile = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: 'asset-2' }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
})

const videoFile = () => ({
  ...assetFile(OF_VIDEO, 'processed', { asset: VIDEO }),
  _resourceName: 'videoFile',
  videoAttributes: { duration: 1000, bitrate: 1000, codecName: 'h264' },
  imagePreview: { imageFile: preview, position: 0 },
})

const onServer = () => ({
  ...assetDetail(VIDEO, { attributes: { assetType: 'video', assetStatus: 'with_file' }, mainFile: videoFile() }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/**
 * Replaces the browser's `IntersectionObserver`: anything watched is in view at once, so pictures get their address.
 */
class InView {
  private readonly seen: IntersectionObserverCallback

  constructor(seen: IntersectionObserverCallback) {
    this.seen = seen
  }

  observe(target: Element) {
    queueMicrotask(() => this.seen([{ isIntersecting: true, target } as IntersectionObserverEntry], this as never))
  }

  unobserve() {}

  disconnect() {}
}

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const tabOfPreview = () => detail()!.querySelector<HTMLElement>('.sidebar-info__content')!
const dialog = () =>
  document.body
    .querySelector<HTMLElement>('.v-dialog.v-overlay--active .dam-image-grid--special')
    ?.closest<HTMLElement>('.v-overlay')

const picture = () => {
  const src = tabOfPreview().querySelector('.v-img__img')?.getAttribute('src') ?? ''

  return [SAVED, OF_DISTRIBUTION].find((fileId) => src.includes(fileId)) ?? 'none'
}

const fileReads = () => server.sent('GET', /^\/adm\/v1\/video\/[^/]+$/).length

const holdSet = () => {
  let answer: (set: boolean) => void = () => undefined
  server.on(
    'PATCH',
    FROM_DISTRIBUTION,
    () =>
      new Promise<FakeDamAnswer>((resolve, reject) => {
        answer = (set) => {
          if (!set) {
            reject(httpError(500))

            return
          }
          preview = OF_DISTRIBUTION
          resolve({ status: 200, data: videoFile() })
        }
      })
  )

  return async (set = true) => {
    answer(set)
    await settled()
  }
}

const holdFileRead = () => {
  let letGo: () => void = () => undefined
  let asked = false
  server.fileBy('video', OF_VIDEO, () => {
    if (asked) return videoFile()
    asked = true
    const asRead = videoFile()

    return new Promise((resolve) => (letGo = () => resolve(asRead)))
  })

  return async () => {
    letGo()
    await settled()
  }
}

const confirmAndClose = async () => {
  vi.stubGlobal('IntersectionObserver', InView)
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_video_update', 'dam_distribution_access'],
    extSystem: { video: { slots: ['default'] } },
    customForm: { video: [customField('title')] },
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
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tile = await eventually(() => {
    const found = page.querySelector<HTMLElement>('.dam-image-grid__item')
    expect(found).not.toBeNull()

    return found!
  })
  tile.querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(detail()?.querySelector('[data-cy="button-image-preview"]')).toBeTruthy())
  detail()!.querySelector<HTMLElement>('[data-cy="button-image-preview"]')!.click()
  await eventually(() => expect(picture()).toBe(SAVED))

  buttonsNamed(detail()!, 'Choose from distribution')[0].click()
  const frame = await eventually(() => {
    const found = dialog()?.querySelector<HTMLElement>('.dam-image-grid__item')
    expect(found).toBeTruthy()

    return found!
  })
  frame.click()
  await settled()
  buttonsNamed(dialog()!, 'Confirm')[0].click()
  await settled()
  buttonsNamed(dialog()!, 'Cancel')[0].click()
  await eventually(() => expect(dialog()).toBeFalsy())

  return ui
}

beforeEach(() => {
  server = createFakeDam()
  preview = SAVED
  server.assetBy(VIDEO, onServer)
  server.slotsBy(VIDEO, () => ({
    data: [{ id: 'slot-default', slotName: 'default', default: true, main: true, assetFile: videoFile() }],
    totalCount: 1,
  }))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [onServer()], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.fileBy('video', OF_VIDEO, videoFile)
  for (const fileId of [SAVED, OF_DISTRIBUTION]) server.fileBy('image', fileId, () => imageFile(fileId))
  server.on('GET', /^\/adm\/v1\/video\/([^/]+)\/distribution-preview$/, () => ({
    status: 200,
    data: {
      data: [{ id: 'distribution-1', service: 'youtube', url: 'https://storage.test/frame.jpg' }],
      hasNextPage: false,
    },
  }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

/*
 * The card was told by an event of the dialog, and Vue drops what an unmounted component emits.
 * "updated" was emitted, and the card kept showing the old image.
 */
describe('the preview image of a video picked from a distribution, the dialog closed while it is being set', () => {
  it('is shown by the card once it is set', async () => {
    const set = holdSet()
    const ui = await confirmAndClose()
    const before = fileReads()

    await set()
    await eventually(() => expect(picture()).toBe(OF_DISTRIBUTION))

    expect([ui.alerts(), fileReads()]).toEqual([[UPDATED], before + 1])
  })

  /*
   * The detail tabs are drawn anew when switched.
   * The card drawn in place of the one that opened the dialog read the
   * file before the image was set, and the gone card was the one told.
   */
  it('is shown by the card drawn anew meanwhile, whose own read of the file was asked before the image was set', async () => {
    const set = holdSet()
    const ui = await confirmAndClose()
    const fileRead = holdFileRead()
    detail()!.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
    await settled()
    detail()!.querySelector<HTMLElement>('[data-cy="button-image-preview"]')!.click()
    await settled()

    await set()
    await fileRead()
    await eventually(() => expect(picture()).toBe(OF_DISTRIBUTION))

    expect(ui.alerts()).toEqual([UPDATED])
  })

  it('leaves the card as it was when it could not be set, and says so', async () => {
    const set = holdSet()
    const ui = await confirmAndClose()
    const before = fileReads()

    await set(false)
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))

    expect([picture(), fileReads()]).toEqual([SAVED, before])
  })
})
