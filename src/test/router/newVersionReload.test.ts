import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// `useSystemBar().newVersion` is flipped by `ASystemBar`, which polls config.json and compares
// `appVersion` to the running one. The guard is what turns that flag into a reload.
const newVersion = ref(false)
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useSystemBar: () => ({ newVersion }),
}))

const reload = vi.fn()

const load = async () => {
  vi.resetModules()
  return await import('@/router/checkNewVersion')
}

beforeEach(() => {
  vi.clearAllMocks()
  newVersion.value = false
  sessionStorage.clear()
  Object.defineProperty(window, 'location', { value: { reload }, writable: true })
})

describe('reload when a new version is deployed', () => {
  it('does nothing while the running version is current', async () => {
    const { checkForNewVersion } = await load()

    expect(checkForNewVersion()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads once the system bar reports a new one', async () => {
    const { checkForNewVersion } = await load()
    newVersion.value = true

    expect(checkForNewVersion()).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload again inside the cooldown', async () => {
    // Fake timers before the first call: the veto grace is scheduled inside it, and a timer already
    // on the real clock is not something `advanceTimersByTime` can reach.
    vi.useFakeTimers()
    try {
      const { checkForNewVersion } = await load()
      newVersion.value = true
      checkForNewVersion()
      reload.mockClear()

      // Past the veto grace, so `reloadRequested` is back to false and only the sessionStorage stamp
      // stops the second call -- which is what keeps a reload that does not take from looping.
      vi.advanceTimersByTime(4_000)

      expect(checkForNewVersion()).toBe(false)
      expect(reload).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
