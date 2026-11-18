import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Every start evaluates the application anew, and the cases of a file run in one process under one window.
 * Anything that still holds a case after the next one starts keeps its application, stores,
 * library and Vuetify until the file ends. A file of 32 cases grew to 2.5 GB that way.
 * This is checked with the node garbage collector.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const collectGarbage = () => {
  setFlagsFromString('--expose-gc')
  ;(runInNewContext('gc') as () => void)()
}

/**
 * Runs a case with a library component mounted, then stops it.
 * Returns by-name references that must not hold its parts: the application
 * router, the library evaluated for it, and the theme settings.
 */
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
    server = createFakeDam()
    await startUploadUi({ server })
    stopUploadUi()

    // Vue stops keeping components for its devtools three seconds after its first application.
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
