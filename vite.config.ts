import path, { dirname } from 'path'
import { fileURLToPath, URL } from 'url'
import { defineConfig, type Plugin, type UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import vuetify from 'vite-plugin-vuetify'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

const _dirname = dirname(fileURLToPath(import.meta.url))
const shouldEnableSentry = !!process.env.APP_DEPLOY_ENV && !!process.env.SENTRY_URL

function watchCommonAdmin(): Plugin {
  const triggerFile = path.resolve(_dirname, '.common-admin-updated')
  const commonAdminPath = '/node_modules/@anzusystems/common-admin/'
  return {
    name: 'watch-common-admin',
    configureServer(server) {
      server.watcher.add(triggerFile)
      server.watcher.on('change', (file) => {
        if (file === triggerFile) {
          let count = 0
          server.moduleGraph.idToModuleMap.forEach((mod) => {
            if (mod.id?.includes(commonAdminPath) || mod.file?.includes(commonAdminPath)) {
              server.moduleGraph.invalidateModule(mod)
              count++
            }
          })
          console.log(`[watch-common-admin] Invalidated ${count} modules, reloading...`)
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}

export default defineConfig({
  build: {
    sourcemap: shouldEnableSentry ? 'hidden' : false,
    target: 'es2019',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core Vue runtime
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/vue-router/') ||
            id.includes('node_modules/pinia/') ||
            id.includes('node_modules/vue-i18n/') ||
            id.includes('node_modules/@intlify/')
          ) {
            return 'vue-core'
          }
          // Vuetify UI framework
          if (id.includes('node_modules/vuetify/')) {
            return 'vuetify'
          }
          // Anzu admin library
          if (id.includes('node_modules/@anzusystems/common-admin/')) {
            return 'common-admin'
          }
          // TipTap editor and ProseMirror
          if (
            id.includes('node_modules/@tiptap/') ||
            id.includes('node_modules/prosemirror-')
          ) {
            return 'tiptap'
          }
          // Realtime / sockets
          if (id.includes('node_modules/socket.io-')) {
            return 'realtime'
          }
          // Sentry
          if (id.includes('node_modules/@sentry/')) {
            return 'sentry'
          }
        },
        chunkFileNames: (chunkInfo) => {
          const toKebab = (str: string) => str
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

          const parts = toKebab(chunkInfo.name || 'chunk').split(/[-/]/).filter(Boolean)
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
    watchCommonAdmin(),
    VueRouter({
      routesFolder: 'src/pages',
      dts: 'src/typed-router.d.ts',
      importMode: process.env.NODE_ENV === 'production' ? 'async' : 'sync',
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
    }),
    vue(),
    vuetify({
      autoImport: true,
    }),
    VueI18nPlugin({
      runtimeOnly: false,
      globalSFCScope: true,
      include: path.resolve(_dirname, './src/locales/**.json'),
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          'vue-i18n': ['useI18n'],
          '@vuelidate/core': ['useVuelidate'],
          '@anzusystems/common-admin': [
            'isUndefined', 'isDefined', 'isNull', 'isString', 'isArray',
            'isInt', 'isNumber', 'isEmpty', 'isEmptyObject', 'isFunction',
            'dateTimeNow', 'dateTimeFriendly', 'cloneDeep', 'stringToInt',
            'stringToKebabCase', 'useAlerts', 'useValidate', 'defineBreadcrumbs',
            'defineCached', 'DATETIME_MAX', 'DATETIME_MIN', 'HTTP_STATUS_OK',
            'HTTP_STATUS_UNAUTHORIZED', 'SORT_BY_ID', 'useTheme',
          ],
        },
        {
          from: '@anzusystems/common-admin',
          imports: [
            'IntegerId', 'IntegerIdNullable', 'DocId', 'DocIdNullable', 'DatetimeUTC',
            'DatetimeUTCNullable', 'ValueObjectOption',
            'AnzuUserAndTimeTrackingAware', 'ResourceNameSystemAware', 'SortableItem',
          ],
          type: true,
        },
      ],
      dts: 'src/auto-imports.d.ts',
      vueTemplate: true,
    }),
    sentryVitePlugin({
      disable: !shouldEnableSentry,
      url: process.env.SENTRY_URL,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'petitpress',
      project: 'anzu-admin-dam',
      release: { name: process.env.GITVAR_SHORTVERSION },
      telemetry: false,
      sourcemaps: {
        filesToDeleteAfterUpload: './dist/**/*.js.map',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
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
