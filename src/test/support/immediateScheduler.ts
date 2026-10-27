import { UPLOAD_POLL_SCHEDULE } from '@anzusystems/common-admin'
import type { UploadSettlementScheduler } from '@anzusystems/common-admin'

const NOTIFICATION_WAIT_MS = 2000

/**
 * Scheduler for tests of the store that are not about time.
 * A wait up to a notification's length ends in the next microtask, a longer one never. So
 * notification writes are done when its promise resolves, and the queue poll never reads.
 * Set `uploadSettlementRuntime.scheduler` before the store tracks a row or is told of a notification.
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
