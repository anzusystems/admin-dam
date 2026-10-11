import { useVuelidate } from '@vuelidate/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import type { Component } from 'vue'

import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { customField, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* What a row of the editable queue reports to whoever validates above it. The real row - the library's, in the
 * wrapper of admin-dam - over the real store, with the application around it as it starts; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'

const flush = async () => {
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('a row of the upload queue', () => {
  // The overlays validate everything below them and save the items whose metadata can be edited
  // (`hasMetadataToSave`). A failed upload, a duplicate, or an item still waiting for its metadata
  // is skipped, and its fields are disabled: nothing in it could be put right.
  it('is validated by the overlay only while its metadata can be edited', async () => {
    const ui = await startUploadUi({
      server,
      queues: { [QUEUE]: [queueRow({ status: 'processing', canEditMetadata: false })] },
      // A required custom field and required keywords: two fields of the row, both empty.
      customForm: { image: [customField('title', { required: true })] },
      extSystem: {
        image: { keywords: { enabled: true, required: true }, authors: { enabled: false, required: false } },
      },
    })
    const [item] = ui.rows[QUEUE]
    let failing: () => number = () => -1
    let failingInScope: () => number = () => -1
    const page = await ui.mount(async () => {
      const Row = (await import('@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue'))
        .default as Component
      // What the fields of the row report to by name: the scope of the asset metadata of admin-dam.
      const Scoped = defineComponent({
        setup() {
          const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })
          failingInScope = () => {
            v$.value.$touch()

            return v$.value.$errors.length
          }

          return () =>
            h(Row, {
              index: 0,
              queueId: QUEUE,
              customData: item.customData,
              keywords: item.keywords,
              authors: item.authors,
              item,
              refreshDisabled: false,
              mainFileSingleUse: item.mainFileSingleUse,
            })
        },
      })

      return {
        // As the overlays: a collector of everything below it.
        default: defineComponent({
          setup() {
            const v$ = useVuelidate()
            failing = () => {
              v$.value.$touch()

              return v$.value.$errors.length
            }

            return () => h(Scoped)
          },
        }),
      }
    })
    await flush()
    expect(page.querySelector('textarea, input')).not.toBeNull()
    expect([failing(), failingInScope()]).toEqual([0, 0])

    // Its metadata arrived: from now on the save sends the item.
    item.canEditMetadata = true
    await flush()
    expect([failing(), failingInScope()]).toEqual([2, 2])

    // And it failed after all.
    item.canEditMetadata = false
    await flush()
    expect([failing(), failingInScope()]).toEqual([0, 0])
  })
})
