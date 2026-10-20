import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The page that draws a detail reads its asset with no loader when it is told how the server ended the main file - by
 * the row of a queue and by the notification, one after the other: the second is let go while the first read is on its
 * way. A first read that failed left the second, and every later word of the same end, let go as well: the detail held
 * the file as still on its way. A page that reads as the pages of a detail read on such a word, the application around
 * it as it starts; the server is a fake. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SYSTEM_ERROR = 'System error, try again later or contact administrator'

const onServer = (status: 'stored' | 'processed') =>
  assetDetail('asset-1', { mainFile: assetFile('file-1', status, { asset: 'asset-1' }) })

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the detail told that its main file is processed', () => {
  it('reads the asset again on the next word of it when the read of the word before failed', async () => {
    const ui = await startUploadUi({ server })
    const { provideAssetFileChanged, useAssetDetailFileChange } =
      await import('@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange')
    const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
    const detail = useAssetDetailStore()
    const Page = defineComponent({
      setup: () => {
        const { readAfterFileChange } = useAssetDetailFileChange()
        provideAssetFileChanged((byServer) => void readAfterFileChange(async () => undefined, byServer))

        return () => null
      },
    })
    await ui.mount(async () => ({ default: Page }))
    detail.setAsset(onServer('stored') as never)
    let down = true
    server.assetBy('asset-1', () => {
      if (down) throw httpError(500)

      return onServer('processed')
    })

    detail.fileStatusOnServer('asset-1', 'file-1', 'processed')
    await eventually(() => expect(ui.alerts()).toEqual([SYSTEM_ERROR]))
    down = false
    detail.fileStatusOnServer('asset-1', 'file-1', 'processed')

    await eventually(() => expect(detail.asset?.mainFile?.fileAttributes.status).toBe('processed'))
    expect(server.assetReads('asset-1')).toBe(2)
  })
})
