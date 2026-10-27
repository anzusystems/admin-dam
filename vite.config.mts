import path, { dirname } from 'path'
import { URL, fileURLToPath } from 'url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import type { UserConfigExport } from 'vite'
import vuetify from 'vite-plugin-vuetify'
import VueRouter from 'vue-router/vite'
// oxlint-disable-next-line no-restricted-imports
import { anzuSentry, commonAdminDevWatch } from '@anzusystems/common-admin/vite'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

import { routerPages } from './routerPages.config.mts'

const _dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    target: 'es2019',
    rolldownOptions: {
      // Advisory only, and it fires on builds that are already fast. common-admin disables it the same way.
      checks: { pluginTimings: false },
      output: {
        codeSplitting: {
          groups: [
            {
              // What the app needs from common-admin at startup, in one chunk. The
              // library ships one file per module, so a page takes only what it imports.
              // `includeDependenciesRecursively` (the default, written out)
              // also pulls in their imports such as Vue, Vuetify and axios.
              // This measured the smallest first view in all six admins.
              // The cost is that the chunk changes when any of them does.
              name: 'common-admin',
              test: /node_modules[\\/]@anzusystems[\\/]common-admin[\\/]/,
              tags: ['$initial'],
              priority: 100,
              includeDependenciesRecursively: true,
              // Split into chunks under Vite's 500 kB warning. The limit counts modules
              // before minification: 900 KiB came out at most 480 kB in admin-cms.
              maxSize: 900 * 1024,
            },
            {
              name: (id) => {
                if (
                  id.includes('node_modules/vue/') ||
                  id.includes('node_modules/vue-router/') ||
                  id.includes('node_modules/pinia/')
                ) {
                  return 'vue-core'
                }
                if (id.includes('node_modules/vue-i18n/') || id.includes('node_modules/@intlify/')) {
                  return 'vue-i18n'
                }
                if (id.includes('node_modules/vuetify/')) {
                  return 'vuetify'
                }
                if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror-')) {
                  return 'tiptap'
                }
                if (id.includes('node_modules/@sentry/')) {
                  return 'sentry'
                }
                if (
                  id.includes('node_modules/axios/') ||
                  id.includes('node_modules/@vuelidate/') ||
                  id.includes('node_modules/@floating-ui/') ||
                  id.includes('node_modules/jwt-decode/') ||
                  id.includes('node_modules/universal-cookie/') ||
                  id.includes('node_modules/uuid/') ||
                  id.includes('node_modules/rusha/') ||
                  id.includes('node_modules/sortablejs/')
                ) {
                  return 'vendor-utils'
                }
              },
            },
          ],
        },
        chunkFileNames: (chunkInfo) => {
          const toKebab = (str: string) =>
            str
              .replace(/\?.*$/, '')
              .replace(/\.(vue|ts|js|json)$/, '')
              .replace(/\[|\]|\.\.\./g, '')
              .replace(/([a-z])([A-Z])/g, '$1-$2')
              .toLowerCase()

          const generic = ['id', 'edit', 'index', 'new', 'create', 'view', 'list']
          const moduleIds = chunkInfo.moduleIds
            ? Array.from(chunkInfo.moduleIds)
            : chunkInfo.facadeModuleId
              ? [chunkInfo.facadeModuleId]
              : []

          for (const id of moduleIds) {
            const srcMatch = id.match(/\/src\/(.+)$/)
            if (srcMatch) {
              const parts = toKebab(srcMatch[1]).split(/[-/]/).filter(Boolean)
              const last2 = parts.slice(-2)
              const isGeneric = last2.every((p) => generic.includes(p))
              const name = isGeneric ? parts.slice(-4).join('-') : last2.join('-')
              return `assets/${name}-[hash].js`
            }
          }

          const parts = toKebab(chunkInfo.name || 'chunk')
            .split(/[-/]/)
            .filter(Boolean)
          const last2 = parts.slice(-2)
          const isGeneric = last2.every((p) => generic.includes(p))
          const name = isGeneric ? parts.slice(-4).join('-') : last2.join('-')
          return `assets/${name}-[hash].js`
        },
      },
    },
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('supports css-cascade-layers')),
    },
  },
  plugins: [
    ...anzuSentry({ project: 'anzu-admin-dam' }),
    commonAdminDevWatch({ prebundle: process.env.COMMON_ADMIN_PREBUNDLE !== '0' }),
    VueRouter({
      ...routerPages,
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    vuetify({
      autoImport: true,
    }),
    VueI18nPlugin({
      runtimeOnly: false,
      globalSFCScope: true,
      include: path.resolve(_dirname, './src/locales/**/*.json'),
    }),
  ],
  optimizeDeps: {
    // Pre-bundled because some of these are imported only by lazy pages.
    // A dependency found that late reloads the page on a cold start.
    include: ['vue', 'vue-router', 'pinia', 'vue-i18n', '@vuelidate/core', '@anzusystems/common-admin'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['vuetify'],
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  preview: {
    port: 8172,
  },
} as UserConfigExport)
