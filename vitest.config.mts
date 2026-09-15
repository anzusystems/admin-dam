/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vitest/config'
// Root config files sit outside `src`, so the `@` alias does not resolve here.
// oxlint-disable-next-line no-restricted-imports
import { autoImports } from './autoImports.config.mts'

export default defineConfig({
  plugins: [
    vue(),
    // `dts: false`: the declaration file belongs to `yarn dev` and `generate:dts`, and a test run
    // must not rewrite it.
    AutoImport({
      imports: autoImports,
      dts: false,
      vueTemplate: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    // `ci:checks` runs this next to the whole lint set, so a worker can lose the CPU for longer
    // than vitest's 5 s default -- and a timed-out test has been observed leaving state that makes
    // a later test in the same file fail as if the product were broken. These govern a single
    // test and a single hook; the slowest of either here is single-digit milliseconds, so the
    // margin is for starvation, not for slow code. `hookTimeout` defaults to 10 s and is raised
    // with it, or the hooks become the weaker link.
    testTimeout: 15000,
    hookTimeout: 15000,
    // Transforming the module graph is the bulk of a cold run. The cache lives under
    // `node_modules/.vitest-cache`, so a reinstall invalidates it.
    fsModuleCache: true,
    // Scoped to `src/`: `e2e/` holds the e2e specs, which vitest's default include would collect.
    include: ['src/**/*.{test,spec}.ts'],
    server: {
      deps: {
        // The auto-imported helpers come from the library bundle, which imports Vuetify CSS.
        // Externalized it would reach node's ESM loader as `Unknown file extension ".css"`.
        inline: [/@anzusystems\/common-admin/, /vuetify/],
      },
    },
  },
})
