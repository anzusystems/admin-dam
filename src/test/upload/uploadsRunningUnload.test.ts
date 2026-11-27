import type { UploadQueueItemStatusType } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A reload, a closed window or a reload to a new version kills a file still being sent, and leaves an empty draft.
 * The application asks the browser to ask first, on every page: the upload queues outlive pages.
 * The same check holds back the reload to a new version.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

// The application as `main.ts` mounts it, on a page with no layout of its own.
const openAppWith = async (queueId: string, status: UploadQueueItemStatusType) => {
  const ui = await startUploadUi({ server, queues: { [queueId]: [queueRow({ status })] } })
  const { uploadsRunning } = await import('@/domains/coreDam/asset/composables/uploadsRunning')
  await ui.mount(() => import('@/App.vue'))

  return { ...ui, uploadsRunning }
}

describe('the application, while a queue sends a file', () => {
  it.each([
    ['global', 'waiting'],
    ['global', 'uploading'],
    ['slot-upload-asset-1', 'uploading'],
    ['external-provider-import', 'waiting'],
  ] as const)('lets the browser ask before it goes, for a row of queue %s that is %s', async (queueId, status) => {
    const app = await openAppWith(queueId, status)

    expect([app.uploadsRunning(), windowAsksBeforeItGoes()]).toEqual([true, true])
  })

  it.each(['processing', 'uploaded', 'failed', 'stop', 'loading'] as const)(
    'lets the window go without asking once the server has the file, or there is none to send (%s)',
    async (status) => {
      const app = await openAppWith('global', status)

      expect([app.uploadsRunning(), windowAsksBeforeItGoes()]).toEqual([false, false])
    }
  )

  it('stops asking once the last file is sent', async () => {
    const app = await openAppWith('global', 'uploading')
    expect(windowAsksBeforeItGoes()).toBe(true)

    app.rows.global[0].status = 'processing'

    expect([app.uploadsRunning(), windowAsksBeforeItGoes()]).toEqual([false, false])
  })
})
