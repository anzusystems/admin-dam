import { useDamConfigStore } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* A slot of the asset detail while a file is being uploaded into it: the slot draws the upload in place of its
 * file, and asks for the slot list to be read again when the upload leaves. Mounted over the real store. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: null } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))
vi.mock('@/domains/system/auth/auth', () => ({
  ACL: {},
  assetTypeAcl: () => 'acl',
  useAuth: () => ({ can: () => true, canForAll: () => true }),
}))
// The parts of the slot that draw its file or offer an upload into it: here only marks of which one is shown.
const part = async (name: string) => {
  const { h } = await import('vue')

  return { default: { render: () => h('div', { 'data-part': name }) } }
}
vi.mock('@/domains/coreDam/asset/components/AssetUpload.vue', () => part('upload'))
vi.mock('@/domains/coreDam/asset/components/ImageFile.vue', () => part('file'))
vi.mock('@/domains/coreDam/shared/assetFileRoute/components/AssetFileMainRoute.vue', () => part('route'))
vi.mock('@/domains/coreDam/asset/components/AssetFileDuplicateChip.vue', () => part('duplicate-chip'))
vi.mock('@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItemDuplicate.vue', () =>
  part('action')
)
vi.mock('@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItemRemove.vue', () => part('action'))
vi.mock('@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItemSwitch.vue', () => part('action'))

const AssetSlotListItem = (
  await import('@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItem.vue')
).default
const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

const SLOTS = 'slots'

const slotUpload = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    type: 'slotFile',
    status: 'uploading',
    fileId: 'file-2',
    slotName: 'extra',
    displayTitle: 'photo.jpg',
    ...over,
  })

let app: App | undefined

/** Mounts the slot `extra` of `asset-1` over a slots queue holding the rows. */
const mountSlot = async (rows: UploadQueueItem[], slotHasFile = false, file = assetFile('file-old')) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useUploadQueuesStore()
  const seeded = seedQueue(store, SLOTS, rows)
  const refreshList = vi.fn()
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetSlotListItem, {
    slotName: 'extra',
    title: 'the asset',
    item: slotHasFile ? { id: 'slot-1', slotName: 'extra', default: false, main: false, assetFile: file } : null,
    assetType: 'image',
    totalSlotCount: 2,
    assetId: 'asset-1',
    onRefreshList: refreshList,
  })
  app.use(pinia)
  app.use(createVuetify({ components }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.mount(root)
  await nextTick()
  const shows = () => ({
    upload: !!root.querySelector('.dam-upload-queue__item'),
    file: !!root.querySelector('[data-part="file"]'),
    picker: !!root.querySelector('[data-part="upload"]'),
  })
  const cancel = () => root.querySelector<HTMLButtonElement>('.dam-upload-queue__item-remove')

  return { store, rows: seeded, refreshList, root, shows, cancel }
}

beforeEach(() => {
  vi.clearAllMocks()
  server = createFakeDam()
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a slot with an upload into it under way', () => {
  it.each(['waiting', 'uploading', 'processing', 'failed'] as const)(
    'draws the %s upload in place of its file',
    async (status) => {
      const { shows, root } = await mountSlot([slotUpload({ status })], true)

      expect(shows()).toEqual({ upload: true, file: false, picker: false })
      expect(root.textContent).toContain('photo.jpg')
    }
  )

  it('draws its file, or the picker of an empty slot, when the queue holds no upload into it', async () => {
    const empty = await mountSlot([])
    expect(empty.shows()).toEqual({ upload: false, file: false, picker: true })
    app?.unmount()

    const filled = await mountSlot([], true)
    expect(filled.shows()).toEqual({ upload: false, file: true, picker: false })
  })

  it('draws no upload of another slot, nor of another asset', async () => {
    const { shows } = await mountSlot([
      slotUpload({ slotName: 'bonus' }),
      slotUpload({ assetId: 'asset-2', fileId: 'file-3' }),
    ])

    expect(shows()).toEqual({ upload: false, file: false, picker: true })
  })

  it('draws the newest upload into it, not one that finished there before', async () => {
    const { shows, root } = await mountSlot([
      slotUpload({ status: 'uploaded', displayTitle: 'first.jpg', fileId: 'file-1' }),
      slotUpload({ status: 'uploading', displayTitle: 'second.jpg' }),
    ])

    expect(shows().upload).toBe(true)
    expect(root.textContent).toContain('second.jpg')
  })
})

describe('the upload into a slot leaving', () => {
  it('asks for the slot list once when the upload is settled as uploaded', async () => {
    const { rows, refreshList, shows } = await mountSlot([slotUpload({ status: 'processing' })])
    expect(refreshList).not.toHaveBeenCalled()

    rows[0].status = 'uploaded'
    await nextTick()

    expect(refreshList).toHaveBeenCalledTimes(1)
    // Until that list answers, the slot is drawn as it was before the upload.
    expect(shows()).toEqual({ upload: false, file: false, picker: true })
  })

  // With no notification it is the poll of the queue that finds the file of the slot processed.
  it('asks for the slot list once when a read of the poll settles the upload', async () => {
    vi.useFakeTimers()
    stubFileReader()
    const { store, rows, refreshList, shows } = await mountSlot([
      slotUpload({ status: 'waiting', fileId: null, file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }) }),
    ])
    seedDamConfig(useDamConfigStore())
    server.asset(assetDetail('asset-1', { mainFile: assetFile('file-main') }))
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)
    expect([rows[0].status, rows[0].fileId]).toEqual(['processing', 'file-1'])
    expect(refreshList).not.toHaveBeenCalled()
    server.slotFile('asset-1', 'extra', assetFile('file-1', 'processed'))

    await vi.advanceTimersByTimeAsync(20_000)
    await nextTick()

    expect(rows[0].status).toBe('uploaded')
    expect(refreshList).toHaveBeenCalledTimes(1)
    expect(shows()).toEqual({ upload: false, file: false, picker: true })
  })

  it('does not ask while the upload only moves on, nor when it fails', async () => {
    const { rows, refreshList, shows } = await mountSlot([slotUpload({ status: 'waiting' })])

    for (const status of ['uploading', 'processing', 'failed'] as const) {
      rows[0].status = status
      await nextTick()
    }

    expect(refreshList).not.toHaveBeenCalled()
    // A failed upload stays over the slot until it is cancelled.
    expect(shows().upload).toBe(true)
  })

  it.each(['uploading', 'processing', 'failed'] as const)(
    'asks for the slot list once when the %s upload is cancelled, which takes it out of the queue',
    async (status) => {
      const { store, refreshList, cancel, shows } = await mountSlot([slotUpload({ status })])

      cancel()?.click()
      await vi.waitFor(() => expect(store.getQueueItems(SLOTS)).toEqual([]))
      await nextTick()

      expect(refreshList).toHaveBeenCalledTimes(1)
      expect(shows()).toEqual({ upload: false, file: false, picker: true })
    }
  )

  it('asks for the slot list once when the slots queue is stopped or cleared', async () => {
    const stopped = await mountSlot([slotUpload({ status: 'processing' })])
    stopped.store.stopUpload(SLOTS)
    await nextTick()
    expect(stopped.refreshList).toHaveBeenCalledTimes(1)
    app?.unmount()

    const cleared = await mountSlot([slotUpload({ status: 'processing' })])
    cleared.store.clearQueue(SLOTS)
    await nextTick()
    expect(cleared.refreshList).toHaveBeenCalledTimes(1)
  })

  it('offers no way to cancel an upload that is settled', async () => {
    const { cancel, shows } = await mountSlot([slotUpload({ status: 'uploaded' })])

    expect(shows().upload).toBe(false)
    expect(cancel()).toBeNull()
  })
})

describe('a slot whose file failed', () => {
  it('says why with the chip of the library', async () => {
    const failed = assetFile('file-old', 'failed')
    failed.fileAttributes.failReason = 'invalid_mime_type'
    const { root } = await mountSlot([], true, failed)

    // No messages are loaded here, so the chip shows the key of the library's text for the reason.
    expect(root.textContent).toContain('common.damImage.asset.assetFileFailReason.invalidMimeType')
  })
})
