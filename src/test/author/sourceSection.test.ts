import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Sources are authors flagged as source, listed in their own section on the views of the authors.
 * The Authors section lists both kinds. A row opens the views of its own kind.
 * The create returns the record of that name when it already exists, so the list
 * says when that record is of the other kind or merged instead of "created".
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const CREATE = 'Create'
const CREATE_SOURCE = 'Create source'
const CREATED = 'Record was created'
const LIST = /^\/adm\/v1\/author\/ext-system\/1\/search$/
const AUTHOR = /^\/adm\/v1\/author$/

let authors: Array<Record<string, unknown>> = []
let answerToCreate: ((sent: Record<string, unknown>) => Record<string, unknown>) | undefined

const author = (id: string, name: string, flags: Record<string, unknown> = {}, over: Record<string, unknown> = {}) => ({
  id,
  name,
  identifier: '',
  type: 'none',
  extSystem: 1,
  flags: { reviewed: false, source: false, hiddenInCredit: false, ...flags },
  currentAuthors: [],
  childAuthors: [],
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'author',
  _system: 'dam',
  ...over,
})

// Real route names, which the list rows link to.
const PAGES = [
  { path: '/authors', name: '/(coreDam)/authors' },
  { path: '/authors/:id', name: '/(coreDam)/authors/[id]' },
  { path: '/authors/:id/edit', name: '/(coreDam)/authors/[id]/edit' },
  { path: '/sources', name: '/(coreDam)/sources' },
  { path: '/sources/:id', name: '/(coreDam)/sources/[id]' },
  { path: '/sources/:id/edit', name: '/(coreDam)/sources/[id]/edit' },
]

const mountPage = async (source: boolean, grants?: string[]) => {
  const ui = await startUploadUi({ server, grants })
  const { defineComponent, h, ref } = await import('vue')
  const { useRouter } = await import('vue-router')
  let path = () => ''
  const listRoute = source ? '/(coreDam)/sources' : '/(coreDam)/authors'
  const page = await ui.mount(async () => {
    const AuthorListView = (await import('@/domains/coreDam/author/components/AuthorListView.vue')).default
    const Layout = defineComponent({
      setup() {
        const router = useRouter()
        PAGES.forEach((route) => router.addRoute({ ...route, component: { render: () => null } }))
        path = () => router.currentRoute.value.fullPath
        const arrived = ref(false)
        void router.push({ name: listRoute }).then(() => (arrived.value = true))
        return () => [h(ui.library.AActionbarTarget), arrived.value ? h(AuthorListView, { source }) : null]
      },
    })

    return { default: Layout }
  })
  await eventually(() => expect(path()).toBe(source ? '/sources' : '/authors'))
  const rows = () => Array.from(page.querySelectorAll<HTMLElement>('tbody tr'))
  const names = () => rows().map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '')

  return { ...ui, page, rows, names, path: () => path() }
}

const create = async (page: HTMLElement, name: string, confirm: string) => {
  page.querySelector<HTMLButtonElement>('[data-cy="button-create"]')!.click()
  await nextTick()
  await eventually(() => expect(document.body.querySelector('.v-dialog [data-cy="create-panel"]')).not.toBeNull())
  const input = document.body.querySelector<HTMLInputElement>('.v-dialog [data-cy="author-name"] input')!
  input.value = name
  input.dispatchEvent(new Event('input'))
  await nextTick()
  dialogButton(confirm)!.click()
}

const createdSent = () => server.sent('POST', AUTHOR).map((request) => JSON.parse(request.data as string))

beforeEach(() => {
  server = createFakeDam()
  authors = [author('author-1', 'Jane Writer'), author('source-1', 'TASR', { source: true })]
  answerToCreate = undefined
  server.on('GET', LIST, () => ({
    status: 200,
    data: { data: [...authors], totalCount: authors.length, hasNextPage: false },
  }))
  server.on('POST', AUTHOR, (request) => {
    const sent = JSON.parse(request.data as string)
    if (answerToCreate) return { status: 200, data: answerToCreate(sent) }
    const made = { ...author('made-' + (authors.length + 1), sent.name), ...sent, id: 'made-' + (authors.length + 1) }
    authors = [made, ...authors]

    return { status: 201, data: made }
  })
})

afterEach(() => {
  stopUploadUi()
})

describe('the page of the sources', () => {
  it('asks for sources only', async () => {
    const { asked } = await mountPage(true)

    await eventually(() => expect(asked.filter((url) => LIST.test(url.split('?')[0]!))).not.toEqual([]))
    expect(asked.filter((url) => LIST.test(url.split('?')[0]!)).every((url) => url.includes('source=true'))).toBe(true)
  })

  it('creates a source, says so and reads the list again', async () => {
    const { page, alerts } = await mountPage(true, ['dam_source_create'])
    const readsBefore = server.sent('GET', LIST).length

    await create(page, 'SITA', CREATE_SOURCE)

    await eventually(() => expect(alerts()).toEqual([CREATED]))
    expect(createdSent()).toEqual([
      expect.objectContaining({ name: 'SITA', flags: expect.objectContaining({ source: true }) }),
    ])
    await eventually(() => expect(server.sent('GET', LIST).length).toBeGreaterThan(readsBefore))
  })

  it('has no create button without the permission to create sources', async () => {
    const { page } = await mountPage(true, ['dam_author_create'])

    expect(page.querySelector('[data-cy="button-create"]')).toBeNull()
  })

  it('says that the name exists as an author when the create answers with an author', async () => {
    const { page, alerts } = await mountPage(true, ['dam_source_create'])
    answerToCreate = () => author('author-1', 'Jane Writer')

    await create(page, 'Jane Writer', CREATE_SOURCE)

    await eventually(() =>
      expect(alerts()).toEqual(['“Jane Writer” already exists as an author and cannot be used as a source'])
    )
  })
})

describe('the page of the authors', () => {
  it('lists authors and sources, and has a column saying which is a source', async () => {
    const { page, names, asked } = await mountPage(false)

    await eventually(() => expect(names()).toHaveLength(2))
    expect(asked.filter((url) => LIST.test(url.split('?')[0]!)).some((url) => url.includes('source='))).toBe(false)
    const headers = () => Array.from(page.querySelectorAll('thead th')).map((th) => th.textContent?.trim())
    expect(headers()).toContain('Source')
    expect(headers()).toContain('Hidden in credit')
  })

  it('has no column of the kind on the page of the sources', async () => {
    const { page, names } = await mountPage(true)

    await eventually(() => expect(names()).toHaveLength(2))
    const headers = Array.from(page.querySelectorAll('thead th')).map((th) => th.textContent?.trim())
    expect(headers).not.toContain('Source')
    expect(headers).toContain('Hidden in credit')
  })

  it('opens a row of a source on the page of the source', async () => {
    const { rows, path } = await mountPage(false)
    await eventually(() => expect(rows()).toHaveLength(2))

    rows()
      .find((row) => row.textContent?.includes('TASR'))!
      .click()

    await eventually(() => expect(path()).toBe('/sources/source-1'))
  })

  it('says that the name exists as a source when the create answers with a source', async () => {
    const { page, alerts } = await mountPage(false)
    answerToCreate = () => author('source-1', 'TASR', { source: true })

    await create(page, 'TASR', CREATE)

    await eventually(() =>
      expect(alerts()).toEqual(['“TASR” already exists as a source and cannot be used as an author'])
    )
  })

  it('says that the name exists and is merged when the create answers with a merged author', async () => {
    const { page, alerts } = await mountPage(false)
    answerToCreate = () => author('author-9', 'J. Writer', {}, { currentAuthors: ['author-1'] })

    await create(page, 'J. Writer', CREATE)

    await eventually(() =>
      expect(alerts()).toEqual(['“J. Writer” already exists and is merged into its parent authors'])
    )
  })
})
