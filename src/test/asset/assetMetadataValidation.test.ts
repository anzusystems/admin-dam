import { CustomDataFormElementType } from '@anzusystems/common-admin'
import type { CustomDataFormElement } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import type { App, Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'

import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'

// The asset detail and the asset list sidebar save through a collector of the asset metadata scope:
// `v$.$touch(); if (v$.$invalid) return`. Everything they validate sits in or under the custom metadata form.

const requiredText = (property: string, position: number): CustomDataFormElement => ({
  id: property,
  property,
  name: property,
  position,
  attributes: {
    type: CustomDataFormElementType.String,
    minValue: null,
    maxValue: null,
    minCount: null,
    maxCount: null,
    required: true,
    searchable: false,
    readonly: false,
  },
})

const config = vi.hoisted(() => ({ elements: [] as unknown[], pinned: undefined as number | undefined }))

vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({
    getDamConfigAssetCustomFormElements: () => ({ image: config.elements, audio: [], video: [], document: [] }),
    getDamConfigExtSystem: () => ({ image: { customMetadataPinnedAmount: config.pinned } }),
  }),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))

const AssetCustomMetadataForm = (
  await import('@/domains/coreDam/shared/components/customMetadata/AssetCustomMetadataForm.vue')
).default

// What the keyword and author inputs are to the sidebar: a field of the asset metadata scope in the form's slot.
const ScopedField = defineComponent({
  setup() {
    useVuelidate({ keywords: { required } }, { keywords: ref('') }, { $scope: AssetMetadataValidationScopeSymbol })
    return () => h('div')
  },
})

const AssetCustomMetadataFormMassOperations = (
  await import('@/domains/coreDam/shared/components/customMetadata/AssetCustomMetadataFormMassOperations.vue')
).default

let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
})

/** Mounts the form under a collector as the sidebars have it, and answers whether a save would be stopped. */
const saveIsStopped = async (customData: Record<string, string>, slot = false) => {
  let touchAndRead: () => boolean = () => false
  const Sidebar = defineComponent({
    setup() {
      const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })
      touchAndRead = () => {
        v$.value.$touch()
        return v$.value.$invalid
      }
      const model = ref(customData)
      return () =>
        h(
          AssetCustomMetadataForm as Component,
          {
            modelValue: model.value,
            'onUpdate:modelValue': (value: Record<string, string>) => (model.value = value),
            assetType: 'image',
          },
          slot ? { 'after-pinned': () => h(ScopedField) } : {}
        )
    },
  })
  await mountUnder(Sidebar)
  return touchAndRead()
}

const mountUnder = async (component: ReturnType<typeof defineComponent>) => {
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(component)
  app.use(createPinia())
  app.use(createVuetify())
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.mount(root)
  await nextTick()
  await nextTick()
}

describe('the mass operations form of the selected assets', () => {
  // A scratch form: its values are copied into the selected assets, it is not what gets saved. The overlays
  // that save validate everything below them (`useVuelidate()`); the keyword and author inputs of the scratch
  // form are kept out of that, and so are its custom fields.
  it('does not stop the save of the selected assets with a required custom field left empty', async () => {
    config.elements = [requiredText('title', 1)]
    let touchAndRead: () => boolean = () => true
    await mountUnder(
      defineComponent({
        setup() {
          const v$ = useVuelidate()
          touchAndRead = () => {
            v$.value.$touch()
            return v$.value.$invalid
          }
          return () => h(AssetCustomMetadataFormMassOperations as Component, { assetType: 'image', modelValue: {} })
        },
      })
    )
    expect(document.body.querySelector('textarea, input')).not.toBeNull()
    expect(touchAndRead()).toBe(false)
  })
})

describe('saving the queue in the overlays', () => {
  // The overlays validate everything below them. The form reports its fields and those in its slots once.
  it('counts every failing field of an item once', async () => {
    config.elements = [requiredText('title', 1), requiredText('description', 2)]
    config.pinned = 1
    let failing: () => number = () => -1
    await mountUnder(
      defineComponent({
        setup() {
          const v$ = useVuelidate()
          failing = () => {
            v$.value.$touch()
            return v$.value.$errors.length
          }
          return () =>
            h(
              AssetCustomMetadataForm as Component,
              { modelValue: { title: '', description: '' }, assetType: 'image' },
              { 'after-pinned': () => h(ScopedField) }
            )
        },
      })
    )
    // The pinned field, the one behind "show all", and the field in the slot.
    expect(failing()).toBe(3)
  })
})

describe('saving asset metadata in the sidebars', () => {
  it('is stopped by a required custom field that is empty', async () => {
    config.elements = [requiredText('title', 1)]
    config.pinned = 1
    expect(await saveIsStopped({ title: '' })).toBe(true)
  })

  it('goes on when the required custom field is filled', async () => {
    config.elements = [requiredText('title', 1)]
    config.pinned = 1
    expect(await saveIsStopped({ title: 'filled' })).toBe(false)
  })

  it('is stopped by an invalid field of the metadata scope in the slot of the form', async () => {
    config.elements = []
    config.pinned = 1
    expect(await saveIsStopped({}, true)).toBe(true)
  })

  // Without a pinned amount in the configuration every custom field is behind "show all".
  it('is stopped by a required custom field behind "show all"', async () => {
    config.elements = [requiredText('title', 1)]
    config.pinned = undefined
    expect(await saveIsStopped({ title: '' })).toBe(true)
  })
})
