import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'

/*
 * Signing in to YouTube from the new-distribution dialog without the notification server.
 * The dialog asks once on opening whether the service is signed in, and
 * offers a login link when it is not. The user signs in in another tab.
 * The dialog asks again when the user comes back. The real dialog, store and requests are used with a fake server.
 * What the notification does is tested in `appInitialize/notificationEvents.test.ts`.
 */

let server: FakeDam
const alerts = vi.hoisted(() => ({
  showErrorsDefault: vi.fn(),
  showRecordWas: vi.fn(),
  showValidationError: vi.fn(),
}))

// The fake server refuses a request once its signal is aborted, as axios does.
// A case can make the next request to an address go without its signal. Its answer
// then arrives although the request was given up, like one already on its way back.
let nextAnswersAfterAbort: RegExp | undefined = undefined
const signals: Array<{ url: string; signal: AbortSignal | undefined }> = []

const asSent = <T extends { signal?: unknown }>(rawUrl: string, config: T): T => {
  const url = rawUrl.split('?')[0]
  signals.push({ url, signal: config.signal as AbortSignal | undefined })
  if (!nextAnswersAfterAbort?.test(url)) return config
  nextAnswersAfterAbort = undefined

  return { ...config, signal: undefined }
}

vi.mock('@/shared/apiClients/damClient', () => ({
  damClient: () => ({
    ...server.client,
    get: (url: string, config: { signal?: AbortSignal } = {}) => server.client.get(url, asSent(url, config)),
    request: (config: { url?: string; signal?: AbortSignal }) =>
      server.client.request(asSent(config.url ?? '', config)),
  }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => alerts,
}))
vi.mock('@/domains/coreDam/asset/components/detail/composables/assetDetailDistributionDialog', async () => {
  const { ref } = await import('vue')

  return {
    useAssetDetailDistributionDialog: () => ({
      redistributeMode: ref(false),
      assetFileId: ref('file-1'),
      assetFileStatus: ref('processed'),
      redistributeId: ref<string | null>(null),
    }),
  }
})
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/DistributionListItem.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      props: { item: { type: Object, required: true } },
      setup: (props) => () => h('div', { 'data-existing': '' }, String(props.item.id)),
    }),
  }
})
const nothing = vi.hoisted(() => () => ({ default: { render: () => null } }))
vi.mock('@/domains/coreDam/asset/components/detail/components/AssetDetailSlotSelect.vue', nothing)
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/DistributionBlockedBy.vue', nothing)
vi.mock(
  '@/domains/coreDam/asset/components/detail/components/distribution/DistributionNewDialogYoutubeLogoutButton.vue',
  nothing
)
vi.mock(
  '@/domains/coreDam/asset/components/detail/components/distribution/DistributionYoutubeLanguageSelect.vue',
  nothing
)
vi.mock(
  '@/domains/coreDam/asset/components/detail/components/distribution/DistributionYoutubePlaylistSelect.vue',
  nothing
)
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/DistributionYoutubeTermOfUse.vue', nothing)
vi.mock('@/domains/coreDam/asset/components/detail/components/distribution/YoutubeLogo.vue', nothing)

const DistributionNewDialogYoutube = (
  await import('@/domains/coreDam/asset/components/detail/components/distribution/DistributionNewDialogYoutube.vue')
).default
const { useDistributionListStore } = await import('@/domains/coreDam/asset/store/distributionListStore')

const SERVICE = 'youtube_main'
const AUTHORIZED = /^\/adm\/v1\/distribution\/youtube_main\/authorized$/
const AUTH_URL = /^\/adm\/v1\/youtube-distribution\/youtube_main\/auth-url$/
const FILE_DISTRIBUTIONS = /^\/adm\/v1\/distribution\/asset-file\/file-1$/
const LOGIN_LINK = 'https://accounts.example/sign-in?state=first'

let signedIn = false
const authorizedAnswer = (): FakeDamAnswer => ({
  status: 200,
  data: { authorized: signedIn, distributionService: SERVICE },
})

let app: App | undefined
let visibility: 'visible' | 'hidden' = 'visible'
const hookErrors = vi.fn()

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

/** The sign-in state belongs to the app, not to a dialog: one opened after another is mounted over the same store. */
const mountDialog = async (pinia = createPinia()) => {
  setActivePinia(pinia)
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(DistributionNewDialogYoutube, {
    distributionServiceName: SERVICE,
    assetType: 'video',
    config: { requiredAuth: true },
    assetId: 'asset-1',
  })
  app.use(pinia)
  app.use(createVuetify({ components, aliases: { ABtnPrimary: components.VBtn, ABtnTertiary: components.VBtn } }))
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.config.errorHandler = hookErrors
  app.mount(root)
  await settle()
  const store = useDistributionListStore()

  return {
    pinia,
    store,
    status: () => store.getDistributionAuth(SERVICE)?.status,
    loginLink: () => root.querySelector<HTMLAnchorElement>('a[target="_blank"]')?.getAttribute('href'),
    existing: () => Array.from(root.querySelectorAll('[data-existing]')).map((row) => row.textContent),
  }
}

const asked = (pattern: RegExp) => server.sent('GET', pattern).length
const questions = () => signals.filter((request) => AUTHORIZED.test(request.url))
const questionsGivenUp = () => questions().map((request) => request.signal?.aborted === true)

const comesBackToTheWindow = async () => {
  window.dispatchEvent(new Event('focus'))
  await settle()
}
const tabBecomes = async (state: 'visible' | 'hidden') => {
  visibility = state
  document.dispatchEvent(new Event('visibilitychange'))
  await settle()
}

const GIVEN_UP: Array<[string, boolean]> = [
  ['is refused at once, as in a browser', false],
  ['is answered all the same', true],
]

const holdNext = (address: RegExp, later: () => FakeDamAnswer, answersAfterAbort = false) => {
  let answer: (value: FakeDamAnswer) => void = () => undefined
  let held = false
  nextAnswersAfterAbort = answersAfterAbort ? address : undefined
  server.on('GET', address, () => {
    if (held) return later()
    held = true

    return new Promise<FakeDamAnswer>((resolve) => (answer = resolve))
  })

  return {
    answer: async (data: Record<string, unknown>) => {
      answer({ status: 200, data })
      await settle()
    },
  }
}

const holdNextQuestion = (answersAfterAbort = false) => {
  const held = holdNext(AUTHORIZED, authorizedAnswer, answersAfterAbort)

  return { answer: (authorized: boolean) => held.answer({ authorized, distributionService: SERVICE }) }
}

const DIALOG_FILE = '/distribution/DistributionNewDialogYoutube.vue'

/**
 * Wraps `target[name]` for one case and keeps only the calls made from the dialog's own file.
 * Vuetify and the library also listen on the window and document; those calls are not kept.
 */
const callsFromTheDialog = (target: object, name: string) => {
  const original = Reflect.get(target, name) as (...args: unknown[]) => unknown
  const wasOwn = Object.prototype.hasOwnProperty.call(target, name)
  const calls: unknown[][] = []
  Reflect.set(target, name, (...args: unknown[]) => {
    // The first line is the message, the second this function, the third whoever called it.
    const caller = new Error('who called').stack?.split('\n')[2] ?? ''
    if (caller.includes(DIALOG_FILE)) calls.push(args)

    return original.apply(target, args)
  })

  return {
    calls,
    restore: () => (wasOwn ? Reflect.set(target, name, original) : Reflect.deleteProperty(target, name)),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  nextAnswersAfterAbort = undefined
  signals.length = 0
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
  signedIn = false
  server = createFakeDam()
  server.on('GET', AUTHORIZED, authorizedAnswer)
  server.on('GET', AUTH_URL, () => ({ status: 200, data: { url: LOGIN_LINK } }))
  server.on('GET', FILE_DISTRIBUTIONS, () => ({
    status: 200,
    data: { data: [{ id: 'dist-1', status: 'distributed', distributionService: SERVICE }] },
  }))
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  Reflect.deleteProperty(document, 'visibilityState')
})

describe('the YouTube dialog waiting for the user to sign in', () => {
  it('offers the login link', async () => {
    const dialog = await mountDialog()

    expect(dialog.status()).toBe('waiting_for_login')
    expect(dialog.loginLink()).toBe(LOGIN_LINK)
    expect(asked(AUTHORIZED)).toBe(1)
    expect(asked(AUTH_URL)).toBe(1)
  })

  it('asks again when the user comes back to the window, and goes on once they are signed in', async () => {
    const dialog = await mountDialog()

    signedIn = true
    await comesBackToTheWindow()

    expect(asked(AUTHORIZED)).toBe(2)
    expect(dialog.status()).toBe('success')
    expect(dialog.loginLink()).toBeUndefined()
    expect(asked(FILE_DISTRIBUTIONS)).toBe(1)
    expect(dialog.existing()).toEqual(['dist-1'])
  })

  it('asks again when the tab becomes visible, not when it is hidden', async () => {
    const dialog = await mountDialog()
    signedIn = true

    await tabBecomes('hidden')
    expect(asked(AUTHORIZED)).toBe(1)
    expect(dialog.status()).toBe('waiting_for_login')

    await tabBecomes('visible')
    expect(asked(AUTHORIZED)).toBe(2)
    expect(dialog.status()).toBe('success')
  })

  it('keeps waiting, with the same link, while the user is not signed in', async () => {
    const dialog = await mountDialog()

    await comesBackToTheWindow()
    await comesBackToTheWindow()

    expect(asked(AUTHORIZED)).toBe(3)
    expect(dialog.status()).toBe('waiting_for_login')
    expect(dialog.loginLink()).toBe(LOGIN_LINK)
    // Every link requested is one more pending sign-in on the server.
    expect(asked(AUTH_URL)).toBe(1)
    expect(asked(FILE_DISTRIBUTIONS)).toBe(0)
  })

  it('asks once for a return that is both a focus and a visible tab', async () => {
    const dialog = await mountDialog()
    let answer: (value: FakeDamAnswer) => void = () => undefined
    server.on('GET', AUTHORIZED, () => new Promise<FakeDamAnswer>((resolve) => (answer = resolve)))

    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
    await settle()
    expect(asked(AUTHORIZED)).toBe(2)

    signedIn = true
    answer(authorizedAnswer())
    await settle()
    expect(dialog.status()).toBe('success')
  })

  it('says nothing when the question cannot be answered, and asks again on the next return', async () => {
    const dialog = await mountDialog()
    server.on('GET', AUTHORIZED, () => {
      throw new Error('the server is down')
    })

    await comesBackToTheWindow()

    expect(asked(AUTHORIZED)).toBe(2)
    expect(dialog.status()).toBe('waiting_for_login')
    expect(dialog.loginLink()).toBe(LOGIN_LINK)
    expect(alerts.showErrorsDefault).not.toHaveBeenCalled()

    signedIn = true
    server.on('GET', AUTHORIZED, authorizedAnswer)
    await comesBackToTheWindow()

    expect(dialog.status()).toBe('success')
  })

  it('leaves the answer of a notification alone when it came first', async () => {
    const dialog = await mountDialog()
    let answer: (value: FakeDamAnswer) => void = () => undefined
    server.on('GET', AUTHORIZED, () => new Promise<FakeDamAnswer>((resolve) => (answer = resolve)))
    window.dispatchEvent(new Event('focus'))
    await settle()

    dialog.store.authorizationMessage(SERVICE, false)
    answer({ status: 200, data: { authorized: true, distributionService: SERVICE } })
    await settle()

    expect(dialog.status()).toBe('error')
  })
})

describe('the YouTube dialog that is not waiting for a sign-in', () => {
  it('does not ask again when the service is signed in to', async () => {
    signedIn = true
    const dialog = await mountDialog()
    expect(dialog.status()).toBe('success')

    await comesBackToTheWindow()
    await tabBecomes('visible')

    expect(asked(AUTHORIZED)).toBe(1)
  })

  it('does not ask again while its first question is on its way', async () => {
    let answer: (value: FakeDamAnswer) => void = () => undefined
    server.on('GET', AUTHORIZED, () => new Promise<FakeDamAnswer>((resolve) => (answer = resolve)))
    const dialog = await mountDialog()
    expect(dialog.status()).toBe('idle')

    await comesBackToTheWindow()
    await tabBecomes('visible')
    expect(asked(AUTHORIZED)).toBe(1)

    answer(authorizedAnswer())
    await settle()
    expect(dialog.status()).toBe('waiting_for_login')
  })

  it('does not ask again after a notification said the sign-in was refused', async () => {
    const dialog = await mountDialog()
    dialog.store.authorizationMessage(SERVICE, false)
    await settle()

    await comesBackToTheWindow()

    expect(asked(AUTHORIZED)).toBe(1)
    expect(dialog.status()).toBe('error')
  })
})

describe('the YouTube dialog once it is closed', () => {
  it('no longer listens for the user coming back: its own two listeners are taken off, and nothing is asked', async () => {
    const onWindow = callsFromTheDialog(window, 'addEventListener')
    const onDocument = callsFromTheDialog(document, 'addEventListener')
    const offWindow = vi.spyOn(window, 'removeEventListener')
    const offDocument = vi.spyOn(document, 'removeEventListener')
    const takenOff = (off: { mock: { calls: unknown[][] } }, [type, listener]: unknown[]) =>
      off.mock.calls.some(([offType, offListener]) => offType === type && offListener === listener)
    try {
      const dialog = await mountDialog()
      expect(onWindow.calls.map(([type]) => type)).toEqual(['focus'])
      expect(onDocument.calls.map(([type]) => type)).toEqual(['visibilitychange'])
      expect(takenOff(offWindow, onWindow.calls[0])).toBe(false)
      expect(takenOff(offDocument, onDocument.calls[0])).toBe(false)

      app?.unmount()
      app = undefined
      dialog.store.setAuthStatus(SERVICE, 'waiting_for_login')

      expect(takenOff(offWindow, onWindow.calls[0])).toBe(true)
      expect(takenOff(offDocument, onDocument.calls[0])).toBe(true)

      signedIn = true
      await comesBackToTheWindow()
      await tabBecomes('visible')

      // Counted as the app sent them. A question of the closed dialog carries its aborted signal,
      // and the fake server refuses such a request without recording it.
      expect(questions()).toHaveLength(1)
      expect(dialog.status()).toBe('waiting_for_login')
    } finally {
      onWindow.restore()
      onDocument.restore()
      offWindow.mockRestore()
      offDocument.mockRestore()
    }
  })

  it('gives up the question that was on its way, and says nothing', async () => {
    await mountDialog()
    holdNextQuestion()
    window.dispatchEvent(new Event('focus'))
    await settle()
    expect(asked(AUTHORIZED)).toBe(2)

    app?.unmount()
    app = undefined
    await settle()

    expect(questionsGivenUp()).toEqual([false, true])
    expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
  })

  it.each(GIVEN_UP)(
    'does not let that question, which %s, sign in a dialog opened after it',
    async (_how, answered) => {
      const closed = await mountDialog()
      const question = holdNextQuestion(answered)
      window.dispatchEvent(new Event('focus'))
      await settle()
      app?.unmount()
      app = undefined

      const next = await mountDialog(closed.pinia)
      expect(next.status()).toBe('waiting_for_login')
      expect(asked(AUTHORIZED)).toBe(3)

      await question.answer(true)

      expect(next.status()).toBe('waiting_for_login')
      expect(next.loginLink()).toBe(LOGIN_LINK)
      expect(asked(FILE_DISTRIBUTIONS)).toBe(0)
      expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
    }
  )
})

describe('the YouTube dialog closed while the check of its opening is on its way', () => {
  it.each(GIVEN_UP)(
    'gives up "is the service signed in to?"; when it %s, a dialog opened after it keeps its own state',
    async (_how, answered) => {
      const question = holdNextQuestion(answered)
      const closed = await mountDialog()
      expect(closed.status()).toBe('idle')
      app?.unmount()
      app = undefined
      expect(questionsGivenUp()).toEqual([true])

      const next = await mountDialog(closed.pinia)
      expect(next.status()).toBe('waiting_for_login')

      await question.answer(true)

      expect(next.status()).toBe('waiting_for_login')
      expect(next.loginLink()).toBe(LOGIN_LINK)
      expect(asked(FILE_DISTRIBUTIONS)).toBe(0)
      expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
      expect(hookErrors).not.toHaveBeenCalled()
    }
  )

  it.each(GIVEN_UP)(
    'gives up the request for the login link; when it %s, a dialog opened after it keeps its own state',
    async (_how, answered) => {
      const link = holdNext(AUTH_URL, () => ({ status: 200, data: { url: LOGIN_LINK } }), answered)
      const closed = await mountDialog()
      expect(asked(AUTH_URL)).toBe(1)
      app?.unmount()
      app = undefined
      expect(signals.filter((request) => AUTH_URL.test(request.url)).map((request) => request.signal?.aborted)).toEqual(
        [true]
      )

      signedIn = true
      const next = await mountDialog(closed.pinia)
      expect(next.status()).toBe('success')
      expect(next.existing()).toEqual(['dist-1'])

      await link.answer({ url: 'https://accounts.example/sign-in?state=of-the-closed-dialog' })

      expect(next.status()).toBe('success')
      expect(next.existing()).toEqual(['dist-1'])
      expect(alerts.showErrorsDefault).not.toHaveBeenCalled()
      expect(hookErrors).not.toHaveBeenCalled()
    }
  )

  it('does not hide a check that failed while the dialog was open: the error gets out as before', async () => {
    server.on('GET', AUTHORIZED, () => {
      throw new Error('the server is down')
    })

    const dialog = await mountDialog()

    expect(dialog.status()).toBe('idle')
    expect(hookErrors).toHaveBeenCalledTimes(1)
  })
})
