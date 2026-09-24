import path, { dirname } from 'path'
import { URL, fileURLToPath } from 'url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import type { Plugin, UserConfigExport } from 'vite'
import vuetify from 'vite-plugin-vuetify'
import VueRouter from 'vue-router/vite'
// oxlint-disable-next-line no-restricted-imports
import { anzuSentry } from '@anzusystems/common-admin/vite'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

import { routerPages } from './routerPages.config.mts'

const _dirname = dirname(fileURLToPath(import.meta.url))

function watchCommonAdmin(): Plugin {
  const triggerFile = path.resolve(_dirname, '.common-admin-updated')
  return {
    name: 'watch-common-admin',
    configureServer(server) {
      server.watcher.add(triggerFile)
      server.watcher.on('change', (file) => {
        if (file === triggerFile) {
          // A restart, not a reload: the new files reach the page only once the optimizer has
          // bundled them again, and the browser keeps the old ones under an unchanged `?v=` (both
          // measured). `true` forces that re-optimization.
          console.log('[watch-common-admin] common-admin was replaced, restarting the server...')
          void server.restart(true)
        }
      })
    },
  }
}

export default defineConfig({
  build: {
    target: 'es2019',
    rolldownOptions: {
      // Advisory, and it fires on builds that are already fast -- common-admin switches it off
      // the same way.
      checks: { pluginTimings: false },
      output: {
        codeSplitting: {
          groups: [
            {
              // What the app needs from common-admin at startup, in one chunk: the library ships one
              // file per module, so a page takes only the modules it imports. With
              // `includeDependenciesRecursively` (the default, written out) the chunk also takes what those
              // modules import -- Vue, Vuetify, axios, ... -- which measured the smallest first view in all
              // six admins, at the cost of that chunk changing whenever any of them does.
              name: 'common-admin',
              test: /node_modules[\\/]@anzusystems[\\/]common-admin[\\/]/,
              tags: ['$initial'],
              priority: 100,
              includeDependenciesRecursively: true,
            },
            {
              name: (id) => {
                // Core Vue runtime
                if (
                  id.includes('node_modules/vue/') ||
                  id.includes('node_modules/vue-router/') ||
                  id.includes('node_modules/pinia/')
                ) {
                  return 'vue-core'
                }
                // i18n stack
                if (id.includes('node_modules/vue-i18n/') || id.includes('node_modules/@intlify/')) {
                  return 'vue-i18n'
                }
                // Vuetify UI framework
                if (id.includes('node_modules/vuetify/')) {
                  return 'vuetify'
                }
                // TipTap editor and ProseMirror
                if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror-')) {
                  return 'tiptap'
                }
                // Sentry
                if (id.includes('node_modules/@sentry/')) {
                  return 'sentry'
                }
                // Vendor utility libs (axios, vuelidate, floating-ui, jwt, cookie, uuid, rusha, sortablejs)
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
    watchCommonAdmin(),
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
    // What unplugin-auto-import used to have pre-bundled: some of these are imported only by lazily
    // loaded pages, and a dependency found that late reloads the page on a cold start.
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
