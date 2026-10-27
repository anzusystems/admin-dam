import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The sign-in page leaves for the application by its form, or for the sign-in service by its link.
 * Either replaces the sign-in page entry in the browser history, so Back
 * from the application does not show the sign-in page to a signed-in user.
 * A link press with a modifier key is left to the link, which opens a new tab or window.
 * The real sign-in page runs inside the application. The server is a fake,
 * and so is the browser navigation: the window address is not changed.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const LOGIN = /^\/auth\/login$/
const FAILED = 'Login failed!'

let replaced: string[] = []
let assigned: string[] = []

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

const pressLink = (page: HTMLElement, held: MouseEventInit = {}) => {
  const link = page.querySelector<HTMLAnchorElement>('a.v-btn')!
  let followed = false
  // Runs last on the way up, after the page: it shows whether the page left the press to the browser default.
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

/*
 * Regression: the form wrote the application address into the window, which added a
 * history entry after the sign-in page. Back from the application showed the sign-in page.
 */
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

/*
 * Regression: the link was followed as a normal navigation, so the sign-in
 * service was added after the sign-in page entry instead of replacing it.
 */
describe('the link of the sign-in service', () => {
  it('goes to the sign-in service in the place of the sign-in page', async () => {
    const { page } = await openSignIn('link')

    const press = pressLink(page)

    expect(press.href).toMatch(/\/auth\/login$/)
    expect([press.followed, replaced, assigned]).toEqual([false, [press.href], []])
  })

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
