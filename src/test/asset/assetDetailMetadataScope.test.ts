import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/*
 * "Save" of the asset detail sidebar and what it validates: the metadata form under
 * it (custom fields, keyword and author inputs) reports to the scope the save reads.
 * Uses the real sidebar with its tabs and button target, the real detail store, and a fake server.
 * The same scope in the bare form is tested in `assetMetadataValidation.test.ts`.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const FIX_FIRST = 'Please fill all required fields and fix problems'
const UPDATED = 'Record was updated'
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

const requiredTitle: Partial<UploadUiSetup> = { customForm: { image: [customField('title', { required: true })] } }
const requiredInputs = (keywords: boolean, authors: boolean): Partial<UploadUiSetup> => ({
  extSystem: {
    image: { keywords: { enabled: true, required: keywords }, authors: { enabled: true, required: authors } },
  },
})

const mountSidebar = async (asset: Record<string, unknown>, setup: Partial<UploadUiSetup> = {}) => {
  const ui = await startUploadUi({ server, ...setup })
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const detail = assetDetail('asset-1', { createdBy: null, modifiedBy: null, ...asset })
  useAssetDetailStore().setAsset(detail as never)
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
  // The buttons are moved into their target only once it exists.
  await nextTick()
  const save = () => sidebar.querySelector<HTMLButtonElement>('[data-cy="button-save"]')

  return { ...ui, sidebar, save }
}

const press = async (button: HTMLButtonElement | null) => {
  expect(button).not.toBeNull()
  button!.click()
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, (_request, match) => ({
    status: 200,
    data: { data: [match[1] === 'keyword' ? { id: 'keyword-1', name: 'river' } : { id: 'author-1', name: 'Jane' }] },
  }))
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  stopUploadUi()
})

describe('saving the metadata of an asset in the sidebar of its detail', () => {
  it('sends nothing, and says what to fix, while a required custom field is empty', async () => {
    const { save, alerts } = await mountSidebar(
      { metadata: { customData: { title: '' }, authorSuggestions: {}, keywordSuggestions: {} } },
      requiredTitle
    )

    await press(save())

    expect(server.sent('PATCH', BULK)).toEqual([])
    await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))
  })

  it('sends nothing, and says what to fix, while required keywords are missing', async () => {
    const { save, alerts } = await mountSidebar({ keywords: [] }, requiredInputs(true, false))

    await press(save())

    expect(server.sent('PATCH', BULK)).toEqual([])
    await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))
  })

  it('sends nothing, and says what to fix, while required authors are missing', async () => {
    const { save, alerts } = await mountSidebar({ authors: [] }, requiredInputs(false, true))

    await press(save())

    expect(server.sent('PATCH', BULK)).toEqual([])
    await eventually(() => expect(alerts()).toEqual([FIX_FIRST]))
  })

  it('saves once all of them are there', async () => {
    const { save, alerts } = await mountSidebar(
      {
        keywords: ['keyword-1'],
        authors: ['author-1'],
        metadata: { customData: { title: 'filled' }, authorSuggestions: {}, keywordSuggestions: {} },
      },
      { ...requiredTitle, ...requiredInputs(true, true) }
    )

    await press(save())

    await eventually(() => expect(alerts()).toEqual([UPDATED]))
    expect(server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))).toEqual([
      [
        expect.objectContaining({
          id: 'asset-1',
          keywords: ['keyword-1'],
          authors: ['author-1'],
          customData: { title: 'filled' },
        }),
      ],
    ])
  })
})
