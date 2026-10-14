import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The sign-in page of the application leaves for the application, by its form, or for the sign-in service, by its
 * link. Either takes the place of the entry of the sign-in page in the history of the browser: Back from the
 * application, once signed in, does not show the sign-in page to a user who is signed in. A press of the link with a
 * key held is left to the link, which opens a new tab or window. The real page of the sign-in, the application around
 * it as it starts; the server is a fake, and so is where the browser goes: the address of the window is not left. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const LOGIN = /^\/auth\/login$/
const FAILED = 'Login failed!'

/** Where the window was sent: by `replace`, and by an address written into it. */
let replaced: string[] = []
let assigned: string[] = []

/** The page of the sign-in, by the form or by the link, as the config of DAM says. */
const openSignIn = async (by: 'form' | 'link') => {
  const ui = await startUploadUi({ server })
  const config = ui.library.useDamConfigStore()
  config.damPubConfig = {
    ...config.damPubConfig,
    userAuthType: by === 'form' ? ui.library.UserAuthType.JsonCredentials : ui.library.UserAuthType.OAuth2,
  }
  vi.spyOn(window.location, 'replace').mockImplementation((to) => void replaced.push(String(to)))
  vi.spyOn(window.location, 'href', 'set').mockImplementation((to) => void assigned.push(String(to)))
  const page = await ui.mount(() => import('@/domains/system/views/LoginView.vue'))

  return { ...ui, page }
}

/** The link of the sign-in service pressed, with the keys held: answers whether the link was left to follow itself. */
const pressLink = (page: HTMLElement, held: MouseEventInit = {}) => {
  const link = page.querySelector<HTMLAnchorElement>('a.v-btn')!
  let followed = false
  // Last on the way up, after the page: what the browser would do of the press, and it does nothing here.
  const ofBrowser = (event: Event) => {
    followed = !event.defaultPrevented
    event.preventDefault()
  }
  window.addEventListener('click', ofBrowser)
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...held }))
  window.removeEventListener('click', ofBrowser)

  return { href: link.getAttribute('href'), followed }
}

beforeEach(() => {
  server = createFakeDam()
  replaced = []
  assigned = []
})

afterEach(() => {
  vi.restoreAllMocks()
  stopUploadUi()
})

/* The form wrote the address of the application into the window, which added an entry after the one of the sign-in
 * page: Back from the application showed the sign-in page. */
describe('the sign-in by the form', () => {
  const signIn = async (page: HTMLElement) => {
    for (const [cy, value] of [
      ['username', 'user'],
      ['password', 'secret'],
    ]) {
      const field = page.querySelector<HTMLInputElement>(`[data-cy="${cy}"] input`)!
      field.value = value
      field.dispatchEvent(new Event('input'))
    }
    await nextTick()
    page.querySelector<HTMLButtonElement>('[data-cy="button-login"]')!.click()
    await vi.advanceTimersByTimeAsync(100)
  }

  it('goes to the application in the place of the sign-in page', async () => {
    server.on('POST', LOGIN, () => ({ status: 200, data: {} }))
    const { page } = await openSignIn('form')

    await signIn(page)

    expect(server.sent('POST', LOGIN).map((request) => JSON.parse(request.data as string))).toEqual([
      { username: 'user', password: 'secret' },
    ])
    expect([replaced, assigned]).toEqual([['/'], []])
  })

  // The guard: a sign-in refused goes nowhere.
  it('stays on the sign-in page, and says so, when the sign-in is refused', async () => {
    server.on('POST', LOGIN, () => {
      throw httpError(400)
    })
    const { page, alerts } = await openSignIn('form')

    await signIn(page)

    await eventually(() => expect(alerts()).toEqual([FAILED]))
    expect([replaced, assigned]).toEqual([[], []])
  })
})

/* The link was followed as a link: the sign-in service came after the entry of the sign-in page. */
describe('the link of the sign-in service', () => {
  it('goes to the sign-in service in the place of the sign-in page', async () => {
    const { page } = await openSignIn('link')

    const press = pressLink(page)

    expect(press.href).toMatch(/\/auth\/login$/)
    expect([press.followed, replaced, assigned]).toEqual([false, [press.href], []])
  })

  // The guard: a press that asks for a new tab or window is the link's own.
  it.each<[string, MouseEventInit]>([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
    ['Shift', { shiftKey: true }],
    ['the middle button', { button: 1 }],
  ])('is left to open as a link does when pressed with %s', async (_with, held) => {
    const { page } = await openSignIn('link')

    const press = pressLink(page, held)

    expect([press.followed, replaced, assigned]).toEqual([true, [], []])
  })
})
