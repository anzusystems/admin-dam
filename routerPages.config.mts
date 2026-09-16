import type { Options } from 'vue-router/unplugin'

// Shared by `vite.config.mts` and `vitest.config.mts`: the route smoke test resolves the routes
// this generates, so it has to scan the same folder and name them the same way. Kept out of both
// configs rather than copied into each, because a divergence here would make the test pass against
// a route table the app never builds.
//
// `dts` is deliberately not set: vite writes `src/typed-router.d.ts`, a test run must not.
export const routerPages: Options = {
  routesFolder: 'src/pages',
  importMode: process.env.NODE_ENV === 'production' ? 'async' : 'sync',
  // File-based routing would name a route after its file. These names are the route's path
  // instead, so a route reads the same in the router and in a `useRoute()` call -- and, for a
  // route with no params, in the address bar too. A param keeps its `[id]` form in the name.
  getRouteName: (node) => {
    let name = ''
    let current = node
    while (current.parent) {
      const segment = current.value.rawSegment === 'index' ? '' : current.value.rawSegment
      if (segment) {
        name = '/' + segment + name
      }
      current = current.parent
    }
    return name || '/'
  },
}
