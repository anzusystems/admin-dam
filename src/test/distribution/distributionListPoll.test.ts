import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'

/* The distribution tab of an asset without the notification server: while a listed distribution is under way,
 * the tab reads its list again on its own. The real tab over the real store and the real request, a fake server
 * and a fake clock; the rows and the dialogs of the tab are replaced by stand-ins. What a notification does to
 * the list is in `appInitialize/notificationEvents.test.ts`. */

let server: FakeDam
// Every GET with its query and the moment it was sent: the fake server keeps neither.
const asked: Array<{ url: string; at: number; signal: AbortSignal | undefined }> = []
const alerts = vi.hoisted(() => ({ showErrorsDefault: vi.fn() }))
// The fake server refuses a request once its signal is aborted, as axios does. A case can have the next request
// sent without its signal: its answer then comes although the read was given up, as one already on its way back.
let nextAnswersAfterAbort = false

vi.mock('@/shared/apiClients/damClient', () => ({
  damClient: () => ({
    ...server.client,
    get: (url: string, config?: { signal?: AbortSignal }) => {
      asked.push({ url, at: Date.now(), signal: config?.signal })
      if (!nextAnswersAfterAbort) return server.client.get(url, config)
      nextAnswersAfterAbort = false

      return server.client.get(url, { ...config, signal: undefined })
    },
  }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>
  const { defineComponent, h, inject } = await import('vue')

  return {
    ...original,
    useAlerts: () => alerts,
    useDamConfigState: () => ({ getDamConfigExtSystem: () => undefined }),
    // The real one turns the page and says so; this one always turns to the second.
    ADatatablePagination: defineComponent({
      emits: ['change'],
      setup(_props, { emit }) {
        const pagination = inject(original.DatatablePaginationKey as symbol) as { value: { page: number } }

        return () =>
          h('button', {
            'data-next-page': '',
            onClick: () => {
              pagination.value = { ...pagination.value, page: 2 }
              emit('change')
            },
          })
      },
    }),
  }
})
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/components/detail/composables/assetDetailDistributionDialog', async () => {
  const { ref } = await import('vue')

  return {
    useAssetDetailDistributionDialog: () => ({ dialogNew: ref(false), openNew: () => undefined, dialogKey: ref(1) }),
    useDistributionServiceAllowed: () => () => true,
  }
})
vi.mock('@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/forms/DistributionManage.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/DistributionCancelDialog.vue', () => ({
  default: { render: () => null },
}))
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/DistributionListItem.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      props: { item: { type: Object, required: true } },
      setup: (props) => () => h('div', { 'data-row': '' }, `${props.item.id}:${props.item.status}`),
    }),
  }
})
// Stands for everything after which the tab reads its list again: a distribution created, cancelled or managed.
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/DistributionNewDialog.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      emits: ['reloadList'],
      setup:
        (_props, { emit }) =>
        () =>
          h('button', { 'data-reload': '', onClick: () => emit('reloadList') }),
    }),
  }
})

const AssetDetailSidebarDistribution = (
  await import('@/domains/coreDam/asset/components/detail/components/distribution/AssetDetailSidebarDistribution.vue')
).default
const { useDistributionListStore } = await import('@/domains/coreDam/asset/store/distributionListStore')
const { defaultApiErrorLogger, setApiErrorLogger } = await import('@anzusystems/common-admin')
const { DISTRIBUTION_LIST_POLL, distributionListPollDelay } =
  await import('@/domains/coreDam/asset/composables/distributionListPoll')

const LIST = /^\/adm\/v1\/distribution\/asset\/asset-1$/
const LIST_OF_THE_NEXT_ASSET = /^\/adm\/v1\/distribution\/asset\/asset-2$/
const SECOND = 1000
const MINUTE = 60 * SECOND
/** Longer than any distance between two reads. */
const LONG = 60 * MINUTE
const FIRST_STEP = DISTRIBUTION_LIST_POLL.early.every / SECOND
const LAST_STEP = DISTRIBUTION_LIST_POLL.late.every / SECOND
/** The longest wait after a failed read. */
const LAST_FAILURE_STEP = Math.max(...DISTRIBUTION_LIST_POLL.afterFailure) / SECOND

const distribution = (id: string, status: string) => ({ id, status, distributionService: 'youtube_main', extId: '' })

/** What becomes of a request the poll gave up: `true` for one whose answer comes all the same. */
const GIVEN_UP: Array<[string, boolean]> = [
  ['is refused at once, as in a browser', false],
  ['is answered all the same', true],
]

/** What the server lists for the asset; a case changes it as the distributions move on. */
let listed: ReturnType<typeof distribution>[] = []
const listAnswer = (): FakeDamAnswer => ({ status: 200, data: { data: listed } })

let app: App | undefined
let mountedAt = 0
let visibility: 'visible' | 'hidden' = 'visible'

const settle = async () => {
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()
}

/** The store of the list belongs to the app, not to a tab: the tab of the next asset is mounted over the same one. */
const mountTab = async (assetId = 'asset-1', pinia = createPinia()) => {
  setActivePinia(pinia)
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetDetailSidebarDistribution, {
    isActive: true,
    assetType: 'video',
    assetId,
    assetMainFileStatus: 'processed',
  })
  app.use(pinia)
  app.use(createVuetify({ components, aliases: { ABtnPrimary: components.VBtn, ABtnTertiary: components.VBtn } }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  mountedAt = Date.now()
  app.mount(root)
  await settle()

  return {
    pinia,
    store: useDistributionListStore(),
    rows: () => Array.from(root.querySelectorAll('[data-row]')).map((row) => row.textContent),
    spinning: () => root.querySelector('.v-progress-circular') !== null,
    /** What the tab does after a distribution was created, cancelled or managed. */
    reload: () => root.querySelector<HTMLButtonElement>('[data-reload]')?.click(),
    nextPage: () => root.querySelector<HTMLButtonElement>('[data-next-page]')?.click(),
  }
}

const reads = () => asked.filter((request) => LIST.test(request.url.split('?')[0]))
/** When the list was read, in seconds since the tab was mounted. */
const readAt = () => reads().map((request) => (request.at - mountedAt) / SECOND)

const becomes = async (state: 'visible' | 'hidden') => {
  visibility = state
  document.dispatchEvent(new Event('visibilitychange'))
  await settle()
}

const now = () => (Date.now() - mountedAt) / SECOND

/** Lets time pass until the list is asked for once more. The cases wait for a read, not for a delay. */
const untilNextRead = async () => {
  const before = reads().length
  for (let waited = 0; waited < 10 * MINUTE && reads().length === before; waited += SECOND) {
    await vi.advanceTimersByTimeAsync(SECOND)
  }
  await nextTick()
  expect(reads()).toHaveLength(before + 1)
}

/** Holds the next read of the list open until the case lets it go. */
const holdNextRead = (answersAfterAbort = false, list = LIST) => {
  let release: (answer?: FakeDamAnswer) => void = () => undefined
  let held = false
  nextAnswersAfterAbort = answersAfterAbort
  server.on('GET', list, () => {
    if (held) return listAnswer()
    held = true

    return new Promise<FakeDamAnswer>((resolve) => {
      release = (answer = listAnswer()) => resolve(answer)
    })
  })

  return {
    release: async (answer?: FakeDamAnswer) => {
      release(answer)
      await settle()
    },
  }
}

const POLL_FILE = '/composables/distributionListPoll.ts'

/**
 * Stands in front of `target[name]` for one case and keeps the calls made from the poll's own file, with what they
 * were answered. Vuetify and the library set timers and listen on the document too: theirs are not kept.
 */
const callsFromThePoll = (target: object, name: string) => {
  const original = Reflect.get(target, name) as (...args: unknown[]) => unknown
  const wasOwn = Object.prototype.hasOwnProperty.call(target, name)
  const calls: Array<{ args: unknown[]; result: unknown }> = []
  Reflect.set(target, name, (...args: unknown[]) => {
    // The first line is the message, the second this function, the third whoever called it.
    const caller = new Error('who called').stack?.split('\n')[2] ?? ''
    const result = original.apply(target, args)
    if (caller.includes(POLL_FILE)) calls.push({ args, result })

    return result
  })

  return {
    calls,
    last: () => calls[calls.length - 1],
    restore: () => (wasOwn ? Reflect.set(target, name, original) : Reflect.deleteProperty(target, name)),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  asked.length = 0
  nextAnswersAfterAbort = false
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
  server = createFakeDam()
  listed = []
  server.on('GET', LIST, listAnswer)
})

afterEach(() => {
  setApiErrorLogger(defaultApiErrorLogger)
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  Reflect.deleteProperty(document, 'visibilityState')
  vi.useRealTimers()
})

describe('the rhythm of reading the distribution list again', () => {
  it('is 15 s for the first half minute, 30 s until five minutes, a minute after that', () => {
    expect(DISTRIBUTION_LIST_POLL).toEqual({
      early: { until: 30 * SECOND, every: 15 * SECOND },
      regular: { until: 5 * MINUTE, every: 30 * SECOND },
      late: { every: MINUTE },
      afterFailure: [15 * SECOND, 30 * SECOND, MINUTE, 2 * MINUTE, 5 * MINUTE],
    })
    expect(
      [0, 15, 29.9, 30, 60, 299, 300, 3600].map((age) => distributionListPollDelay(age * SECOND) / SECOND)
    ).toEqual([15, 15, 15, 30, 30, 30, 60, 60])
  })

  it('is no shorter than 15, 30, 60, 120 and then 300 s after reads that failed in a row', () => {
    const afterFailures = (age: number) =>
      [0, 1, 2, 3, 4, 5, 6, 50].map((failures) => distributionListPollDelay(age * SECOND, failures) / SECOND)

    expect(afterFailures(0)).toEqual([15, 15, 30, 60, 120, 300, 300, 300])
    // Never shorter than the rhythm itself.
    expect(afterFailures(3600)).toEqual([60, 60, 60, 60, 120, 300, 300, 300])
  })

  it('makes the tab read at 15 s and 30 s, then every 30 s until five minutes, then every minute, with no end', async () => {
    listed = [distribution('dist-1', 'distributing')]
    await mountTab()

    await vi.advanceTimersByTimeAsync(10 * MINUTE)

    expect(readAt()).toEqual([0, 15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 360, 420, 480, 540, 600])

    await vi.advanceTimersByTimeAsync(3 * 60 * MINUTE)

    expect(readAt().slice(-3)).toEqual([11280, 11340, 11400])
  })

  it('makes the tab read less and less often while its reads fail, down to once in five minutes', async () => {
    listed = [distribution('dist-1', 'distributing')]
    await mountTab()
    server.on('GET', LIST, () => {
      throw new Error('the server is down')
    })

    await vi.advanceTimersByTimeAsync(20 * MINUTE)

    expect(readAt()).toEqual([0, 15, 30, 60, 120, 240, 540, 840, 1140])
  })
})

describe('the distribution tab, while a listed distribution is under way', () => {
  it.each(['waiting', 'distributing', 'remote_processing'])('reads its list again: %s', async (status) => {
    listed = [distribution('dist-1', 'distributed'), distribution('dist-2', status)]
    await mountTab()
    expect(reads()).toHaveLength(1)

    await untilNextRead()
    await untilNextRead()
  })

  it('asks for what the tab asked for when it opened, and shows what comes back', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { store, rows } = await mountTab()
    expect(rows()).toEqual(['dist-1:waiting'])

    listed = [distribution('dist-2', 'waiting'), distribution('dist-1', 'distributing')]
    await untilNextRead()

    expect(reads()[1].url).toBe(reads()[0].url)
    expect(rows()).toEqual(['dist-2:waiting', 'dist-1:distributing'])
    expect(store.list.map((item) => item.id)).toEqual(['dist-2', 'dist-1'])
  })

  it('reads behind the list, without the loader of a read the user asked for', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { store, rows, spinning } = await mountTab()
    const read = holdNextRead()

    await untilNextRead()

    expect(store.loader).toBe(false)
    expect(spinning()).toBe(false)
    expect(rows()).toEqual(['dist-1:waiting'])

    await read.release()
  })

  it('sends one read at a time, however long the answer takes, and the next one a while after the answer', async () => {
    listed = [distribution('dist-1', 'waiting')]
    await mountTab()
    const read = holdNextRead()
    await untilNextRead()

    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(2)

    await read.release()
    expect(reads()).toHaveLength(2)
    const answeredAt = now()
    await untilNextRead()

    expect(now() - answeredAt).toBe(LAST_STEP)
  })

  it('sends no second read while one is on its way, whatever happens meanwhile', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { store } = await mountTab()
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => ({
      status: 200,
      data: distribution('dist-1', 'failed'),
    }))
    const read = holdNextRead()
    await untilNextRead()

    // The window comes back.
    await becomes('hidden')
    await becomes('visible')
    // A notification finishes the distribution and another one puts it under way again.
    await store.listItemMessageUpdate('dist-1', 'failed')
    await store.listItemMessageUpdate('dist-1', 'distributing')
    await vi.advanceTimersByTimeAsync(LONG)

    expect(reads()).toHaveLength(2)
    await read.release()
  })

  it('says nothing about a read that failed, keeps the list and goes on reading', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { rows } = await mountTab()
    server.on('GET', LIST, () => {
      throw new Error('the server is down')
    })

    await untilNextRead()
    await untilNextRead()

    expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
    expect(rows()).toEqual(['dist-1:waiting'])
  })

  // The reads that fail after the first say the same again: the poll asks for them not to be written down.
  it('has the first of its reads that fail in a row written down, and none after it until one succeeds', async () => {
    const written = vi.fn()
    setApiErrorLogger(written)
    listed = [distribution('dist-1', 'waiting')]
    await mountTab()
    const down = () => {
      throw new Error('the server is down')
    }
    server.on('GET', LIST, down)

    await untilNextRead()
    await settle()
    expect(written).toHaveBeenCalledTimes(1)

    await untilNextRead()
    await untilNextRead()
    await settle()
    expect(written).toHaveBeenCalledTimes(1)

    server.on('GET', LIST, listAnswer)
    await untilNextRead()
    server.on('GET', LIST, down)
    await untilNextRead()
    await settle()

    expect(written).toHaveBeenCalledTimes(2)
    expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
  })

  it('is back in its rhythm after a read that succeeded', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { rows } = await mountTab()
    let down = true
    server.on('GET', LIST, () => {
      if (down) throw new Error('the server is down')

      return listAnswer()
    })
    for (let failed = 0; failed < DISTRIBUTION_LIST_POLL.afterFailure.length; failed++) await untilNextRead()
    const lastFailedAt = now()

    down = false
    listed = [distribution('dist-1', 'distributing')]
    await untilNextRead()
    const succeededAt = now()
    expect(succeededAt - lastFailedAt).toBe(LAST_FAILURE_STEP)
    expect(rows()).toEqual(['dist-1:distributing'])

    await untilNextRead()
    expect(now() - succeededAt).toBe(LAST_STEP)
    expect(LAST_STEP).toBeLessThan(LAST_FAILURE_STEP)
  })
})

describe('the distribution tab, when a notification changes a row while a read is on its way', () => {
  it('keeps what the notification wrote, not the older answer, and reads again as usual', async () => {
    listed = [distribution('dist-1', 'waiting'), distribution('dist-2', 'waiting')]
    const { store, rows } = await mountTab()
    const read = holdNextRead()
    await untilNextRead()

    // What the listener calls for `distribution_distributing`: the row changes without a request.
    await store.listItemMessageUpdate('dist-1', 'distributing')
    await nextTick()
    expect(rows()).toEqual(['dist-1:distributing', 'dist-2:waiting'])

    // The answer was read off the server before the change.
    await read.release({
      status: 200,
      data: { data: [distribution('dist-1', 'waiting'), distribution('dist-2', 'waiting')] },
    })
    expect(rows()).toEqual(['dist-1:distributing', 'dist-2:waiting'])
    expect(store.list.map((item) => item.status)).toEqual(['distributing', 'waiting'])

    listed = [distribution('dist-1', 'remote_processing'), distribution('dist-2', 'distributing')]
    await untilNextRead()
    expect(rows()).toEqual(['dist-1:remote_processing', 'dist-2:distributing'])
  })

  it('keeps a distribution the notification finished as it finished, and reads no more', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { store, rows } = await mountTab()
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => ({
      status: 200,
      data: { ...distribution('dist-1', 'distributed'), extId: 'remote-7' },
    }))
    const read = holdNextRead()
    await untilNextRead()

    await store.listItemMessageUpdate('dist-1', 'distributed')
    await read.release({ status: 200, data: { data: [distribution('dist-1', 'distributing')] } })

    expect(store.list[0]).toMatchObject({ status: 'distributed', extId: 'remote-7' })
    expect(rows()).toEqual(['dist-1:distributed'])

    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(2)
  })

  it('takes the answer when the notification was about a distribution the list does not show', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { store, rows } = await mountTab()
    const read = holdNextRead()
    await untilNextRead()

    await store.listItemMessageUpdate('dist-9', 'distributing')
    listed = [distribution('dist-1', 'distributing')]
    await read.release()

    expect(rows()).toEqual(['dist-1:distributing'])
  })
})

describe('the distribution tab, when no listed distribution is under way', () => {
  it('reads its list once and never again', async () => {
    listed = [distribution('dist-1', 'distributed'), distribution('dist-2', 'failed')]
    await mountTab()

    await vi.advanceTimersByTimeAsync(LONG)

    expect(reads()).toHaveLength(1)
  })

  it('reads nothing again for an asset without distributions', async () => {
    await mountTab()

    await vi.advanceTimersByTimeAsync(LONG)

    expect(reads()).toHaveLength(1)
  })

  it('stops reading once a read finds every distribution finished', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { rows } = await mountTab()
    await untilNextRead()

    listed = [distribution('dist-1', 'distributed')]
    await untilNextRead()
    expect(rows()).toEqual(['dist-1:distributed'])

    await vi.advanceTimersByTimeAsync(LONG)

    expect(reads()).toHaveLength(3)
  })

  it('stops reading when a notification finishes the last one, and starts when one puts it under way', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { store } = await mountTab()
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => ({
      status: 200,
      data: distribution('dist-1', 'failed'),
    }))

    // What the listener of the notifications calls.
    await store.listItemMessageUpdate('dist-1', 'failed')
    await vi.advanceTimersByTimeAsync(LONG)
    expect(store.list[0].status).toBe('failed')
    expect(reads()).toHaveLength(1)

    await store.listItemMessageUpdate('dist-1', 'distributing')
    const underWayAt = now()
    await untilNextRead()

    // From the beginning of the rhythm: the distribution is seen under way only now.
    expect(now() - underWayAt).toBe(FIRST_STEP)
    await untilNextRead()
  })
})

describe('the distribution tab, when a distribution gets under way after reads had failed', () => {
  it('starts from the first step: the failures belonged to the reads before', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { store } = await mountTab()
    server.on('GET', LIST, () => {
      throw new Error('the server is down')
    })
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => ({
      status: 200,
      data: distribution('dist-1', 'failed'),
    }))
    for (let failed = 0; failed < DISTRIBUTION_LIST_POLL.afterFailure.length; failed++) await untilNextRead()

    await store.listItemMessageUpdate('dist-1', 'failed')
    await store.listItemMessageUpdate('dist-1', 'distributing')
    const underWayAt = now()
    await untilNextRead()

    expect(now() - underWayAt).toBe(FIRST_STEP)
  })
})

describe('the distribution tab, once it is closed', () => {
  it('reads nothing any more', async () => {
    listed = [distribution('dist-1', 'distributing')]
    await mountTab()
    await untilNextRead()

    app?.unmount()
    app = undefined

    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(2)

    // Coming back to the window does not wake it up either.
    await becomes('hidden')
    await becomes('visible')
    expect(reads()).toHaveLength(2)
  })

  it.each(GIVEN_UP)(
    'stops the read that is on its way, which %s, and does not take its answer',
    async (_how, answered) => {
      listed = [distribution('dist-1', 'distributing')]
      const { store } = await mountTab()
      const read = holdNextRead(answered)
      await untilNextRead()

      app?.unmount()
      app = undefined
      expect(reads()[1].signal?.aborted).toBe(true)

      listed = [distribution('dist-1', 'distributed')]
      await read.release()

      expect(store.list.map((item) => item.status)).toEqual(['distributing'])
      await vi.advanceTimersByTimeAsync(LONG)
      expect(reads()).toHaveLength(2)
    }
  )

  it('reads nothing when it was closed while a read the user asked for was on its way', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { reload } = await mountTab()
    const read = holdNextRead()
    reload()
    await settle()
    expect(reads()).toHaveLength(2)

    app?.unmount()
    app = undefined
    await read.release()

    await vi.advanceTimersByTimeAsync(LONG)
    await becomes('hidden')
    await becomes('visible')
    expect(reads()).toHaveLength(2)
  })

  it('reads nothing when it was closed while the read of its opening was on its way', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const read = holdNextRead()
    await mountTab()
    expect(reads()).toHaveLength(1)

    app?.unmount()
    app = undefined
    await read.release()

    await vi.advanceTimersByTimeAsync(LONG)
    await becomes('hidden')
    await becomes('visible')
    expect(reads()).toHaveLength(1)
  })
})

describe('the distribution tab, when a read the user asked for fails', () => {
  // The list is this asset's own: emptied, it would also end the reading behind it, for good.
  it.each([
    ['a reload', (tab: Awaited<ReturnType<typeof mountTab>>) => tab.reload()],
    ['the next page', (tab: Awaited<ReturnType<typeof mountTab>>) => tab.nextPage()],
  ])('shows the error and keeps the list it had, and goes on reading behind it: %s', async (_name, ask) => {
    // A full page with one after it, so that the tab offers the next.
    const page = (status: string) =>
      Array.from({ length: 25 }, (_value, index) => distribution('dist-' + index, status))
    listed = page('distributing')
    server.on('GET', LIST, () => ({ status: 200, data: { data: listed, hasNextPage: true } }))
    const tab = await mountTab()
    server.on('GET', LIST, () => {
      throw new Error('the server is down')
    })

    ask(tab)
    await settle()

    expect(alerts.showErrorsDefault).toHaveBeenCalledTimes(1)
    expect([tab.rows().length, tab.rows()[0], tab.spinning()]).toEqual([25, 'dist-0:distributing', false])

    listed = page('distributed')
    server.on('GET', LIST, listAnswer)
    await untilNextRead()

    expect(tab.rows()[0]).toBe('dist-0:distributed')
  })
})

describe('the distribution tab of the next asset, when the read of its opening fails', () => {
  // The store of the list is shared: what the tab before left there is not this asset's.
  it('shows the error and nothing of the asset before', async () => {
    listed = [distribution('dist-1', 'distributed')]
    const before = await mountTab()
    expect(before.rows()).toEqual(['dist-1:distributed'])
    app?.unmount()
    app = undefined
    server.on('GET', LIST_OF_THE_NEXT_ASSET, () => {
      throw new Error('the server is down')
    })

    const next = await mountTab('asset-2', before.pinia)

    expect(alerts.showErrorsDefault).toHaveBeenCalledTimes(1)
    expect([next.rows(), next.store.list, next.spinning()]).toEqual([[], [], false])
  })
})

describe('the distribution tab closed while its own read is on its way, and the tab of the next asset', () => {
  const ofTheNextAsset: FakeDamAnswer = { status: 200, data: { data: [distribution('next-1', 'distributed')] } }
  const readsOfTheNextAsset = () => asked.filter((request) => LIST_OF_THE_NEXT_ASSET.test(request.url.split('?')[0]))

  it.each(GIVEN_UP)(
    'the read is given up; when it %s, the next tab is still loading and then shows its own list',
    async (_how, answered) => {
      listed = [distribution('dist-1', 'distributing')]
      const closedTabsRead = holdNextRead(answered)
      const { pinia } = await mountTab()
      app?.unmount()
      app = undefined
      expect(reads()[0].signal?.aborted).toBe(true)

      const ownRead = holdNextRead(false, LIST_OF_THE_NEXT_ASSET)
      const next = await mountTab('asset-2', pinia)
      expect(next.spinning()).toBe(true)

      await closedTabsRead.release()

      expect(next.store.loader).toBe(true)
      expect(next.spinning()).toBe(true)
      expect(next.store.list).toEqual([])
      expect(alerts.showErrorsDefault).not.toHaveBeenCalled()

      await ownRead.release(ofTheNextAsset)

      expect(next.spinning()).toBe(false)
      expect(next.rows()).toEqual(['next-1:distributed'])
    }
  )

  it.each(GIVEN_UP)(
    'the read is given up; when it %s after the next tab has its list, that list stays',
    async (_how, answered) => {
      listed = [distribution('dist-1', 'distributing')]
      const closedTabsRead = holdNextRead(answered)
      const { pinia } = await mountTab()
      app?.unmount()
      app = undefined

      server.on('GET', LIST_OF_THE_NEXT_ASSET, () => ofTheNextAsset)
      const next = await mountTab('asset-2', pinia)
      expect(next.rows()).toEqual(['next-1:distributed'])

      await closedTabsRead.release()

      expect(next.rows()).toEqual(['next-1:distributed'])
      expect(next.store.list.map((item) => item.id)).toEqual(['next-1'])
      expect(next.spinning()).toBe(false)
      expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
      // Nothing under way was put into the next tab, so it has nothing to read again.
      await vi.advanceTimersByTimeAsync(LONG)
      expect(readsOfTheNextAsset()).toHaveLength(1)
    }
  )

  it.each(GIVEN_UP)('a read the user asked for is given up as well (it %s)', async (_how, answered) => {
    listed = [distribution('dist-1', 'distributed')]
    const { pinia, reload } = await mountTab()
    const closedTabsRead = holdNextRead(answered)
    listed = [distribution('dist-1', 'distributing')]
    reload()
    await settle()
    app?.unmount()
    app = undefined
    expect(reads()[1].signal?.aborted).toBe(true)

    server.on('GET', LIST_OF_THE_NEXT_ASSET, () => ofTheNextAsset)
    const next = await mountTab('asset-2', pinia)
    await closedTabsRead.release()

    expect(next.rows()).toEqual(['next-1:distributed'])
    expect(next.spinning()).toBe(false)
    expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
  })
})

describe('what the poll of the distribution tab leaves behind', () => {
  it('takes the listener it put on the document off again when the tab is closed', async () => {
    const listening = callsFromThePoll(document, 'addEventListener')
    const removed = vi.spyOn(document, 'removeEventListener')
    try {
      listed = [distribution('dist-1', 'distributing')]
      await mountTab()
      expect(listening.calls.map((call) => call.args[0])).toEqual(['visibilitychange'])
      const listener = listening.calls[0].args[1]
      const takenOff = () =>
        removed.mock.calls.some(([type, taken]) => type === 'visibilitychange' && taken === listener)
      expect(takenOff()).toBe(false)

      app?.unmount()
      app = undefined

      expect(takenOff()).toBe(true)
    } finally {
      listening.restore()
      removed.mockRestore()
    }
  })

  it('clears the timer it set when the window is hidden and when the tab is closed', async () => {
    const timers = callsFromThePoll(globalThis, 'setTimeout')
    const cleared = vi.spyOn(globalThis, 'clearTimeout')
    const clearedNow = (timer: unknown) => cleared.mock.calls.some(([handle]) => handle === timer)
    try {
      listed = [distribution('dist-1', 'distributing')]
      await mountTab()
      const beforeHiding = timers.last()?.result
      expect(beforeHiding).toBeDefined()
      cleared.mockClear()

      await becomes('hidden')
      expect(clearedNow(beforeHiding)).toBe(true)

      // Back in the window the list is read at once, and the next read gets a timer of its own.
      await becomes('visible')
      const beforeClosing = timers.last()?.result
      expect(beforeClosing).not.toBe(beforeHiding)
      cleared.mockClear()

      app?.unmount()
      app = undefined

      expect(clearedNow(beforeClosing)).toBe(true)
    } finally {
      timers.restore()
      cleared.mockRestore()
    }
  })

  it('sets no timer of its own while nothing listed is under way', async () => {
    const timers = callsFromThePoll(globalThis, 'setTimeout')
    try {
      listed = [distribution('dist-1', 'distributed')]
      await mountTab()
      await vi.advanceTimersByTimeAsync(LONG)

      expect(timers.calls).toEqual([])
    } finally {
      timers.restore()
    }
  })
})

describe('the distribution tab in a hidden window', () => {
  it('reads nothing, reads at once when the window is back and goes on from there', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { rows } = await mountTab()
    await untilNextRead()

    await becomes('hidden')
    listed = [distribution('dist-1', 'remote_processing')]
    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(2)

    await becomes('visible')
    expect(reads()).toHaveLength(3)
    expect(rows()).toEqual(['dist-1:remote_processing'])

    // The hidden time counts: the rhythm is where it would have been by now, not at its beginning.
    const backAt = now()
    await untilNextRead()
    expect(now() - backAt).toBe(LAST_STEP)
  })

  it('takes the answer of a read sent before the window was hidden, and reads again only when it is back', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { rows } = await mountTab()
    const read = holdNextRead()
    await untilNextRead()

    await becomes('hidden')
    listed = [distribution('dist-1', 'distributing')]
    await read.release()
    expect(rows()).toEqual(['dist-1:distributing'])

    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(2)

    await becomes('visible')
    expect(reads()).toHaveLength(3)
  })

  it('opened in a hidden window reads its list for the user, and on its own only once the window is shown', async () => {
    visibility = 'hidden'
    listed = [distribution('dist-1', 'distributing')]
    const { rows } = await mountTab()
    expect(reads()).toHaveLength(1)
    expect(rows()).toEqual(['dist-1:distributing'])

    listed = [distribution('dist-1', 'remote_processing')]
    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(1)

    await becomes('visible')
    expect(reads()).toHaveLength(2)
    expect(rows()).toEqual(['dist-1:remote_processing'])
    await untilNextRead()
  })

  it('does not read when the window is back and every distribution is finished', async () => {
    listed = [distribution('dist-1', 'distributed')]
    await mountTab()

    await becomes('hidden')
    await becomes('visible')

    expect(reads()).toHaveLength(1)
  })
})

describe('the distribution tab, when the user makes it read its list', () => {
  it('starts the rhythm again from that read', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { reload } = await mountTab()
    await vi.advanceTimersByTimeAsync(LONG)
    const before = readAt().slice(-2)
    expect(before[1] - before[0]).toBe(LAST_STEP)

    reload()
    await settle()
    const reloadedAt = now()
    await untilNextRead()

    expect(now() - reloadedAt).toBe(FIRST_STEP)
  })

  it('forgets the reads that failed before it', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { reload } = await mountTab()
    let down = true
    server.on('GET', LIST, () => {
      if (down) throw new Error('the server is down')

      return listAnswer()
    })
    for (let failed = 0; failed < DISTRIBUTION_LIST_POLL.afterFailure.length; failed++) await untilNextRead()

    down = false
    reload()
    await settle()
    const reloadedAt = now()
    await untilNextRead()

    expect(now() - reloadedAt).toBe(FIRST_STEP)
  })

  it('reads nothing on its own while that read is on its way', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { reload, spinning } = await mountTab()
    const read = holdNextRead()

    reload()
    await settle()
    expect(spinning()).toBe(true)
    await vi.advanceTimersByTimeAsync(LONG)
    expect(reads()).toHaveLength(2)

    await read.release()
    expect(reads()).toHaveLength(2)
    const answeredAt = now()
    await untilNextRead()

    expect(now() - answeredAt).toBe(FIRST_STEP)
  })

  it('reads nothing on top of that read, whatever happens meanwhile', async () => {
    listed = [distribution('dist-1', 'distributing')]
    const { store, reload } = await mountTab()
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => ({
      status: 200,
      data: distribution('dist-1', 'failed'),
    }))
    const read = holdNextRead()
    reload()
    await settle()
    expect(reads()).toHaveLength(2)

    // The window comes back.
    await becomes('hidden')
    await becomes('visible')
    // A notification finishes the distribution and another one puts it under way again.
    await store.listItemMessageUpdate('dist-1', 'failed')
    await store.listItemMessageUpdate('dist-1', 'distributing')
    await vi.advanceTimersByTimeAsync(LONG)

    expect(reads()).toHaveLength(2)
    await read.release()
  })

  it.each(GIVEN_UP)(
    'gives up its own read that is on its way, which %s: the answer the user asked for is the one shown',
    async (_how, answered) => {
      listed = [distribution('dist-1', 'waiting')]
      const { reload, rows } = await mountTab()
      const own = holdNextRead(answered)
      await untilNextRead()

      listed = [distribution('dist-1', 'waiting'), distribution('dist-2', 'waiting')]
      reload()
      await settle()
      expect(reads()).toHaveLength(3)
      expect(reads()[1].signal?.aborted).toBe(true)
      expect(reads()[2].signal?.aborted).toBe(false)
      expect(rows()).toEqual(['dist-1:waiting', 'dist-2:waiting'])

      // The read given up, if it is answered at all, is answered with what the server had before the user's change.
      await own.release({ status: 200, data: { data: [distribution('dist-1', 'waiting')] } })

      expect(rows()).toEqual(['dist-1:waiting', 'dist-2:waiting'])
      await untilNextRead()
    }
  )

  it('is not set off by the late answer of the read it gave up', async () => {
    listed = [distribution('dist-1', 'waiting')]
    const { reload } = await mountTab()
    const givenUp = holdNextRead(true)
    await untilNextRead()
    reload()
    await settle()
    const next = holdNextRead()
    await untilNextRead()
    expect(reads()).toHaveLength(4)

    await givenUp.release()
    await vi.advanceTimersByTimeAsync(LONG)

    expect(reads()).toHaveLength(4)
    await next.release()
  })

  it('reads the page the user turned to', async () => {
    const page = (name: string) =>
      Array.from({ length: 25 }, (_value, index) => distribution(`${name}-${index}`, 'waiting'))
    listed = page('first')
    server.on('GET', LIST, () => ({ status: 200, data: { data: listed, hasNextPage: true } }))
    const { nextPage, rows } = await mountTab()

    listed = page('second')
    nextPage()
    await settle()
    expect(rows()[0]).toBe('second-0:waiting')
    expect(reads()).toHaveLength(2)
    expect(reads()[1].url).not.toBe(reads()[0].url)

    await untilNextRead()

    expect(reads()[2].url).toBe(reads()[1].url)
  })

  it('reads nothing on its own when that read fails and nothing listed is under way', async () => {
    listed = [distribution('dist-1', 'distributed')]
    const { reload } = await mountTab()
    server.on('GET', LIST, () => {
      throw new Error('the server is down')
    })

    reload()
    await settle()
    await vi.advanceTimersByTimeAsync(LONG)

    expect(alerts.showErrorsDefault).toHaveBeenCalledTimes(1)
    expect(reads()).toHaveLength(2)
  })
})
