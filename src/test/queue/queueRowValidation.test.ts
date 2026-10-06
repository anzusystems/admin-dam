import { UploadQueueItemStatus } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'
import type { App, Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

// A required custom field and required keywords: two fields of the row, both empty.
const config = vi.hoisted(() => ({
  elements: [
    {
      id: 'title',
      property: 'title',
      name: 'title',
      position: 1,
      attributes: {
        type: 'string',
        minValue: null,
        maxValue: null,
        minCount: null,
        maxCount: null,
        required: true,
        searchable: false,
        readonly: false,
      },
    },
  ],
  extSystem: { image: { customMetadataPinnedAmount: 2, keywords: { enabled: true, required: true } } },
}))

vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({
    getDamConfigAssetCustomFormElements: () => ({ image: config.elements, audio: [], video: [], document: [] }),
    getDamConfigExtSystem: () => config.extSystem,
  }),
  usePageNavigation: () => ({ onPage: () => true }),
  useAlerts: () => ({ showRecordWas: vi.fn(), showErrorsDefault: vi.fn() }),
  // Buttons of the row that have nothing to validate, and ask for the user and the router.
  AActionDeleteButton: { render: () => null },
  ATableCopyIdButton: { render: () => null },
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({ deleteAsset: vi.fn(), fetchAsset: vi.fn() }))
vi.mock('@/domains/coreDam/asset/store/assetDetailStore', () => ({ useAssetDetailStore: () => ({}) }))
vi.mock('@/domains/coreDam/asset/store/assetListStore', () => ({ useAssetListStore: () => ({}) }))
vi.mock('@/domains/system/auth/auth', () => ({ ACL: {} }))
vi.mock('@/domains/coreDam/asset/components/AssetImage.vue', () => ({ default: { render: () => null } }))
vi.mock('@/domains/coreDam/asset/components/AssetLink.vue', () => ({ default: { render: () => null } }))
vi.mock('@/domains/coreDam/asset/components/AssetFileFailReasonChip.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/domains/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue', () => ({
  default: { render: () => null },
}))
// What the keyword input is to the row: a required field of the scope it is given. The real one asks the API.
vi.mock('@/domains/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue', async () => {
  const { defineComponent, h, ref } = await import('vue')
  const { useVuelidate } = await import('@vuelidate/core')
  const { required } = await import('@vuelidate/validators')

  return {
    default: defineComponent({
      props: { validationScope: { type: [String, Number, Boolean, Symbol], default: undefined } },
      setup(props) {
        // Read once, as the real one reads it.
        // eslint-disable-next-line vue/no-setup-props-reactivity-loss
        useVuelidate({ keywords: { required } }, { keywords: ref('') }, { $scope: props.validationScope })
        return () => h('div')
      },
    }),
  }
})

const AssetQueueItemEditable = (await import('@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue'))
  .default

let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

const flush = async () => {
  await nextTick()
  await nextTick()
}

describe('a row of the upload queue', () => {
  // The overlays validate everything below them and save the items whose metadata can be edited
  // (`hasMetadataToSave`). A failed upload, a duplicate, or an item still waiting for its metadata
  // is skipped, and its fields are disabled: nothing in it could be put right.
  it('is validated by the overlay only while its metadata can be edited', async () => {
    const item = reactive({
      key: 'row',
      status: UploadQueueItemStatus.Processing,
      isDuplicate: false,
      duplicateAssetId: null,
      assetType: 'image',
      assetStatus: 'draft',
      displayTitle: '',
      assetId: 'asset-1',
      file: null,
      keywords: [],
      authors: [],
      authorConflicts: [],
      customData: {},
      imagePreview: undefined,
      progress: { remainingTime: null, progressPercent: null, speed: null },
      canEditMetadata: false,
      error: { hasError: false, message: '', assetFileFailReason: 'none' },
      mainFileSingleUse: null,
    }) as unknown as UploadQueueItem
    let failing: () => number = () => -1
    const Overlay = defineComponent({
      setup() {
        const v$ = useVuelidate()
        failing = () => {
          v$.value.$touch()
          return v$.value.$errors.length
        }
        return () =>
          h(AssetQueueItemEditable as Component, {
            index: 0,
            queueId: 'queue',
            customData: item.customData,
            keywords: item.keywords,
            authors: item.authors,
            item,
            refreshDisabled: false,
            mainFileSingleUse: item.mainFileSingleUse,
          })
      },
    })
    const root = document.createElement('div')
    document.body.appendChild(root)
    app = createApp(Overlay)
    app.use(createPinia())
    app.use(createVuetify({ components }))
    app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
    app.mount(root)
    await flush()
    expect(document.body.querySelector('textarea, input')).not.toBeNull()
    expect(failing()).toBe(0)

    // Its metadata arrived: from now on the save sends the item.
    item.canEditMetadata = true
    await flush()
    expect(failing()).toBe(2)

    // And it failed after all.
    item.canEditMetadata = false
    await flush()
    expect(failing()).toBe(0)
  })
})
