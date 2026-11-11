import { URL, fileURLToPath } from 'url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import VueRouter from 'vue-router/vite'
// Root config files sit outside `src`, so the `@` alias does not resolve here.
// oxlint-disable-next-line no-restricted-imports
import { routerPages } from './routerPages.config.mts'

export default defineConfig({
  // Vitest keeps its test-order results in Vite's cache dir. This
  // one sits with the other tool caches in `node_modules/.cache`.
  // Only the test runner reads it. The dev server stays on `node_modules/.vite`.
  cacheDir: 'node_modules/.cache/vite',
  plugins: [
    // The route smoke test imports `vue-router/auto-routes`, which only exists while this plugin runs.
    // `dts: false`: the declaration belongs to `yarn generate:dts` and the dev server. A test run must not rewrite it.
    VueRouter({
      ...routerPages,
      dts: false,
      // Pinned, not inherited: `routerPages` switches to `async` under NODE_ENV=production.
      // That leaves the page components as un-awaited thunks, and the suite would pass while evaluating nothing.
      importMode: 'sync',
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    // `ci:checks` runs this next to the whole lint set, so a worker
    // can lose the CPU for longer than vitest's 5 s default.
    // A timed-out test has been observed leaving state that makes a later test in the same file fail.
    // The slowest is the first test that imports common-admin. The library's ~790 modules are
    // transformed and evaluated: 16 s in a cold admin-inhouse run, slower on CI with fewer cores.
    // `hookTimeout` defaults to 10 s and is raised too, or the hooks become the weaker link.
    testTimeout: 60000,
    hookTimeout: 60000,
    // No fsModuleCache: it keys a module on its own content.
    // A changed import (a type used in `defineProps`) or a renamed file can leave a stale transform.
    // Set explicitly so vitest does not suggest turning it on after every run.
    fsModuleCache: false,
    // Scoped to `src/`: `e2e/` holds the e2e specs, which vitest's default include would collect.
    include: ['src/**/*.{test,spec}.ts'],
    server: {
      deps: {
        // The library bundle imports Vuetify CSS. If externalized, it reaches
        // node's ESM loader and fails with `Unknown file extension ".css"`.
        inline: [/@anzusystems\/common-admin/, /vuetify/],
      },
    },
  },
})
