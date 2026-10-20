import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUi } from '@/test/support/uploadUi'

/* The tab of the region of interest of an image while the frame of the library beside it saves a region dragged there,
 * and reads the file the DAM draws anew two seconds after: the frame is busy (`cropperBusy` of the store) until that
 * read is over, and draws the previews of the panel anew after it (`timestampRoiPreviews`). "Refresh previews" drew
 * them anew meanwhile, from before the DAM drew them anew. The real page with the application around it as it starts,
 * in English; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

// The page reads only an asset by a UUID.
const ASSET = '11111111-2222-4333-8444-555555555555'
const ROI = /^\/adm\/v1\/roi\/(roi-of-[^/]+)$/
const ROI_LIST = /^\/adm\/v1\/image\/(file-\d)\/roi$/
const READ_FILE_1 = /^\/adm\/v1\/image\/file-1$/
const ROTATE = /^\/adm\/v1\/image\/file-1\/rotate\/(90|270)$/

/** How many times the server turned each file by 90°, and when it last changed its image: a rotation changes it.
 * `sameSecond`: rotations of one second, which the server marks with the same time. */
let rotations: Record<string, number> = {}
let manipulated: Record<string, string> = {}
let sameSecond = false

const imageFile = (id: string) => {
  const rotation = ((rotations[id] ?? 0) * 90) % 360
  const onItsSide = rotation % 180 !== 0

  return {
    ...assetFile(id, 'processed', { asset: ASSET }),
    _resourceName: 'imageFile',
    imageAttributes: {
      width: onItsSide ? 450 : 800,
      height: onItsSide ? 800 : 450,
      ratioWidth: 16,
      ratioHeight: 9,
      rotation,
      mostDominantColor: '#cccccc',
    },
    manipulatedAt: manipulated[id],
    mainRoute: null,
  }
}

/** The main file turned by the server, which answers with the file turned. */
const rotateOnServer = (): FakeDamAnswer => {
  rotations['file-1'] = (rotations['file-1'] ?? 0) + 1
  manipulated['file-1'] = sameSecond ? 'm2' : 'm' + (rotations['file-1'] + 1)

  return { status: 200, data: imageFile('file-1') }
}

const settled = () => vi.advanceTimersByTimeAsync(100)

type Frame = Element & {
  __vueParentComponent?: { props: { src?: string }; emit: (event: string, ...args: unknown[]) => void }
}
/** The frame of the region, the library's `ACropper`: what it builds of the image in the page happy-dom does not draw,
 * so it is read and moved by its component. */
const frame = () => document.body.querySelector<Frame>('.dam-image-detail__left .a-cropper')

/** The image the frame is given to draw, by its address, or nothing while there is no frame. */
const framed = () => frame()?.__vueParentComponent?.props.src ?? null

/** The region dragged in the frame to the place and size it gives as parts of the image, as the frame commits it. */
const drag = (crop: { x: number; y: number; width: number; height: number }) =>
  frame()!.__vueParentComponent!.emit('commit', crop)

/** The previews of the region, by their addresses. */
const previews = () =>
  Array.from(document.body.querySelectorAll<HTMLImageElement>('.crop-preview img'), (image) =>
    image.getAttribute('src')
  )

const detailOf = (file: string) => `https://dam.test/${file}/detail.jpg?manipulated=`
const previewOf = (file: string) =>
  expect.stringMatching(new RegExp(`^https://dam\\.test/roi-of-${file}/preview\\.jpg\\?timestamp=\\d+$`))

/** The tab of the region opened, in the sidebar of the detail. */
const openFocus = async () => {
  const tab = await eventually(() => {
    const found = document.body.querySelector<HTMLElement>('[data-cy="button-focus"]')
    expect(found).toBeTruthy()

    return found!
  })
  tab.click()
}

/** The page of the asset, its tab of the region open, the frame drawing the main file. */
const openTab = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_regionOfInterest_update'],
    extSystem: { image: { slots: ['default', 'free', 'empty'] } },
  })
  const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push('/assets/' + ASSET)
  await ui.mount(async () => ({ default: RouterView }))
  await openFocus()
  await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm1'))
  await eventually(() => expect(previews()).toHaveLength(1))

  return { ui, held: () => heldBy(ui) }
}

/** What the store of the frame holds: the file, its region, and whether it loads. */
const heldBy = (ui: UploadUi) => {
  const store = ui.library.useDamImageRoiStore()

  return { file: store.imageFile?.id ?? null, roi: store.roi?.id ?? null, loading: store.loader }
}

/** Answers of the server to the reads the pattern matches, held from now on until released one by one. */
const hold = (method: 'GET' | 'PATCH' | 'PUT', pattern: RegExp, answer: (match: RegExpMatchArray) => FakeDamAnswer) => {
  const held: Array<() => void> = []
  server.on(
    method,
    pattern,
    (_request, match) => new Promise<FakeDamAnswer>((resolve) => held.push(() => resolve(answer(match))))
  )

  return held
}

const regionsOf = (file: string): FakeDamAnswer => ({ status: 200, data: { data: [{ id: 'roi-of-' + file }] } })

beforeEach(() => {
  server = createFakeDam()
  rotations = {}
  manipulated = { 'file-1': 'm1', 'file-2': 'm1' }
  sameSecond = false
  server.asset({
    ...assetDetail(ASSET, {
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      licence: 1,
      mainFile: imageFile('file-1'),
    }),
    keywords: [],
    authors: [],
  })
  server.slotsBy(ASSET, () => ({
    data: [
      { id: 'slot-default', slotName: 'default', default: true, main: true, assetFile: imageFile('file-1') },
      { id: 'slot-free', slotName: 'free', default: false, main: false, assetFile: imageFile('file-2') },
      { id: 'slot-empty', slotName: 'empty', default: false, main: false, assetFile: null },
    ],
    totalCount: 3,
  }))
  server.fileBy('image', 'file-1', () => imageFile('file-1'))
  server.fileBy('image', 'file-2', () => imageFile('file-2'))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The one region of each file, with its one preview.
  server.on('GET', ROI_LIST, (_request, match) => regionsOf(match[1]))
  server.on('GET', ROI, (_request, match) => ({
    status: 200,
    data: {
      id: match[1],
      image: match[1].replace('roi-of-', ''),
      pointX: 0,
      pointY: 0,
      percentageWidth: 1,
      percentageHeight: 1,
      links: {
        image_roi_example: [{ url: `https://dam.test/${match[1]}/preview.jpg`, title: '16:9', width: 160, height: 90 }],
      },
    },
  }))
  server.on('PUT', ROI, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('PATCH', ROTATE, rotateOnServer)
})

afterEach(() => {
  stopUploadUi()
})

const REFRESH = 'Refresh previews'
const refreshButton = () => buttonsNamed(document.body, REFRESH)[0] ?? null

describe('the tab of the region of interest while the frame saves a region', () => {
  it('offers no refresh of the previews until the frame has read the file after the save, and draws them anew then', async () => {
    const { ui } = await openTab()
    const saves = hold('PUT', ROI, () => ({ status: 200, data: {} }))
    const before = previews()
    await settled()

    drag({ x: 0, y: 0, width: 0.5, height: 0.5 })
    await settled()
    expect([refreshButton(), ui.library.useDamImageRoiStore().cropperBusy]).toEqual([null, true])

    saves.shift()!()
    await settled()
    expect(refreshButton()).toBeNull()
    expect(previews()).toEqual(before)

    // The file read two seconds after the save: the frame is done, and the previews are drawn anew.
    await vi.advanceTimersByTimeAsync(2000)
    await eventually(() => expect(refreshButton()).not.toBeNull())
    expect(server.sent('GET', READ_FILE_1)).toHaveLength(1)
    expect(previews()).toEqual([previewOf('file-1')])
    expect(previews()).not.toEqual(before)
  })

  // Pressed as the save starts, before the button is gone: its press does nothing then.
  it('draws nothing anew for a press of refresh that comes as the frame starts its save', async () => {
    await openTab()
    hold('PUT', ROI, () => ({ status: 200, data: {} }))
    const before = previews()
    await settled()
    const refresh = refreshButton()!

    drag({ x: 0, y: 0, width: 0.5, height: 0.5 })
    refresh.click()
    await settled()

    expect(previews()).toEqual(before)
  })

  // The guard: with the frame idle the button draws the previews anew, as ever.
  it('draws the previews anew for a press of refresh with the frame idle', async () => {
    await openTab()
    const before = previews()
    await settled()

    refreshButton()!.click()
    await settled()

    expect(previews()).not.toEqual(before)
  })
})
