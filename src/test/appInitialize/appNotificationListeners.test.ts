import { beforeEach, describe, expect, it, vi } from 'vitest'

const openConnection = vi.fn()
const off = vi.fn()
const addDamNotificationListener = vi.fn<(callback: (payload: unknown) => void) => () => void>(() => off)

vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  initDamNotifications: () => ({ openConnection }),
  useDamNotifications: () => ({ addDamNotificationListener }),
}))
const queueItemProcessed = vi.fn()
const queueItemFailed = vi.fn()
const queueItemDuplicate = vi.fn()
const queueItemMetadataProcessed = vi.fn()
vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({
    queueItemProcessed,
    queueItemFailed,
    queueItemDuplicate,
    queueItemMetadataProcessed,
  }),
}))
const fileStatusOnServer = vi.fn()
vi.mock('@/domains/coreDam/asset/store/assetDetailStore', () => ({
  useAssetDetailStore: () => ({ fileStatusOnServer }),
}))
vi.mock('@/domains/coreDam/asset/store/distributionListStore', () => ({
  useDistributionListStore: () => ({}),
}))
vi.mock('@/domains/system/auth/auth', () => ({ useAuth: () => ({ useCurrentUser: () => ({}) }) }))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))

const load = async () => {
  vi.resetModules()

  return await import('@/domains/system/composables/appNotificationListeners')
}

beforeEach(() => {
  vi.clearAllMocks()
  openConnection.mockImplementation(() => undefined)
})

describe('what the listener passes on', () => {
  const event = (name: string) => ({
    name,
    data: { id: 'file-1', asset: 'asset-1', failReason: 'none', assetType: 'image', originAssetFile: 'origin-1' },
  })

  const fire = async (name: string) => {
    const { initAppNotificationListeners } = await load()
    initAppNotificationListeners()
    const listener = addDamNotificationListener.mock.calls[0][0] as (payload: unknown) => void
    listener(event(name))
  }

  // The event names the asset file and an asset has many. Without the
  // id, two uploads into different slots of one asset settle each other.
  it('carries the file id of a processed file', async () => {
    await fire('asset_file_processed')

    expect(queueItemProcessed).toHaveBeenCalledWith('asset-1', 'file-1')
  })

  // The detail holding the asset is told of the processed file whether or not a queue has a row for it.
  it('tells the detail of a processed file, with its id', async () => {
    await fire('asset_file_processed')

    expect(fileStatusOnServer.mock.calls).toEqual([['asset-1', 'file-1', 'processed']])
  })

  // Same for a file whose processing failed: the detail would otherwise keep it as still in progress.
  it('carries it for a failed file, to the detail too', async () => {
    await fire('asset_file_failed')

    expect(queueItemFailed).toHaveBeenCalledWith('asset-1', 'none', 'file-1')
    expect(fileStatusOnServer.mock.calls).toEqual([['asset-1', 'file-1', 'failed']])
  })

  it('carries it for a duplicate, to the detail too', async () => {
    await fire('asset_file_duplicate')

    expect(queueItemDuplicate).toHaveBeenCalledWith('asset-1', 'origin-1', 'image', 'file-1')
    expect(fileStatusOnServer.mock.calls).toEqual([['asset-1', 'file-1', 'duplicate']])
  })
})

describe('notification listeners', () => {
  it('registers once and opens one connection', async () => {
    const { initAppNotificationListeners } = await load()

    initAppNotificationListeners()

    expect(addDamNotificationListener).toHaveBeenCalledTimes(1)
    expect(openConnection).toHaveBeenCalledTimes(1)
  })

  it('does nothing on a second start-up', async () => {
    const { initAppNotificationListeners } = await load()

    initAppNotificationListeners()
    initAppNotificationListeners()

    expect(addDamNotificationListener).toHaveBeenCalledTimes(1)
    expect(openConnection).toHaveBeenCalledTimes(1)
  })

  it('takes the listener back off when the connection cannot be opened', async () => {
    const { initAppNotificationListeners } = await load()
    openConnection.mockImplementation(() => {
      throw new Error('bad webSocketUrl')
    })

    expect(() => initAppNotificationListeners()).toThrow('bad webSocketUrl')

    // The listener is registered before the connection opens. If opening throws,
    // an unreachable listener would stay and the next attempt would add another.
    expect(off).toHaveBeenCalledTimes(1)

    openConnection.mockImplementation(() => undefined)
    initAppNotificationListeners()

    expect(addDamNotificationListener).toHaveBeenCalledTimes(2)
    expect(openConnection).toHaveBeenCalledTimes(2)
  })
})
