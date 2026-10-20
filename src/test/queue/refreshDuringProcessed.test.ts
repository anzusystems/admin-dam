import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { assetDetail, assetFile, createFakeDam, httpError, queueRow, seedQueue } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'

/* The refresh button of a queue row whose processed notification comes while the read of the refresh is on its way:
 * the notification settles the row, and what that read answers afterwards is not news to tell (finding 1 B of the
 * review of OP13-L4, fixed in the library). The list is mounted over the real store, the row itself is a stand-in with
 * only the button, and the server is a fake. */

let server: FakeDam
const showWarningT = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showWarningT, showError: vi.fn() }),
}))
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
// What the row is to the list here: the button that asks for a refresh, disabled while the list says so.
vi.mock('@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      inheritAttrs: false,
      props: {
        item: { type: Object, required: true },
        index: { type: Number, required: true },
        refreshDisabled: { type: Boolean, required: true },
      },
      emits: ['refreshItem'],
      setup(props, { emit }) {
        return () =>
          h('button', {
            'data-refresh': props.item.key,
            disabled: props.refreshDisabled,
            onClick: () => emit('refreshItem', { index: props.index, assetId: props.item.assetId, item: props.item }),
          })
      },
    }),
  }
})
vi.mock('@/domains/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue', () => ({
  default: { render: () => null },
}))

const AssetQueueEditable = (await import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue')).default
const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

const QUEUE = 'global'

let app: App | undefined

/** Mounts the list over a queue holding the rows and answers the rows and the refresh button of each. */
const mountQueue = async (rows: UploadQueueItem[], otherQueues: Record<string, UploadQueueItem[]> = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useUploadQueuesStore()
  const seeded = seedQueue(store, QUEUE, rows)
  const others = Object.entries(otherQueues).map(([queueId, items]) => seedQueue(store, queueId, items))
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetQueueEditable, { queueId: QUEUE, massOperations: false })
  app.use(pinia)
  app.use(createVuetify({ components }))
  app.mount(root)
  await nextTick()
  const button = (row: UploadQueueItem) => {
    const found = root.querySelector<HTMLButtonElement>(`button[data-refresh="${row.key}"]`)
    if (!found) throw new Error('the row has no refresh button')

    return found
  }

  return { store, rows: seeded, others, button }
}

/** Presses the button and waits until the list lets it be pressed again. */
const refresh = async (button: HTMLButtonElement) => {
  button.click()
  await nextTick()
  await vi.waitFor(() => expect(button.disabled).toBe(false))
}

beforeEach(() => {
  vi.clearAllMocks()
  server = createFakeDam()
})

afterEach(() => {
  // The read the notification asks for comes 250 ms after it: called off with the queues, not left to the next case.
  useUploadQueuesStore().reset()
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

describe('the refresh of a row processed while its read is on its way', () => {
  const answers: Array<[string, () => FakeDamAnswer]> = [
    [
      'still on its way',
      () => ({ status: 200, data: assetDetail('asset-1', { mainFile: assetFile('file-1', 'stored') }) }),
    ],
    [
      'with a 502',
      () => {
        throw httpError(502)
      },
    ],
  ]

  it.each(answers)('says nothing when that read answers %s', async (_how, answered) => {
    const { store, rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    // Every read of the asset is held: the one of the refresh, and any read before the end of the case.
    const held: Array<() => void> = []
    server.assetBy(
      'asset-1',
      () =>
        new Promise((resolve, reject) =>
          held.push(() => {
            try {
              resolve(answered().data)
            } catch (error) {
              reject(error)
            }
          })
        )
    )
    button(rows[0]).click()
    await nextTick()
    await vi.waitFor(() => expect([held.length, button(rows[0]).disabled]).toEqual([1, true]))

    void store.queueItemProcessed('asset-1', 'file-1')
    await nextTick()
    expect(rows[0].status).toBe('uploaded')
    held.shift()!()
    await vi.waitFor(() => expect(button(rows[0]).disabled).toBe(false))
    expect(showWarningT).not.toHaveBeenCalled()
  })

  // The guard: with no notification meanwhile, the same answers are said.
  it.each(answers)('says something when that read answers %s and nothing came meanwhile', async (_how, answered) => {
    const { rows, button } = await mountQueue([queueRow({ status: 'processing' })])
    server.assetBy('asset-1', async () => answered().data)

    await refresh(button(rows[0]))

    expect(showWarningT).toHaveBeenCalledTimes(1)
  })
})
