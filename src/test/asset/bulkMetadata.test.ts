import { beforeEach, describe, expect, it, vi } from 'vitest'

const patch = vi.fn<(url: string, body: string) => Promise<{ status: number; data: unknown[] }>>(async () => ({
  status: 200,
  data: [],
}))

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => ({ patch }) }))
vi.mock('@anzusystems/common-admin/labs', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useApiFetchList: () => ({ fetchList: vi.fn() }),
  useApiRequest: () => ({ executeRequest: vi.fn() }),
}))

const queueItem = (over: Record<string, unknown> = {}) => ({
  assetId: 'asset-1',
  canEditMetadata: true,
  keywords: ['keyword-1'],
  authors: ['author-1'],
  customData: { headline: 'x' },
  mainFileSingleUse: null,
  mainFileInternal: null,
  ...over,
})

const load = async () => {
  vi.resetModules()

  return await import('@/domains/coreDam/asset/api/assetApi')
}

const bodyOf = (call: number) => JSON.parse(patch.mock.calls[call][1])

beforeEach(() => {
  vi.clearAllMocks()
  patch.mockResolvedValue({ status: 200, data: [] })
})

describe('bulk metadata update', () => {
  it('sends only the fields this form edits', async () => {
    const { bulkUpdateAssetsMetadata } = await load()

    await bulkUpdateAssetsMetadata([queueItem()] as never)

    // A field the payload leaves out is one this save does not write; the rules still run after.
    expect(bodyOf(0)).toEqual([
      {
        id: 'asset-1',
        keywords: ['keyword-1'],
        authors: ['author-1'],
        described: true,
        customData: { headline: 'x' },
      },
    ])
  })

  it('sends the one flag it does edit, once it is known', async () => {
    const { bulkUpdateAssetsMetadata } = await load()

    await bulkUpdateAssetsMetadata([queueItem({ mainFileSingleUse: true })] as never)

    expect(bodyOf(0)[0].mainFileSingleUse).toBe(true)
  })

  it('leaves that flag out while it is still unknown', async () => {
    const { bulkUpdateAssetsMetadata } = await load()

    // `null` is the factory default, not a value the user chose.
    await bulkUpdateAssetsMetadata([queueItem({ mainFileSingleUse: null })] as never)

    expect('mainFileSingleUse' in bodyOf(0)[0]).toBe(false)
  })

  it('counts its batches from the items it is going to send', async () => {
    const { bulkUpdateAssetsMetadata } = await load()
    // Eleven selected, one of them editable: duplicates and failures are dropped by the mapping.
    const items = [queueItem(), ...Array.from({ length: 10 }, () => queueItem({ canEditMetadata: false }))]

    await bulkUpdateAssetsMetadata(items as never)

    // Counted from the input, this sent a second PATCH with an empty body.
    expect(patch).toHaveBeenCalledTimes(1)
    expect(bodyOf(0)).toHaveLength(1)
  })

  it('splits a batch larger than the limit', async () => {
    const { bulkUpdateAssetsMetadata } = await load()
    const items = Array.from({ length: 23 }, (_, index) => queueItem({ assetId: `asset-${index}` }))

    await bulkUpdateAssetsMetadata(items as never)

    expect(patch).toHaveBeenCalledTimes(3)
    expect([bodyOf(0).length, bodyOf(1).length, bodyOf(2).length]).toEqual([10, 10, 3])
  })
})
