import type { UploadSettlementScheduler } from '@anzusystems/common-admin'

/**
 * A scheduler for the settlement of the upload queue that keeps the timers of the page (the faked ones of a test
 * that fakes them) and counts those of its own that still wait: what a queue holds on to, apart from every other
 * timer of the application.
 *
 * Put into `uploadSettlementRuntime.scheduler` before the store tracks a row or is told of a notification.
 */
export function recordingScheduler(): UploadSettlementScheduler & { waiting: () => number } {
  const waiting = new Set<unknown>()

  return {
    now: () => Date.now(),
    setTimeout: (callback, ms) => {
      const handle = globalThis.setTimeout(() => {
        waiting.delete(handle)
        callback()
      }, ms)
      waiting.add(handle)

      return handle
    },
    clearTimeout: (handle) => {
      waiting.delete(handle)
      globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>)
    },
    waiting: () => waiting.size,
  }
}
