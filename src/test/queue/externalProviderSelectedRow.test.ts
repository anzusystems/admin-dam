import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the row of an asset picked from an external provider', () => {
  const mountRow = async () => {
    const removed: number[] = []
    const ui = await startUploadUi({ server })
    const Row = (
      await import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetQueueItemReadonly.vue')
    ).default
    const item = queueRow({
      type: 'externalProviderAsset',
      status: 'uploaded',
      assetId: null,
      fileId: null,
      externalProviderAssetId: 'photo-1',
      externalProviderName: 'photos',
      displayTitle: 'A photo',
    })
    const root = await ui.mount(async () => ({
      default: defineComponent({
        setup: () => () => h(Row, { item, index: 3, onRemoveItem: (index: number) => removed.push(index) }),
      }),
    }))
    const bin = root.querySelector('.mdi-trash-can-outline')!.closest<HTMLButtonElement>('button')!

    return {
      bin,
      removed,
      tooltip: async () => {
        bin.dispatchEvent(new MouseEvent('mouseenter'))
        await vi.advanceTimersByTimeAsync(1000)

        return document.body.querySelector('.v-tooltip .v-overlay__content')?.textContent?.trim()
      },
    }
  }

  // Nothing is deleted. The asset stays with the provider and only leaves the selection.
  it('says of its bin that it takes the asset out of the selection, and the bin asks for just that', async () => {
    const { bin, removed, tooltip } = await mountRow()

    expect(await tooltip()).toBe('Remove from selection')
    bin.click()

    expect(removed).toEqual([3])
  })
})
