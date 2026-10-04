import { trackNavigation } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'

import { useDistributionCategoryCreateActions } from '@/domains/coreDam/distributionCategory/composables/distributionCategoryActions'
import {
  usePublicExportEditActions,
  usePublicExportRemoveActions,
} from '@/domains/coreDam/publicExport/composables/publicExportActions'

const deletePublicExport = vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => null)
const updatePublicExport = vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({}))
const createDistributionCategory = vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({ id: 'new-category' }))

vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showRecordWas: vi.fn(), showErrorsDefault: vi.fn(), showValidationError: vi.fn() }),
  useDamConfigState: () => ({ getDamConfigExtSystem: () => ({}) }),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/publicExport/api/publicExportApi', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDeletePublicExport: () => ({ execute: deletePublicExport }),
  useUpdatePublicExport: () => ({ execute: updatePublicExport }),
}))
vi.mock('@/domains/coreDam/distributionCategory/api/distributionCategoryApi', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useCreateDistributionCategory: () => ({ execute: createDistributionCategory }),
}))

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((settle) => (resolve = settle))

  return { promise, resolve }
}
const settle = () => new Promise((resolve) => setTimeout(resolve))

const Page = defineComponent(() => () => null)
let chunk = deferred<void>()

// The app's router in small: the tracker first, and the page the user clicks to is fetched on its first visit.
const mount = async <T>(path: string, composable: () => T) => {
  chunk = deferred<void>()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/public-exports', name: '/(coreDam)/public-exports', component: Page },
      { path: '/public-exports/:id', name: '/(coreDam)/public-exports/[id]', component: Page },
      { path: '/public-exports/:id/edit', component: Page },
      { path: '/distribution-categories', component: Page },
      { path: '/distribution-categories/:id', name: '/(coreDam)/distribution-categories/[id]', component: Page },
      { path: '/assets', component: () => chunk.promise.then(() => Page) },
    ],
  })
  trackNavigation(router)
  await router.push(path)
  let actions: T | undefined
  const host = defineComponent({
    setup() {
      actions = composable()

      return () => null
    },
  })
  createApp(host).use(router).mount(document.createElement('div'))

  return { router, actions: actions as T }
}

// The user clicks away while the request is on the wire, and it answers before the page they go to has loaded.
const userLeavesDuring = async (router: Router, request: Mock, act: () => Promise<unknown>, answer: unknown) => {
  const response = deferred<unknown>()
  request.mockReturnValueOnce(response.promise)
  const acting = act()
  const navigation = router.push('/assets')
  await settle()
  response.resolve(answer)
  await acting
  chunk.resolve()

  return await navigation
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('the redirect after a delete', () => {
  it('does not cancel the navigation the user started meanwhile', async () => {
    const { router, actions } = await mount('/public-exports/5', usePublicExportRemoveActions)

    expect(
      await userLeavesDuring(router, deletePublicExport, () => actions.removePublicExport(5), null)
    ).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/assets')
  })

  it('goes to the list when the user stayed', async () => {
    const { router, actions } = await mount('/public-exports/5', usePublicExportRemoveActions)

    await actions.removePublicExport(5)
    await settle()

    expect(router.currentRoute.value.path).toBe('/public-exports')
  })
})

describe('the redirect after a save', () => {
  it('does not cancel the navigation the user started meanwhile', async () => {
    const { router, actions } = await mount('/public-exports/0/edit', usePublicExportEditActions)

    expect(await userLeavesDuring(router, updatePublicExport, () => actions.onUpdate(), {})).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/assets')
  })

  it('goes to the detail when the user stayed', async () => {
    const { router, actions } = await mount('/public-exports/0/edit', usePublicExportEditActions)

    await actions.onUpdate()
    await settle()

    expect(router.currentRoute.value.path).toBe('/public-exports/0')
  })
})

describe('the redirect after a create', () => {
  it('does not cancel the navigation the user started meanwhile', async () => {
    const { router, actions } = await mount('/distribution-categories', useDistributionCategoryCreateActions)

    expect(
      await userLeavesDuring(router, createDistributionCategory, () => actions.onCreate(), { id: 'new-category' })
    ).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/assets')
  })

  it('goes to the new record when the user stayed', async () => {
    const { router, actions } = await mount('/distribution-categories', useDistributionCategoryCreateActions)

    await actions.onCreate()
    await settle()

    expect(router.currentRoute.value.path).toBe('/distribution-categories/new-category')
  })
})
