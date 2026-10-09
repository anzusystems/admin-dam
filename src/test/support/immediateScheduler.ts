import { UPLOAD_POLL_SCHEDULE } from '@anzusystems/common-admin'
import type { UploadSettlementScheduler } from '@anzusystems/common-admin'

// The longest wait a notification asks for before its read: the one of the metadata notification.
const NOTIFICATION_WAIT_MS = 2000

/**
 * A scheduler for the settlement of the upload queue, for the tests of the store that are not about time: a wait
 * as long as a notification's is over in the next microtask, a longer one never. So what a notification asks for
 * is written by the time its promise resolves, and the poll of a queue never reads.
 *
 * Put into `uploadSettlementRuntime.scheduler` before the store tracks a row or is told of a notification.
 */
export function immediateScheduler(): UploadSettlementScheduler {
  if (UPLOAD_POLL_SCHEDULE.dense.marksMs[0] <= NOTIFICATION_WAIT_MS) {
    throw new Error('immediateScheduler: the first read of the poll is no longer than the wait of a notification')
  }
  let lastHandle = 0
  const waiting = new Set<number>()

  return {
    now: () => Date.now(),
    setTimeout: (callback, ms) => {
      const handle = ++lastHandle
      if (ms > NOTIFICATION_WAIT_MS) return handle
      waiting.add(handle)
      queueMicrotask(() => {
        if (waiting.delete(handle)) callback()
      })

      return handle
    },
    clearTimeout: (handle) => {
      waiting.delete(handle as number)
    },
  }
}
