import type { CustomDataFormElement } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Component } from 'vue'

import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { customField, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The asset detail and the list sidebar save through a collector of the asset metadata scope: `v$.$touch();
 * if (v$.$invalid) return`. Everything they validate is in or under the custom metadata form.
 * Uses the library form with the admin-dam scope as the sidebars and
 * queue rows pass it, over the library config store as the app fills it.
 * The real detail sidebar over the same scope is tested in `assetDetailMetadataScope.test.ts`.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const requiredText = (property: string, position: number): CustomDataFormElement => ({
  ...customField(property, { required: true }),
  position,
})

const ScopedField = defineComponent({
  setup() {
    useVuelidate({ keywords: { required } }, { keywords: ref('') }, { $scope: AssetMetadataValidationScopeSymbol })
    return () => h('div')
  },
})

const mountUnder = async (elements: CustomDataFormElement[], pinned: number, page: (Form: Component) => Component) => {
  const ui = await startUploadUi({
    server,
    customForm: { image: elements },
    extSystem: { image: { customMetadataPinnedAmount: pinned } },
  })
  await ui.mount(async () => ({ default: page(ui.library.ADamAssetCustomMetadataForm as Component) }))
  await nextTick()
  await nextTick()
}

const saveIsStopped = async (
  elements: CustomDataFormElement[],
  pinned: number,
  customData: Record<string, string>,
  slot = false
) => {
  let touchAndRead: () => boolean = () => false
  await mountUnder(elements, pinned, (Form) =>
    defineComponent({
      setup() {
        const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })
        touchAndRead = () => {
          v$.value.$touch()
          return v$.value.$invalid
        }
        const model = ref(customData)
        return () =>
          h(
            Form,
            {
              modelValue: model.value,
              'onUpdate:modelValue': (value: Record<string, string>) => (model.value = value),
              assetType: 'image',
              extSystem: 1,
              validationScope: AssetMetadataValidationScopeSymbol,
            },
            slot ? { 'after-pinned': () => h(ScopedField) } : {}
          )
      },
    })
  )
  return touchAndRead()
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('saving the queue in the overlays', () => {
  // The overlays validate everything below them. The form reports its fields and those in its slots once.
  it('counts every failing field of an item once', async () => {
    let failing: () => number = () => -1
    await mountUnder([requiredText('title', 1), requiredText('description', 2)], 1, (Form) =>
      defineComponent({
        setup() {
          const v$ = useVuelidate()
          failing = () => {
            v$.value.$touch()
            return v$.value.$errors.length
          }
          return () =>
            h(
              Form,
              {
                modelValue: { title: '', description: '' },
                assetType: 'image',
                extSystem: 1,
                validationScope: AssetMetadataValidationScopeSymbol,
              },
              { 'after-pinned': () => h(ScopedField) }
            )
        },
      })
    )
    expect(failing()).toBe(3)
  })
})

describe('saving asset metadata in the sidebars', () => {
  it('is stopped by a required custom field that is empty', async () => {
    expect(await saveIsStopped([requiredText('title', 1)], 1, { title: '' })).toBe(true)
  })

  it('goes on when the required custom field is filled', async () => {
    expect(await saveIsStopped([requiredText('title', 1)], 1, { title: 'filled' })).toBe(false)
  })

  it('is stopped by an invalid field of the metadata scope in the slot of the form', async () => {
    expect(await saveIsStopped([], 1, {}, true)).toBe(true)
  })

  // With none pinned, every custom field is behind "show all". Stated
  // explicitly because a configuration that says nothing pins two.
  it('is stopped by a required custom field behind "show all"', async () => {
    expect(await saveIsStopped([requiredText('title', 1)], 0, { title: '' })).toBe(true)
  })
})
