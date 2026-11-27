import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A reload or a closed window loses what was typed into a queue row and not saved (#87746 DAM-B20, case 2).
 * The browser asks first, as for a file still being sent. Only for typed metadata that the server does not have:
 * a row that matches what it last got from or saved to the server is left without a question.
 * Typed metadata do not hold back the reload to a new version, which checks `uploadsRunning` alone.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/

beforeEach(() => {
  server = createFakeDam()
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
})

afterEach(() => {
  stopUploadUi()
})

const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

/** The application with a row of `queueId` that got the metadata of its asset from the server. */
const openAppWithRowOf = async (queueId: string, grants?: string[]) => {
  const asset = assetDetail('asset-1', {
    flags: { described: true },
    metadata: { customData: { title: 'from the server' }, authorSuggestions: {}, keywordSuggestions: {} },
  })
  server.asset(asset)
  const ui = await startUploadUi({ server, grants })
  await ui.mount(() => import('@/App.vue'))
  await ui.store.addByAssets(queueId, [
    {
      id: asset.id,
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      texts: { displayTitle: asset.id },
      mainFile: { id: 'file-1', links: {} },
      mainFileSingleUse: null,
    },
  ] as never)
  await eventually(() => expect(ui.store.getQueueItems(queueId)[0]?.canEditMetadata).toBe(true))
  const { uploadsRunning } = await import('@/domains/coreDam/asset/composables/uploadsRunning')
  const api = await import('@/domains/coreDam/asset/api/assetApi')

  return {
    ...ui,
    row: () => ui.store.getQueueItems(queueId)[0],
    uploadsRunning,
    save: () => api.bulkUpdateAssetsMetadata(ui.store.getQueueItems(queueId)),
  }
}

describe.each([
  ['upload', 'global'],
  ['mass edit', 'edit'],
])('the application, with a row of the %s queue', (_which, queueId) => {
  it('lets the browser ask before it goes while a custom field typed into the row is not saved', async () => {
    const app = await openAppWithRowOf(queueId)

    app.row().customData = { ...app.row().customData, title: 'typed' }

    expect([windowAsksBeforeItGoes(), app.uploadsRunning()]).toEqual([true, false])
  })

  it('lets the browser ask while keywords or the single use switch picked in the row are not saved', async () => {
    const app = await openAppWithRowOf(queueId)

    app.row().keywords = ['keyword-picked']
    expect(windowAsksBeforeItGoes()).toBe(true)
    app.row().keywords = ['keyword-server']
    app.row().mainFileSingleUse = true
    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  it('lets the window go without asking while the row holds what the server has', async () => {
    const app = await openAppWithRowOf(queueId)

    expect(windowAsksBeforeItGoes()).toBe(false)
    app.row().customData = { title: 'typed' }
    app.row().customData = { title: 'from the server' }
    expect(windowAsksBeforeItGoes()).toBe(false)
  })

  it('stops asking once what was typed is saved', async () => {
    const app = await openAppWithRowOf(queueId)
    app.row().customData = { ...app.row().customData, title: 'typed' }
    expect(windowAsksBeforeItGoes()).toBe(true)

    await app.save()

    expect(windowAsksBeforeItGoes()).toBe(false)
  })

  // Without the right to update assets the queues offer no Save, so what is typed can never be saved (DAM-B26).
  it('lets the window go without asking a user who may not update assets', async () => {
    const app = await openAppWithRowOf(queueId, ['dam_asset_create'])

    app.row().customData = { ...app.row().customData, title: 'typed' }
    app.row().keywords = ['keyword-picked']

    expect(windowAsksBeforeItGoes()).toBe(false)
  })
})

/*
 * Mass operations of the upload queue write into rows whose file the server still processes. Such a row has no
 * form and no metadata yet. Its first metadata keep what the operation wrote, and its Save sends it.
 * A reload meanwhile loses it, and transcoding a video takes minutes.
 */
describe('the application, with a row of an upload the server still processes or has not read yet', () => {
  const openAppWithUpload = async (status: 'processing' | 'uploaded' | 'failed', grants?: string[]) => {
    const ui = await startUploadUi({
      server,
      grants,
      customForm: { image: [customField('title')] },
      queues: { global: [queueRow({ status })] },
    })
    await ui.mount(() => import('@/App.vue'))
    const { uploadsRunning } = await import('@/domains/coreDam/asset/composables/uploadsRunning')

    return {
      ...ui,
      uploadsRunning,
      fillTitle: () =>
        ui.store.queueItemsReplaceEmptyCustomDataValue('global', {
          assetType: 'image',
          elementProperty: 'title',
          value: 'typed for all',
        }),
    }
  }

  it.each(['processing', 'uploaded'] as const)(
    'lets the browser ask while a mass operation wrote into it (%s), and the reload to a new version need not wait',
    async (status) => {
      const app = await openAppWithUpload(status)
      expect(windowAsksBeforeItGoes()).toBe(false)

      app.fillTitle()

      expect([windowAsksBeforeItGoes(), app.uploadsRunning()]).toEqual([true, false])
    }
  )

  it('lets the window go without asking for a row whose file failed: nothing of it can be saved', async () => {
    const app = await openAppWithUpload('failed')

    app.fillTitle()

    expect(windowAsksBeforeItGoes()).toBe(false)
  })

  it('lets the window go without asking a user who may not update assets', async () => {
    const app = await openAppWithUpload('processing', ['dam_asset_create', 'dam_image_create'])

    app.fillTitle()

    expect(windowAsksBeforeItGoes()).toBe(false)
  })
})
