import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The cancel of a row, as the list hears it: the event of the row names the queue, and the upload is stopped in
 * that one. The list is mounted over the real store; the row is a stand-in with only the button, which names a
 * queue of its own choice. That a real row names the queue it is in is in `queueRowActions.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      inheritAttrs: false,
      props: { item: { type: Object, required: true }, index: { type: Number, required: true } },
      emits: ['cancelItem'],
      setup: (props, { emit }) => {
        return () =>
          h('button', {
            'data-cancel': '',
            onClick: () => emit('cancelItem', { index: props.index, item: props.item, queueId: 'slots' }),
          })
      },
    }),
  }
})

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the list of a queue', () => {
  it('stops the upload of a row in the queue its cancel names, not in its own', async () => {
    const ui = await startUploadUi({
      server,
      queues: { global: [queueRow({ status: 'processing' })], slots: [] },
    })
    const stopped = vi.spyOn(ui.store, 'stopItemUpload')
    const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
      queueId: 'global',
      massOperations: false,
    })

    list.querySelector<HTMLButtonElement>('[data-cancel]')!.click()

    expect(stopped.mock.calls).toEqual([['slots', ui.rows.global[0]]])
  })
})
