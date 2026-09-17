import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouteHistory } from '@anzusystems/common-admin'
import declaration from '@/typed-router.d.ts?raw'
import { initRouteHistory, routeHistoryBlacklist } from '@/router/routeHistory'

// What the close buttons stand on.
//
// `closeButton.test.ts` checks that every button names the right routes; this checks that naming
// them does anything. The history is module state inside the library, filled by the navigation
// guard and read back by `navigateBack`, so the three pieces are only correct together.
//
// The route names come out of the declaration rather than being written here: made-up ones would
// be rejected by `anzu-local/valid-route-name`, and real ones keep the test honest about the
// strings the app actually carries.

const { history, addRoute, clearHistory, navigateBack } = useRouteHistory()

const routeNames = [...declaration.matchAll(/^ {4}'([^']+)': RouteRecordInfo</gm)].map(([, name]) => name)
const [listing, record] = routeNames.filter((name) => !routeHistoryBlacklist.includes(name))

// `RouteLocationNormalized` is augmented into a union over every generated route, and asking TS
// to instantiate it here is what TS2589 is about. The history only ever reads these two fields.
const visit = (name: string, fullPath = name) =>
  (addRoute as (route: { name: string; fullPath: string }) => void)({ name, fullPath })

// Same reason as above: `DeepReadonly<Ref<RouteLocationNormalized[]>>` is more than TS will
// instantiate here, and the assertions only ever compare names.
const recorded = () => (history as unknown as { value: { name: string }[] }).value.map((route) => route.name)

beforeEach(() => {
  clearHistory()
  initRouteHistory()
})

describe('route history', () => {
  it('has two routes to work with', () => {
    // Guards the guard: were the declaration unreadable, every assertion below would compare
    // `undefined` against `undefined` and pass while checking nothing.
    expect(listing).toBeTypeOf('string')
    expect(record).toBeTypeOf('string')
    expect(routeHistoryBlacklist.length).toBeGreaterThan(0)
  })

  it('records an ordinary route, once', () => {
    visit(listing)
    visit(listing)
    visit(record)

    // The guard fires again on a navigation that a later guard then cancels, so the same route
    // arrives twice in a row; a second copy would cost one of the ten slots for nothing.
    expect(recorded()).toEqual([listing, record])
  })

  it('keeps every blacklisted route out', () => {
    for (const name of routeHistoryBlacklist) visit(name)

    expect(recorded()).toEqual([])
  })

  it('walks back past the view being closed to the one before it', () => {
    visit(listing)
    visit(record)

    const router = { push: vi.fn(), back: vi.fn() }
    navigateBack(router as never, { skipRouteNames: [record], fallbackRouteName: listing })

    expect(router.push).toHaveBeenCalledWith(listing)
    expect(router.back).not.toHaveBeenCalled()
  })

  it('falls back when history holds nothing but the view being closed', () => {
    // A tab opened straight on a record: nothing was visited before it.
    visit(record)

    const router = { push: vi.fn(), back: vi.fn() }
    navigateBack(router as never, { skipRouteNames: [record], fallbackRouteName: listing })

    expect(router.push).toHaveBeenCalledWith({ name: listing, params: undefined })
  })

  it('does not hand back a route the blacklist rejected', () => {
    visit(listing)
    visit(routeHistoryBlacklist[0])

    const router = { push: vi.fn(), back: vi.fn() }
    navigateBack(router as never, { skipRouteNames: [record], fallbackRouteName: listing })

    expect(router.push).toHaveBeenCalledWith(listing)
  })
})
