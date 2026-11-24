import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The edit view serves authors and sources. A record can be opened under the address of the other kind,
 * whose route asks only for the update permission of that kind. Saving it needs the permission of its own.
 * A save also writes the record into the name cache, which chips and credit previews read.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const ONE = /^\/adm\/v1\/author\/([^/]+)$/

const record = (id: string, source: boolean) => ({
  id,
  name: source ? 'TASR' : 'Jane Writer',
  identifier: '',
  type: 'none',
  extSystem: 1,
  flags: { reviewed: false, source, hiddenInCredit: false },
  currentAuthors: [],
  childAuthors: [],
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'author',
  _system: 'dam',
})

const PAGES = [
  { path: '/authors', name: '/(coreDam)/authors' },
  { path: '/authors/:id', name: '/(coreDam)/authors/[id]' },
  { path: '/authors/:id/edit', name: '/(coreDam)/authors/[id]/edit' },
  { path: '/sources', name: '/(coreDam)/sources' },
  { path: '/sources/:id', name: '/(coreDam)/sources/[id]' },
  { path: '/sources/:id/edit', name: '/(coreDam)/sources/[id]/edit' },
]

const mountEdit = async (address: string, grants: string[]) => {
  const ui = await startUploadUi({ server, grants })
  const { defineComponent, h, ref } = await import('vue')
  const { useRouter } = await import('vue-router')
  const page = await ui.mount(async () => {
    const AuthorEditView = (await import('@/domains/coreDam/author/components/AuthorEditView.vue')).default
    const Layout = defineComponent({
      setup() {
        const router = useRouter()
        PAGES.forEach((route) => router.addRoute({ ...route, component: { render: () => null } }))
        const arrived = ref(false)
        void router.push(address).then(() => (arrived.value = true))
        return () => [h(ui.library.AActionbarTarget), arrived.value ? h(AuthorEditView) : null]
      },
    })

    return { default: Layout }
  })
  await eventually(() => expect(page.querySelector('[data-cy="author-name"]')).not.toBeNull())
  await eventually(() =>
    expect(page.querySelector<HTMLInputElement>('[data-cy="author-name"] input')!.value).not.toBe('')
  )
  const save = () => page.querySelector<HTMLButtonElement>('[data-cy="button-save"]')

  return { ...ui, page, save }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', ONE, (_request, match) => ({ status: 200, data: record(match[1]!, match[1]!.startsWith('source')) }))
  server.on('PUT', ONE, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('GET', /^\/adm\/v1\/author\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the edit view of authors and sources', () => {
  it('offers no save of a source opened under the address of the authors to a user who may update authors only', async () => {
    const { save } = await mountEdit('/authors/source-1/edit', ['dam_author_read', 'dam_author_update'])

    expect(save()).toBeNull()
  })

  it('offers the save of a source to a user who may update sources, whichever address opened it', async () => {
    const { save } = await mountEdit('/authors/source-1/edit', ['dam_author_read', 'dam_source_update'])

    expect(save()).not.toBeNull()
  })

  it('offers the save of an author to a user who may update authors', async () => {
    const { save } = await mountEdit('/authors/author-1/edit', ['dam_author_read', 'dam_author_update'])

    expect(save()).not.toBeNull()
  })

  it('writes the saved record into the name cache, so a credit preview takes its "hidden in credit"', async () => {
    const { page, save, library } = await mountEdit('/sources/source-1/edit', ['dam_author_read', 'dam_source_update'])
    const { getCachedAuthor, addManualToCachedAuthors } = library.useDamCachedAuthors()
    addManualToCachedAuthors(record('source-1', true) as never)

    page.querySelector<HTMLInputElement>('[data-cy="author-flags-hidden-in-credit"] input')!.click()
    save()!.click()

    await eventually(() => expect(server.sent('PUT', ONE)).toHaveLength(1))
    await eventually(() => expect(getCachedAuthor('source-1')?.hiddenInCredit).toBe(true))
  })
})
