import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App, Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

const queue = vi.hoisted(() => ({ items: [] as unknown[] }))

vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({
    getQueueItems: () => queue.items,
    getQueueTotalCount: () => queue.items.length,
    getQueueProcessedCount: () => queue.items.length,
  }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showRecordWas: vi.fn(), showValidationError: vi.fn(), showErrorsDefault: vi.fn() }),
  useTheme: () => ({ toolbarColor: 'surface' }),
  useApiFetchList: () => ({ fetchList: vi.fn() }),
  useApiRequest: () => ({ execute: vi.fn() }),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/system/auth/auth', () => ({ ACL: {} }))
vi.mock('@/domains/coreDam/asset/store/assetListStore', () => ({ useAssetListStore: () => ({}) }))
vi.mock('@/domains/coreDam/asset/components/list/composables/assetListActions', () => ({
  useAssetListActions: () => ({ fetchAssetList: vi.fn() }),
}))
vi.mock('@/domains/coreDam/asset/composables/assetFooterUpload', () => ({
  useAssetFooterUploadView: () => ({ footerViewUpload: 'full', showMinimalUpload: false }),
}))
vi.mock('@/domains/coreDam/asset/composables/assetFooterSelected', () => ({
  useAssetFooterSelectedView: () => ({ footerViewSelected: 'full', showMinimalSelected: false }),
}))
// The parts of the overlays that have no say in the save.
vi.mock('@/domains/coreDam/asset/components/AssetUpload.vue', () => ({ default: { render: () => null } }))
vi.mock('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/domains/coreDam/asset/components/footer/AssetFooterUploadButtonStop.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/domains/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue', () => ({
  default: { render: () => null },
}))

const overlays = [
  [
    'the upload overlay',
    (await import('@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue')).default,
  ],
  [
    'the mass edit overlay',
    (await import('@/domains/coreDam/asset/components/footer/AssetFooterSelectedFull.vue')).default,
  ],
] as const

let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

/** Mounts the overlay over the given queue and answers whether "save and close" and "save" can be pressed. */
const saveButtons = async (overlay: Component, items: unknown[]) => {
  queue.items = items
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(overlay)
  app.use(createPinia())
  app.use(createVuetify({ components, aliases: { ABtnPrimary: components.VBtn } }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.component('Acl', (_props, { slots }) => slots.default?.())
  app.mount(root)
  await nextTick()
  await nextTick()
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
  const saveAndClose = buttons.find((button) => button.textContent?.includes('saveAndClose'))
  const save = buttons.find((button) => button.querySelector('.mdi-content-save'))
  expect(saveAndClose && save).toBeTruthy()

  return [!saveAndClose?.disabled, !save?.disabled]
}

// What the bulk save sends is an item with an asset whose metadata can be edited.
const failed = { assetId: 'asset-1', canEditMetadata: false }
const withoutAsset = { assetId: null, canEditMetadata: true }
const editable = { assetId: 'asset-2', canEditMetadata: true }

describe.each(overlays)('%s', (_name, overlay) => {
  // The save would send nothing, and the request-less answer was reported as an error.
  it('cannot be saved while no item of the queue would be sent', async () => {
    expect(await saveButtons(overlay, [failed, withoutAsset])).toEqual([false, false])
  })

  it('can be saved once one item would be sent, whatever the others', async () => {
    expect(await saveButtons(overlay, [failed, editable])).toEqual([true, true])
  })
})
