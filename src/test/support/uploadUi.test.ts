import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* Every start evaluates the application anew, and the cases of a file run one after another in one process, under
 * one window: whatever holds on to a case once the next one has started keeps it - its application, its stores, the
 * library and Vuetify as they were evaluated for it - until the file ends. A file of 32 cases grew to 2.5 GB that
 * way. Asked here of the garbage collector of node itself. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

/** Collects what nothing holds any more: node hands out its collector when asked to. */
const collectGarbage = () => {
  setFlagsFromString('--expose-gc')
  ;(runInNewContext('gc') as () => void)()
}

/** A case with a component of the library mounted, stopped. Answers, by name, references that do not hold its
 * parts: the router of its application, the library evaluated for it, and the settings of the theme in it. */
const stoppedCase = async () => {
  const ui = await startUploadUi({ server })
  await ui.mount(async () => ({ default: ui.library.ADamAssetFileFailReasonChip }), { reason: 'unknown' })
  const parts = {
    router: new WeakRef(ui.router),
    library: new WeakRef(ui.library),
    theme: new WeakRef(ui.library.useTheme().settings),
  }
  stopUploadUi()

  return parts
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('a case of the upload tests', () => {
  it('leaves nothing of itself held once the next one started: its application, the library, the theme', async () => {
    const parts = await stoppedCase()
    // The next case, as a file starts it: with a server of its own.
    server = createFakeDam()
    await startUploadUi({ server })
    stopUploadUi()

    // Vue gives up keeping components for its devtools only three seconds after its first application.
    await vi.waitFor(
      () => {
        collectGarbage()
        expect(
          Object.entries(parts)
            .filter(([, part]) => part.deref())
            .map(([name]) => name)
        ).toEqual([])
      },
      { timeout: 15_000, interval: 200 }
    )
  })
})
