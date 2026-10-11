import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* "Create" on the page of the authors: its dialog, what it sends, the list read again, and the user left on the
 * page. The real page with the actionbar its button is moved into, over the application as it starts; the server is
 * a fake that keeps the authors it is sent. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const CREATE = 'Create'
const CREATED = 'Record was created'
const LIST = /^\/adm\/v1\/author\/ext-system\/1\/search$/
const AUTHOR = /^\/adm\/v1\/author$/

let authors: Array<Record<string, unknown>> = []

const author = (id: string, name: string) => ({
  id,
  name,
  identifier: '',
  type: 'none',
  extSystem: 1,
  flags: { reviewed: false },
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'author',
  _system: 'dam',
})

// The pages of an author, under their real names, which the rows of the list link to.
const AUTHOR_PAGES = [
  { path: '/authors', name: '/(coreDam)/authors' },
  { path: '/authors/:id', name: '/(coreDam)/authors/[id]' },
  { path: '/authors/:id/edit', name: '/(coreDam)/authors/[id]/edit' },
]

/** Takes the user to the page of the authors and mounts it under the actionbar of the layout; answers where the user
 * is. */
const mountPage = async () => {
  const ui = await startUploadUi({ server })
  const { defineComponent, h, ref } = await import('vue')
  const { useRouter } = await import('vue-router')
  let path = () => ''
  const page = await ui.mount(async () => {
    const AuthorListView = (await import('@/domains/coreDam/author/components/AuthorListView.vue')).default
    const Layout = defineComponent({
      setup() {
        const router = useRouter()
        AUTHOR_PAGES.forEach((route) => router.addRoute({ ...route, component: { render: () => null } }))
        path = () => router.currentRoute.value.fullPath
        // The page is drawn once the user is on it, as the router view of the application draws it.
        const arrived = ref(false)
        void router.push({ name: '/(coreDam)/authors' }).then(() => (arrived.value = true))
        return () => [h(ui.library.AActionbarTarget), arrived.value ? h(AuthorListView) : null]
      },
    })

    return { default: Layout }
  })
  await eventually(() => expect(path()).toBe('/authors'))
  const names = () =>
    Array.from(page.querySelectorAll('tbody tr')).map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '')

  return { ...ui, page, names, path: () => path() }
}

const typeInto = async (input: HTMLInputElement | null, value: string) => {
  expect(input).not.toBeNull()
  input!.value = value
  input!.dispatchEvent(new Event('input'))
  await nextTick()
}

beforeEach(() => {
  server = createFakeDam()
  authors = [author('author-1', 'Jane Writer')]
  server.on('GET', LIST, () => ({
    status: 200,
    data: { data: [...authors], totalCount: authors.length, hasNextPage: false },
  }))
  server.on('POST', AUTHOR, (request) => {
    const sent = JSON.parse(request.data as string)
    const id = 'author-' + (authors.length + 1)
    const made = { ...author(id, sent.name), ...sent, id }
    authors = [made, ...authors]

    return { status: 201, data: made }
  })
})

afterEach(() => {
  stopUploadUi()
})

describe('the create button of the page of the authors', () => {
  it('creates the author typed into its dialog, reads the list again and leaves the user on the page', async () => {
    const { page, names, alerts, path } = await mountPage()
    await eventually(() => expect(names().some((name) => name.includes('Jane Writer'))).toBe(true))
    const readsBefore = server.sent('GET', LIST).length

    page.querySelector<HTMLButtonElement>('[data-cy="button-create"]')!.click()
    await nextTick()
    await eventually(() => expect(document.body.querySelector('.v-dialog [data-cy="create-panel"]')).not.toBeNull())
    await typeInto(document.body.querySelector('.v-dialog [data-cy="author-name"] input'), 'Ann Reporter')
    dialogButton(CREATE)!.click()

    await eventually(() => expect(alerts()).toEqual([CREATED]))
    expect(server.sent('POST', AUTHOR).map((request) => JSON.parse(request.data as string))).toEqual([
      expect.objectContaining({ name: 'Ann Reporter', extSystem: 1 }),
    ])
    // The dialog is closed, the list is read again and shows the new author.
    await eventually(() => expect(document.body.querySelector('.v-dialog [data-cy="create-panel"]')).toBeNull())
    await eventually(() => expect(server.sent('GET', LIST).length).toBeGreaterThan(readsBefore))
    await eventually(() => expect(names().some((name) => name.includes('Ann Reporter'))).toBe(true))
    // Not taken to the detail of the new author.
    expect(path()).toBe('/authors')
  })

  it('sends nothing without a name, and says what to fix', async () => {
    const { page, alerts } = await mountPage()

    page.querySelector<HTMLButtonElement>('[data-cy="button-create"]')!.click()
    await nextTick()
    await eventually(() => expect(document.body.querySelector('.v-dialog [data-cy="create-panel"]')).not.toBeNull())
    dialogButton(CREATE)!.click()

    await eventually(() => expect(alerts()).toEqual(['Please fill all required fields and fix problems']))
    expect(server.sent('POST', AUTHOR)).toEqual([])
    expect(document.body.querySelector('.v-dialog [data-cy="create-panel"]')).not.toBeNull()
  })
})
