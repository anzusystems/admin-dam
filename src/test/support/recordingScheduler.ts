import type { UploadSettlementScheduler } from '@anzusystems/common-admin'

/**
 * Scheduler that keeps the page timers (the faked ones when a
 * test fakes them) and counts its own timers that still wait.
 * This shows what a queue holds on to, apart from other application timers.
 * Set `uploadSettlementRuntime.scheduler` before the store tracks a row or is told of a notification.
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
