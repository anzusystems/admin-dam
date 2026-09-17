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

// `navigateBack` reads the route it is called from -- it never hands that one back -- so the
// double has to carry one. These cases all run as if the user were on a record view.
const routerOn = (name: string, fullPath = name) => ({
  push: vi.fn(),
  back: vi.fn(),
  currentRoute: { value: { name, fullPath } },
})

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
    // With an empty skip list, exactly as the buttons pass it now: the view being closed is the
    // one the router is on, and `navigateBack` never hands that back.
    visit(listing)
    visit(record)

    const router = routerOn(record)
    navigateBack(router as never, { skipRouteNames: [], fallbackRouteName: listing })

    expect(router.push).toHaveBeenCalledWith(listing)
    expect(router.back).not.toHaveBeenCalled()
  })

  it('falls back when history holds nothing but the view being closed', () => {
    // A tab opened straight on a record: nothing was visited before it.
    visit(record)

    const router = routerOn(record)
    navigateBack(router as never, { skipRouteNames: [], fallbackRouteName: listing })

    expect(router.push).toHaveBeenCalledWith({ name: listing, params: undefined })
  })

  it('does not hand back a route the blacklist rejected', () => {
    visit(listing)
    visit(routeHistoryBlacklist[0])

    const router = routerOn(record)
    navigateBack(router as never, { skipRouteNames: [], fallbackRouteName: listing })

    expect(router.push).toHaveBeenCalledWith(listing)
  })
})
