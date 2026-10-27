import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/*
 * Who may create a keyword or author from the asset detail metadata. The inputs are the library's
 * and ask for the grant the app gives the plugin (`src/plugins/commonAdminCoreDam.ts`).
 * Uses the real detail sidebar, the app initialised and a fake server.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const NO_CREATE: Partial<UploadUiSetup> = { grants: ['dam_asset_update'] }

const mountSidebar = async (setup: Partial<UploadUiSetup> = {}) => {
  const ui = await startUploadUi({
    server,
    extSystem: { image: { keywords: { enabled: true, required: false }, authors: { enabled: true, required: false } } },
    ...setup,
  })
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  useAssetDetailStore().setAsset(assetDetail('asset-1', { createdBy: null, modifiedBy: null }) as never)
  const sidebar = await ui.mount(
    () => import('@/domains/coreDam/asset/components/detail/components/AssetDetailDialogSidebar.vue'),
    {
      assetId: 'asset-1',
      isVideo: false,
      isAudio: false,
      isImage: true,
      isDocument: false,
      assetStatus: 'with_file',
      assetType: 'image',
    }
  )
  await nextTick()
  const field = (label: string) =>
    Array.from(sidebar.querySelectorAll<HTMLElement>('.v-autocomplete')).find(
      (input) => input.querySelector('label')?.textContent?.trim() === label
    )!
  const offerToAdd = async (label: string, text: string) => {
    const input = field(label).querySelector<HTMLInputElement>('input[type="text"]')!
    input.focus()
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)

    return (
      Array.from(document.body.querySelectorAll<HTMLElement>('.v-overlay-container .v-list-item'))
        .find((item) => item.querySelector('button'))
        ?.querySelector('button') ?? null
    )
  }
  const addAuthor = () => sidebar.querySelector<HTMLButtonElement>('[data-cy="add-author"]')

  return { offerToAdd, addAuthor }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({
    status: 200,
    data: { data: [], totalCount: 0 },
  }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the metadata of the asset detail', () => {
  it('offers a new keyword of the searched name only to a user who may create keywords', async () => {
    const allowed = await mountSidebar()
    expect((await allowed.offerToAdd('Keywords', 'Kosice'))?.textContent?.trim()).toBe('Kosice')
    stopUploadUi()

    const refused = await mountSidebar(NO_CREATE)
    expect(await refused.offerToAdd('Keywords', 'Kosice')).toBeNull()
  })

  it('has a button for a new author only for a user who may create authors', async () => {
    const allowed = await mountSidebar()
    expect(allowed.addAuthor()).not.toBeNull()
    stopUploadUi()

    const refused = await mountSidebar(NO_CREATE)
    expect(refused.addAuthor()).toBeNull()
  })
})
