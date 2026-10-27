import type { Options } from 'vue-router/unplugin'

// Shared by `vite.config.mts` and `vitest.config.mts`. The route smoke test must scan the same
// folder and name routes the same way, or it passes against a route table the app never builds.
// `dts` is not set on purpose: vite writes `src/typed-router.d.ts`, a test run must not.
export const routerPages: Options = {
  routesFolder: 'src/pages',
  importMode: process.env.NODE_ENV === 'production' ? 'async' : 'sync',
  // Routes are named by their path, not their file, so a route reads the same
  // in the router, in `useRoute()` and, without params, in the address bar.
  // A param keeps its `[id]` form in the name.
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
