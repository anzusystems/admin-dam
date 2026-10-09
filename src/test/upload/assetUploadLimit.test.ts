import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { createFakeDam, queueRow, seedDamConfig, seedQueue, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The entry of every upload: what is picked goes into the queue at once, unless the queue would then hold more
 * than fifty rows - then a dialog offers to take the first few. Mounted over the real store, the file picker
 * replaced by a button that hands over the files of the case. */

let server: FakeDam
const picked = vi.hoisted(() => ({ files: [] as File[] }))

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => {
  const { h } = await import('vue')

  return {
    ...((await importOriginal()) as Record<string, unknown>),
    ADialogToolbar: { render: () => h('div') },
  }
})
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
vi.mock('@/domains/coreDam/shared/components/FileUpload.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      inheritAttrs: false,
      emits: ['filesInput'],
      setup(_props, { emit }) {
        return () => h('button', { 'data-picker': '', onClick: () => emit('filesInput', picked.files) })
      },
    }),
  }
})

const AssetUpload = (await import('@/domains/coreDam/asset/components/AssetUpload.vue')).default
const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
const { useDamConfigStore } = await import('@anzusystems/common-admin')

const files = (count: number) =>
  Array.from({ length: count }, (_value, index) => new File(['abc'], `picked-${index + 1}.jpg`, { type: 'image/jpeg' }))

const settled = (count: number): UploadQueueItem[] =>
  Array.from({ length: count }, (_value, index) =>
    queueRow({ status: 'uploaded', assetId: 'settled-' + index, displayTitle: 'settled' })
  )

let app: App | undefined

/** Mounts the upload entry over a queue that already holds the rows. */
const mountUpload = async (queueId: string, rows: UploadQueueItem[], props: Record<string, unknown> = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  seedDamConfig(useDamConfigStore())
  const store = useUploadQueuesStore()
  seedQueue(store, queueId, rows)
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetUpload, { queueId, ...props })
  app.use(pinia)
  app.use(createVuetify({ components, aliases: { ABtnPrimary: components.VBtn, ABtnTertiary: components.VBtn } }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.mount(root)
  await nextTick()
  const pick = async (count: number) => {
    picked.files = files(count)
    root.querySelector<HTMLButtonElement>('button[data-picker]')?.click()
    // The files are taken one after another, a tick apart.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }
  const dialogButton = (text: string) =>
    Array.from(document.body.querySelectorAll<HTMLButtonElement>('.v-dialog button')).find((button) =>
      button.textContent?.includes(text)
    )
  const added = () =>
    store
      .getQueueItems(queueId)
      .filter((row) => row.displayTitle !== 'settled')
      .map((row) => row.displayTitle)

  return { store, pick, dialogButton, added }
}

const CONFIRM = 'system.upload.limits.actionAddFirstItems'
const CANCEL = 'common.button.cancel'

beforeEach(() => {
  vi.clearAllMocks()
  stubFileReader()
  // happy-dom has none, and the dialog listens on it for the size of the window.
  vi.stubGlobal('visualViewport', new EventTarget())
  server = createFakeDam()
  // Every upload stays at its first request: the cases are about what gets into the queue.
  server.on('POST', /./, () => new Promise(() => undefined))
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('files picked for upload', () => {
  it('all go into the queue when it then holds no more than fifty rows', async () => {
    const { store, pick, dialogButton, added } = await mountUpload('global', settled(45))

    await pick(5)

    expect(added()).toEqual(['picked-1.jpg', 'picked-2.jpg', 'picked-3.jpg', 'picked-4.jpg', 'picked-5.jpg'])
    expect(store.getQueueTotalCount('global')).toBe(50)
    expect(dialogButton(CANCEL)).toBeUndefined()
  })

  it('wait for an answer when the queue would hold more than fifty, and the first that fit are taken on yes', async () => {
    const { store, pick, dialogButton, added } = await mountUpload('global', settled(48))

    await pick(5)

    expect(added()).toEqual([])
    const confirm = dialogButton(CONFIRM)
    expect(confirm).toBeDefined()

    confirm?.click()
    await vi.waitFor(() => expect(dialogButton(CONFIRM)).toBeUndefined())

    expect(added()).toEqual(['picked-1.jpg', 'picked-2.jpg'])
    expect(store.getQueueTotalCount('global')).toBe(50)
  })

  it('are dropped on no, and the file input is made anew so that they can be picked again', async () => {
    const { store, pick, dialogButton, added } = await mountUpload('global', settled(48))
    const keyBefore = store.getQueueFileInputKey('global')

    await pick(5)
    dialogButton(CANCEL)?.click()
    await vi.waitFor(() => expect(dialogButton(CANCEL)).toBeUndefined())

    expect(added()).toEqual([])
    expect(store.getQueueTotalCount('global')).toBe(48)
    expect(store.getQueueFileInputKey('global')).toBe(keyBefore + 1)
  })

  it('cannot be taken at all when the queue is full already', async () => {
    const { pick, dialogButton, added } = await mountUpload('global', settled(50))

    await pick(1)

    expect(added()).toEqual([])
    expect(dialogButton(CANCEL)).toBeDefined()
    expect(dialogButton(CONFIRM)).toBeUndefined()
  })
})

describe('a file picked for a slot of an asset', () => {
  it('goes into the queue as a slot upload of that asset, slot and type', async () => {
    const { store, pick } = await mountUpload('slots', [], {
      type: 'slots',
      variant: 'slot-upload',
      assetId: 'asset-9',
      slotName: 'bonus',
      assetType: 'audio',
      multiple: false,
    })

    await pick(1)

    expect(
      store.getQueueItems('slots').map((row) => [row.type, row.assetId, row.slotName, row.assetType, row.displayTitle])
    ).toEqual([['slotFile', 'asset-9', 'bonus', 'audio', 'picked-1.jpg']])
    expect(server.requests.map((request) => request.url)).toEqual(['/adm/v1/audio/asset/asset-9/slot-name/bonus'])
  })

  // The dialog only asks how many: what it lets through goes where the files were meant to go.
  it('goes there as well when it is taken through the dialog of the limit, not into the queue as a new asset', async () => {
    const { store, pick, dialogButton } = await mountUpload('slots', settled(48), {
      type: 'slots',
      variant: 'slot-upload',
      assetId: 'asset-9',
      slotName: 'bonus',
      assetType: 'audio',
    })

    await pick(5)
    expect(store.getQueueTotalCount('slots')).toBe(48)
    const confirm = dialogButton(CONFIRM)
    expect(confirm).toBeDefined()
    confirm?.click()
    await vi.waitFor(() => expect(dialogButton(CONFIRM)).toBeUndefined())

    const taken = store.getQueueItems('slots').filter((row) => row.displayTitle !== 'settled')
    expect(taken.map((row) => [row.type, row.assetId, row.slotName, row.assetType, row.displayTitle])).toEqual([
      ['slotFile', 'asset-9', 'bonus', 'audio', 'picked-1.jpg'],
      ['slotFile', 'asset-9', 'bonus', 'audio', 'picked-2.jpg'],
    ])
    expect(store.getQueueTotalCount('slots')).toBe(50)
    // Sent as files of that slot: no request that would make a new asset.
    expect(server.requests.map((request) => request.url)).toEqual([
      '/adm/v1/audio/asset/asset-9/slot-name/bonus',
      '/adm/v1/audio/asset/asset-9/slot-name/bonus',
    ])
  })

  it('is dropped on no, and nothing is sent', async () => {
    const { store, pick, dialogButton } = await mountUpload('slots', settled(48), {
      type: 'slots',
      variant: 'slot-upload',
      assetId: 'asset-9',
      slotName: 'bonus',
      assetType: 'audio',
    })

    await pick(5)
    dialogButton(CANCEL)?.click()
    await vi.waitFor(() => expect(dialogButton(CANCEL)).toBeUndefined())

    expect(store.getQueueTotalCount('slots')).toBe(48)
    expect(server.requests).toEqual([])
  })
})
