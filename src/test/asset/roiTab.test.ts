import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The tab of the region of interest of an image, on the page of its asset: the panel of the tab reads the file of a
 * slot and its region, and the frame of the library beside it draws them - the frame is drawn first, as the tab opens,
 * and both take one store, the library's. The previews are reloaded, the image is rotated and another slot is chosen
 * there. The real page with the application around it as it starts, in English; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

// The page reads only an asset by a UUID.
const ASSET = '11111111-2222-4333-8444-555555555555'
const ROI = /^\/adm\/v1\/roi\/(roi-of-[^/]+)$/
const READ_FILE_1 = /^\/adm\/v1\/image\/file-1$/
const ROTATE = /^\/adm\/v1\/image\/file-1\/rotate\/(90|270)$/

/** When the server last changed the image of each file: a rotation changes it. */
let manipulated: Record<string, string> = {}

const imageFile = (id: string) => ({
  ...assetFile(id, 'processed', { asset: ASSET }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
  manipulatedAt: manipulated[id],
  mainRoute: null,
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The image the frame of the region is given to draw, by its address, or nothing while there is no frame. Read from
 * the component of the frame, the library's `ACropper`: what it builds of the image in the page happy-dom does not draw. */
const framed = () => {
  const frame = document.body.querySelector('.dam-image-detail__left .a-cropper') as
    | (Element & { __vueParentComponent?: { props: { src?: string } } })
    | null

  return frame?.__vueParentComponent?.props.src ?? null
}

/** The previews of the region, by their addresses. */
const previews = () =>
  Array.from(document.body.querySelectorAll<HTMLImageElement>('.crop-preview img'), (image) =>
    image.getAttribute('src')
  )

const detailOf = (file: string) => `https://dam.test/${file}/detail.jpg?manipulated=`

/** The page of the asset, its tab of the region open, the frame drawing the main file. */
const openTab = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_regionOfInterest_update'],
    extSystem: { image: { slots: ['default', 'free'] } },
  })
  const View = (await import('@/domains/coreDam/asset/components/detail/AssetDetailView.vue')).default
  ui.router.addRoute({ path: '/assets/:id', name: '/(coreDam)/assets/[id]', component: View })
  await ui.router.push('/assets/' + ASSET)
  await ui.mount(async () => ({ default: RouterView }))
  const tab = await eventually(() => {
    const found = document.body.querySelector<HTMLElement>('[data-cy="button-focus"]')
    expect(found).toBeTruthy()

    return found!
  })
  tab.click()
  await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm1'))
  await eventually(() => expect(previews()).toHaveLength(1))

  return ui
}

/** The slot chosen in the select of the tab. */
const chooseSlot = async (name: string) => {
  document.body
    .querySelector('.dam-image-detail__sidebar .v-select .v-field')!
    .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  const option = await eventually(() => {
    const found = Array.from(document.body.querySelectorAll<HTMLElement>('.v-menu .v-list-item')).find(
      (item) => item.textContent?.trim() === name
    )
    expect(found).toBeTruthy()

    return found!
  })
  option.click()
}

const rotate = () => document.body.querySelector<HTMLButtonElement>('[data-cy="button-rotate-right"]')!.click()

beforeEach(() => {
  server = createFakeDam()
  manipulated = { 'file-1': 'm1', 'file-2': 'm1' }
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
    ],
    totalCount: 2,
  }))
  server.fileBy('image', 'file-1', () => imageFile('file-1'))
  server.fileBy('image', 'file-2', () => imageFile('file-2'))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The one region of each file, with its one preview.
  server.on('GET', /^\/adm\/v1\/image\/(file-\d)\/roi$/, (_request, match) => ({
    status: 200,
    data: { data: [{ id: 'roi-of-' + match[1] }] },
  }))
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
  server.on('PATCH', ROTATE, () => {
    manipulated['file-1'] = manipulated['file-1'] === 'm1' ? 'm2' : 'm3'

    return { status: 200, data: {} }
  })
})

afterEach(() => {
  stopUploadUi()
})

describe('the tab of the region of interest of an image', () => {
  it('draws in the frame the image of the main file, and the previews of its region', async () => {
    await openTab()

    expect(framed()).toBe(detailOf('file-1') + 'm1')
    expect(previews()).toEqual([
      expect.stringMatching(/^https:\/\/dam\.test\/roi-of-file-1\/preview\.jpg\?timestamp=\d+$/),
    ])
  })

  it('reloads its previews, the frame left as it is', async () => {
    await openTab()
    const before = previews()
    await settled()

    buttonsNamed(document.body, 'Refresh previews')[0]!.click()
    await settled()

    expect(previews()).toHaveLength(1)
    expect(previews()).not.toEqual(before)
    expect(framed()).toBe(detailOf('file-1') + 'm1')
  })

  it('draws a rotated image in the frame, and reads its region and its previews anew', async () => {
    await openTab()
    const before = previews()
    const roiReads = server.sent('GET', ROI).length
    await settled()

    rotate()

    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm2'))
    expect(server.sent('PATCH', ROTATE)).toHaveLength(1)
    expect(server.sent('GET', ROI)).toHaveLength(roiReads + 1)
    expect(previews()).toHaveLength(1)
    expect(previews()).not.toEqual(before)
  })

  it('draws the image of another slot in the frame, with the previews of its region', async () => {
    await openTab()

    await chooseSlot('free')

    await eventually(() => expect(framed()).toBe(detailOf('file-2') + 'm1'))
    await eventually(() =>
      expect(previews()).toEqual([expect.stringContaining('https://dam.test/roi-of-file-2/preview.jpg?timestamp=')])
    )
  })

  // Read after the rotation, the file of the slot left is not drawn over the one chosen since.
  it('leaves the frame on another slot chosen while the rotated image is read', async () => {
    await openTab()
    let answer: () => void = () => undefined
    server.fileBy('image', 'file-1', () => new Promise((resolve) => (answer = () => resolve(imageFile('file-1')))))

    rotate()
    await eventually(() => expect(server.sent('GET', READ_FILE_1).length).toBeGreaterThan(0))
    server.fileBy('image', 'file-1', () => imageFile('file-1'))
    await chooseSlot('free')
    await eventually(() => expect(framed()).toBe(detailOf('file-2') + 'm1'))
    answer()
    await settled()

    expect(framed()).toBe(detailOf('file-2') + 'm1')
  })

  // Two rotations one after the other: the read after the second has the image as it is now.
  it('draws the image of the later rotation when the reads after two rotations answer in the other order', async () => {
    await openTab()
    const answers: Array<() => void> = []
    server.fileBy(
      'image',
      'file-1',
      () =>
        new Promise((resolve) => {
          const file = imageFile('file-1')
          answers.push(() => resolve(file))
        })
    )

    rotate()
    await eventually(() => expect(answers).toHaveLength(1))
    rotate()
    await eventually(() => expect(answers).toHaveLength(2))
    answers[1]!()
    await eventually(() => expect(framed()).toBe(detailOf('file-1') + 'm3'))
    answers[0]!()
    await settled()

    expect(framed()).toBe(detailOf('file-1') + 'm3')
  })
})
