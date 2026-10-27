import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The anzu user edit saves to `PUT /adm/v1/anzu-user/{id}` with the
 * form id, and the backend writes the form over the user with that id.
 * The form used to offer the id as a text field. A changed id saved
 * the roles, groups and grants of this user over another user.
 * The id is therefore shown, not editable. Uses the real page with
 * the actionbar its buttons are moved into, and a fake server.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const USER = /^\/adm\/v1\/anzu-user\/(\d+)$/
const UPDATED = 'Record was updated'

const anzuUser = (id: number) => ({
  id,
  email: 'user@dam.test',
  enabled: true,
  locale: null,
  person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
  avatar: { color: '#123456', text: 'TU' },
  roles: [],
  permissionGroups: [],
  permissions: {},
  resolvedPermissions: {},
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'anzuUser',
  _system: 'common',
})

// Anzu user pages under their real route names, which the page navigates by.
const ANZU_USER_PAGES = [
  { path: '/anzu-users', name: '/(common)/anzu-users' },
  { path: '/anzu-users/:id', name: '/(common)/anzu-users/[id]' },
]

const openEdit = async (id: number) => {
  const ui = await startUploadUi({ server })
  const { defineComponent, h, ref } = await import('vue')
  const { useRouter } = await import('vue-router')
  const EditView = (await import('@/domains/common/anzuUser/components/AnzuUserEditView.vue')).default
  const page = await ui.mount(async () => {
    const Layout = defineComponent({
      setup() {
        const router = useRouter()
        ANZU_USER_PAGES.forEach((route) => router.addRoute({ ...route, component: { render: () => null } }))
        router.addRoute({ path: '/anzu-users/:id/edit', name: '/(common)/anzu-users/[id]/edit', component: EditView })
        // The page is drawn only once the user has arrived, as the application's router view does.
        const arrived = ref(false)
        void router.push('/anzu-users/' + id + '/edit').then(() => (arrived.value = true))
        return () => [h(ui.library.AActionbarTarget), arrived.value ? h(EditView) : null]
      },
    })

    return { default: Layout }
  })
  const inputs = () => Array.from(page.querySelectorAll<HTMLInputElement>('input'))
  await eventually(() => expect(inputs().map((input) => input.value)).toContain('user@dam.test'))

  return { ...ui, page, inputs }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', USER, (_request, match) => ({ status: 200, data: anzuUser(Number(match[1])) }))
  server.on('PUT', USER, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  server.on('GET', /^\/adm\/v1\/permissions\/config$/, () => ({
    status: 200,
    data: { roles: [], defaultGrants: [], config: {}, translation: { subjects: {}, actions: {}, roles: {} } },
  }))
  server.on('GET', /^\/adm\/v1\/permission-group$/, () => ({ status: 200, data: { data: [], totalCount: 0 } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the edit of an anzu user', () => {
  it('shows the id of the user, and offers no field to change it', async () => {
    const { page, inputs } = await openEdit(5)

    expect(inputs().map((input) => input.value)).not.toContain('5')
    expect(page.querySelector('.anzu-copy-text')?.textContent?.trim()).toBe('5')
  })

  it('saves the user it was opened for', async () => {
    const { page, inputs, alerts } = await openEdit(5)
    const email = inputs().find((input) => input.value === 'user@dam.test')!
    email.value = 'changed@dam.test'
    email.dispatchEvent(new Event('input'))
    await nextTick()

    buttonsNamed(page, 'Save')[0].click()

    await eventually(() => expect(alerts()).toEqual([UPDATED]))
    expect(server.sent('PUT', USER).map((request) => [request.url, JSON.parse(request.data as string).id])).toEqual([
      ['/adm/v1/anzu-user/5', 5],
    ])
  })
})
