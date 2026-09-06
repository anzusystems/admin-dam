/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vitest/config'
// Root config files sit outside `src`, so the `@` alias does not resolve here.
// oxlint-disable-next-line no-restricted-imports
import { autoImports } from './autoImports.config'

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
    // Scoped to `src/`: `cypress/` holds the e2e specs, which vitest's default include would collect.
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
