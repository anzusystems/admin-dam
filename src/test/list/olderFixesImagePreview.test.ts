import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The card of the preview image of a video, in the Image preview tab of the detail of its asset, reads the image the
 * file holds - again only when the image changes. A read that failed left the card with no picture, and nothing would
 * read that image again: only another image picked, or the detail opened anew. The real page of the list with its real
 * detail, the application around it as it starts; the server is a fake, and so is the address the page asks about a
 * new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const OF_SAVED = /^\/adm\/v1\/image\/image-saved$/

const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const TRY_AGAIN = 'Try again'

const LIST = '/assets'
const VIDEO = 'asset-1'
const FILE = 'video-1'
const SAVED = { imageFile: 'image-saved', position: 0 }

const imageFile = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: 'asset-2' }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
})

const videoFile = () => ({
  ...assetFile(FILE, 'processed', { asset: VIDEO }),
  _resourceName: 'videoFile',
  videoAttributes: { duration: 1000, bitrate: 1000, codecName: 'h264' },
  imagePreview: SAVED,
})

const onServer = () => ({
  ...assetDetail(VIDEO, { attributes: { assetType: 'video', assetStatus: 'with_file' }, mainFile: videoFile() }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** In the place of the watcher of the browser: whatever is watched for coming into view is in view at once, so a
 * picture is drawn with its address. */
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

/** The card: whether it draws the picture of the saved image, and whether it offers to read it again. */
const card = () => ({
  picture: tabOfPreview().querySelector('.v-img__img')?.getAttribute('src')?.includes(SAVED.imageFile) ?? false,
  tryAgain: buttonsNamed(tabOfPreview(), TRY_AGAIN).length === 1,
})

/** The tab of the preview image of the video opened, its card drawn. */
const openPreview = async () => {
  vi.stubGlobal('IntersectionObserver', InView)
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_video_update', 'dam_distribution_access'],
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
  await eventually(() => expect(buttonsNamed(detail()!, 'Unassign image')).toHaveLength(1))

  return ui
}

beforeEach(() => {
  server = createFakeDam()
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
  server.fileBy('video', FILE, videoFile)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the card of the preview image of a video, when its image cannot be read', () => {
  it('offers to read it again, and draws its picture once that read is answered', async () => {
    let down = true
    server.fileBy('image', SAVED.imageFile, () => {
      if (down) throw httpError(500)

      return imageFile(SAVED.imageFile)
    })
    const ui = await openPreview()
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    expect(card()).toEqual({ picture: false, tryAgain: true })

    down = false
    buttonsNamed(tabOfPreview(), TRY_AGAIN)[0].click()
    await settled()

    await eventually(() => expect(card()).toEqual({ picture: true, tryAgain: false }))
    expect([server.sent('GET', OF_SAVED).length, ui.alerts()]).toEqual([2, [SYSTEM_ERROR]])
  })

  // The guard: an image that was read is not offered again.
  it('offers nothing of the kind once the image was read', async () => {
    server.fileBy('image', SAVED.imageFile, () => imageFile(SAVED.imageFile))
    const ui = await openPreview()

    await eventually(() => expect(card()).toEqual({ picture: true, tryAgain: false }))
    expect(ui.alerts()).toEqual([])
  })
})
